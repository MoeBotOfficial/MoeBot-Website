---
title: "QQ 平台接口说明"
description: "QQ 事件、Markdown、按钮、回复窗口与指令面板的开发参考。"
slug: "qq-api-notes"
version: "核心 / WebUI 0.8.6"
verifiedAt: "2026-10-29"
source: {"repository":"AnnaofArendelle/MoeBot","path":"docs/qq-api-notes.md","commit":"da740d62042c770e4f26542302155e6b60396b45","public":false}
imported: true
---

QQ 机器人开放平台 v2(Webhook + Access Token)接口的关键约束与坑。分两类标注:

- ✅ **本项目实测确认** —— 在本项目开发过程中亲自跑通、验证过的。
- 📖 **需查官方文档** —— 通用知识,数值可能随版本变化,用到时以 https://bot.q.qq.com/wiki 当前内容为准。

> 官方文档:https://bot.q.qq.com/wiki/develop/api-v2/

## 接入与回调

- ✅ **只能用 Webhook(v2)**,不是旧版频道的 WebSocket 网关那套。回调地址必须 **HTTPS**。
- 📖 回调地址端口只允许 **80 / 443 / 8080 / 8443**。
- ✅ **`workers.dev` 从中国大陆访问被墙,QQ 回调打不进来**;`pages.dev` 在本项目线路可达。若不通,回退方案是绑自定义域名(换 SNI)。详见主 README。
- ✅ QQ 官方请求的 `User-Agent` 是 `QQBot-Callback`,带 `X-Bot-Appid` 头,可据此和公网扫描噪声区分。

## op=13 回调验证(最易写错)

- ✅ 配置回调后,平台先发 `op:13` 验证:`{"op":13,"d":{"plain_token":"...","event_ts":"..."}}`。
- ✅ 签名算法 **Ed25519**:
  - 种子 = `AppSecret`,不足 32 字节时**重复拼接再截断到 32 字节**。
  - 待签名消息 = **`event_ts + plain_token`**(顺序不能反)。
  - 输出 **hex 编码**,返回 `{ plain_token, signature }`,HTTP 200。
- ✅ **Cloudflare Web Crypto 用 `Ed25519`**(不是 `NODE-ED25519`),且**私钥只能 pkcs8 导入,不支持 raw**——所以代码里在 32 字节种子前拼了固定的 PKCS8 DER 前缀。
- ⚠️ 若后台报"签名校验不通过",**先排查回调地址是否真的被 QQ 访问到**(看日志有没有 `QQBot-Callback` 请求)。本项目踩过:其实是 workers.dev 被墙、请求根本没进来,后台却笼统报成签名错误,极易误导方向。

## 事件(op=0)

本项目处理三类消息事件。群里到底收到哪一类,取决于后台订阅设置(见主 README「群消息的两种模式」):

- ✅ `C2C_MESSAGE_CREATE`(私聊):`d` 含 `id`、`content`、`author.user_openid`、`timestamp`。
- ✅ `GROUP_AT_MESSAGE_CREATE`(**只订阅「群@消息」**时收到,只有 @ 机器人的消息):`d` 含 `id`、`content`、`group_openid`、`author.member_openid`。被 @ 的 `<@...>` **已被平台剥掉**,`content` 只残留前导空格。
- ✅ `GROUP_MESSAGE_CREATE`(**开了「获取群内全部消息」**后收到,群里所有消息):字段大体同上,但有三点不一样,踩过好几次:
  - `author` 结构不同 —— 是 **`author.id`**(**没有 `member_openid`**),而且**带 `author.username`(昵称!)**。
  - `content` **保留原始的 `<@机器人openid>` 前缀,不剥**。
  - 是否 @ 了机器人,靠 **`d.mentions[].is_you === true`** 判断(整个 `mentions` 不存在 = 没人被 @;有但没 `is_you` = @ 的是别人)。
- ⚠️ **开了全量后,@ 机器人的消息也走 `GROUP_MESSAGE_CREATE`,不再是 `GROUP_AT_MESSAGE_CREATE`。** 只认后者的适配器会把这些消息在 `toMessage` 里 `return null` 丢掉,表现为"连 @ 都不回"。本项目两类事件都认。
- ✅ **昵称**:`GROUP_AT` / `C2C` 事件的 `author` **只有匿名 openid,没有 nickname/username**(隐私设计,和旧频道 API 不同),也没有反查接口。**例外:`GROUP_MESSAGE_CREATE`(全量模式)带 `author.username`** —— 全量模式下反而拿得到昵称。
- ✅ **openid 是"每群/每场景"的匿名 ID**,不是 QQ 号,跨群不通用。
- ✅ **命令匹配前先归一化正文**:`GROUP_AT` 的 `content` 带**前导空格**(@ 部分剥掉后残留),全量模式则带 **`<@openid>` 前缀**。两种都要处理(`trim()` + 剥掉开头的 `<@...>`)再做精确匹配,否则全量模式下 `<@机器人> .jrrp` 会匹配不上、掉进 AI 兜底。

## Access Token

- ✅ `POST https://api.bot.qq.com/app/getAppAccessToken`,body 字段名是 **`appId` / `clientSecret`**(不是 app_id/secret,易错)。
- ✅ 返回 `{ access_token, expires_in }`,有效期约 **7200 秒**。
- ✅ 鉴权头是 **`Authorization: QQBot {access_token}`**(旧的 `Bot {token}` 已废弃)。
- 📖 令牌接近过期前 60 秒请求会返回新令牌,旧令牌在这 60 秒内仍有效(平滑切换)。本项目为保持无状态,每次发送前重新取,没做缓存。

## 消息发送

- ✅ 私聊:`POST /v2/users/{openid}/messages`;群聊:`POST /v2/groups/{group_openid}/messages`。
- ✅ body:`content`、`msg_type`(**0 = 纯文本**)、`msg_id`(被动回复填事件 `d.id`)、`msg_seq`。
- ✅ **被动回复群消息时,QQ 会自动在开头 @ 发送者并渲染成昵称**——所以不用自己拼名字。
- ⚠️ **但自动 @ 只在 `GROUP_AT_MESSAGE_CREATE` 上有;全量模式(`GROUP_MESSAGE_CREATE`)的被动回复不会自动 @**(实测:哪怕消息 @ 了机器人也不加)。全量模式想 @ 发送者,只能拿事件里的 `author.username` 自己拼纯文本 `@昵称`(见下一条:真 @ ping 拼不出来,只能拼昵称文本)。本项目 jrrp 就是靠事件类型区分:`GROUP_AT` 留空交给自动 @,全量模式自己拼昵称,避免两个 @ 叠一起。
- ✅ **自己拼的 `<@openid>` 在群纯文本里不会被渲染**,会原样显示成乱码串。想要真正可点击、会通知的 @ ping,靠的是被动回复的自动 @(见上条),别手拼 `<@openid>`。
- 📖 **被动回复有效期**（2026-10-24 官方消息收发概述）：群聊 **5 分钟**，单聊 **60 分钟**。过期回复会失败，本项目不转成主动发送。
- 📖 **同一 `msg_id` 的回复次数**：群聊 **5 次**，单聊 **4 次**；`msg_seq` 递增且不可重复。本项目同一事件共用序号，0.8.5 后台续办延续原事件已用序号，发送前检查剩余额度与期限。来源：https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/overview.html 。
- 📖 **主动消息(无 msg_id)有严格频率/额度限制**,且沙箱/未上线机器人额度很小。当前项目只做被动回复,不碰主动推送。
- 📖 富媒体(图片/语音/视频)、markdown、按钮等有各自的接口、大小限制和审核要求,用到时单独查文档。

### Markdown 消息(0.8.0 起)

- ✅ 群聊/单聊的自定义 Markdown 已对全部机器人开放(2026-04 公告),无需申请模板;频道场景仍需内邀。
- ✅ 发送:`msg_type=2` + `markdown.content`;此时不能再带 `content`/`ark`(否则 50037 / 22006)。`msg_id`/`msg_seq` 与文字相同,被动回复不吃主动额度。
- ✅ 支持的语法:一级/二级标题(#/##)、粗体、斜体、删除线、行内与自动链接、图片(`![说明 #宽px #高px](url)`)、有序/无序/嵌套列表、块引用(>)、分割线(***);多行用空行分隔。
- ⚠️ 图片 URL 必须是公网可访问的直链,腾讯会下载转存;`force_verify_image_resource: true` 时转存失败会直接报错(默认 false 静默容忍)。本项目不发送该字段,依赖 QQ 默认行为。
- ⚠️ 内容超长报 40054007(社区建议 ≤4000 字符);空内容/参数报 50041 / 40034008 / 40034011;不允许的 URL 报 40054010。模板 `params` 的值不允许换行(40034009),自定义 `content` 不受此限。
- 📌 本项目实现:适配器 `sendMarkdown()`,对声明并获授权的 Markdown 插件，以及管理员配置的关键词回复开放(见 docs/plugins.md);AI 模块不使用,也不进入聊天历史。

## 通用避坑

1. **以官方文档当前内容为准。** 第三方教程、旧代码、旧频道 API 写法都可能过期。
2. **沙箱 vs 上线**:未上线的机器人通常只能在配置的测试频道/测试群里用,权限和额度受限。
3. **返回体要看 `code`/`message`**,别只看 HTTP 状态。发送失败时 QQ 会在 body 里给出错误码。

## 0.8.1 Markdown 内嵌按钮

QQ 群聊和私聊 msg_type=2 使用 `keyboard.content.rows` 挂载自定义按钮。支持 type=2 指令与 type=1 回调；按钮授权、SDK 和幂等限制见 [插件文档](/docs/developers/plugin-runtime/#markdown-按钮核心-081--sdk-140)。订阅 INTERACTION intent `1 << 26` 后处理 INTERACTION_CREATE；type=11/12 只尝试一次 PUT `/interactions/{d.id}`，body `{code}`。后续消息使用外层 `payload.id` 的 event_id，d.id 专用于互动回应。无需 AI 完整配置也能处理互动；BOT_ENABLED=false 返回无权限回应。

官方自定义键盘标为「内邀开通」，需确认机器人权限及事件订阅。文档：[msg-btn](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/trans/msg-btn.html)、[interaction_create](https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/interaction_create.html)、[interaction PUT](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/interactions_interaction_id.put.html)。
