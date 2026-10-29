---
title: "Markdown 与按钮示例"
description: "学习 Markdown 消息、指令按钮、互动回调和管理员能力授权。"
slug: "developers/markdown-demo"
version: "Markdown Demo 0.2.0"
verifiedAt: "2026-10-29"
source: {"repository":"MoeBotOfficial/MoeBot-Plugin-Markdown-Demo","path":"README.md","commit":"c11da31bb658dd8e9c51fb03d9ac9ef88fd195c1","public":true}
imported: true
---

最小示例：演示 0.8.0 起的插件 Markdown 消息能力。安装并授权后，在群聊或私聊发送 `/md`，机器人会用 QQ Markdown 回复一条示例。

## 用户安装

1. 后端需要 0.8.1 或更新版本。
2. 从 [Releases](https://github.com/MoeBotOfficial/MoeBot-Plugin-Markdown-Demo/releases) 下载 `markdown-demo-0.2.0.zip`，在 WebUI「插件管理」上传（不要用 GitHub 自动生成的源代码 ZIP）。
3. 展开该插件的「插件设置」，勾选「Markdown 消息」（默认关闭），启用插件，点击「保存并部署」。
4. 在群里发送 `/md` 查看 Markdown 效果；未授权时插件会回复文字提示，引导打开授权。

## 说明

- 插件在 `plugin.json` 声明 `reply.markdown` 能力；这是申请，不是授权。管理员不勾选时 `ctx.reply.markdown` 不存在，插件自动降级为文字。
- QQ 群聊/单聊的自定义 Markdown 已对全部机器人开放（无需申请模板）。支持的语法：标题、粗体、斜体、删除线、链接、图片（公网直链）、列表、引用、分割线。
- 0.7.x 及更早的核心会明确拒绝本插件（权限表校验），不会静默装上后出错。

## 开发

```sh
npm ci
npm run typecheck
npm test
npm run build   # 生成 dist/markdown-demo-0.2.0.zip
```

基于 [Plugin SDK](https://github.com/MoeBotOfficial/MoeBot-Plugin-SDK) 构建，可对照 daily / essentials 两个官方插件。

许可证：[MIT](https://github.com/MoeBotOfficial/MoeBot-Plugin-Markdown-Demo/blob/c11da31bb658dd8e9c51fb03d9ac9ef88fd195c1/LICENSE)。

## 0.2.0 按钮演示

最低核心 0.8.1、SDK 1.4.0。在插件设置中同时授权「Markdown 消息」和「Markdown 按钮」，保存并部署。发送 `/mdbuttons`，点击「查看 Markdown」自动发送 `/md`；点击「确认回调」先通过互动接口回应成功，再回复确认文字。未授权时降级为文字提示，原 `/md` 保持兼容。更新插件保留 title、启用状态、范围及现有授权；新增按钮授权默认关闭。

QQ 需要订阅 INTERACTION_CREATE（intent 1 << 26），官方自定义按钮标为「内邀开通」，须确认平台权限。callback data 由核心签名、还原并验证，不进入 AI 或聊天历史。上线后升级或签名密钥轮换会使旧消息按钮失效，重新发送 /mdbuttons 获取新按钮。

验证：npm run typecheck、npm test。测试覆盖无授权降级、两类按钮、回调回应与文本确认，不发送真实 QQ 消息。
