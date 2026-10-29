---
title: 快速开始
description: 准备账号、安装 CF Pages 后端，再通过 WebUI 完成数据库、QQ 与模型配置。
slug: getting-started
version: 核心 / WebUI 0.8.6
verifiedAt: '2026-10-29'
---

MoeBot 的后端部署到你自己的 Cloudflare Pages，官方 WebUI 用来配置和管理。首次安装、机器人配置、QQ 平台回调是三个阶段。官网无需登录或激活，候补名单也不影响安装。

## 准备账号与应用

准备以下内容：

| 内容 | 用途 |
| --- | --- |
| Cloudflare 账户 | 部署 Pages 后端和 D1 数据库 |
| CF 账户 ID、API Token | WebUI 连接和配置；Token 需要当前账户的 Pages、D1 编辑权限 |
| 支持 Webhook 的 QQ 官方机器人 | AppID、AppSecret、事件订阅与回调 |
| 可选的模型服务 | 提供商、API Key 和模型；也可以先关闭 AI |

不要在官网或候补表单中填写上述密钥。详情见 [QQ 应用与回调](/docs/qq-setup/)。

## 获取首次安装包

后端和 WebUI 仓库目前私有。内测首装包由维护者分发，或由已有仓库读取权限的用户下载。官网不提供公开安装包，也不能让匿名访客直接下载私有 GitHub Release。

首次安装使用 **`qq-bot-pages.zip`**。已有实例升级使用 **`qq-bot-release.json`**，两种产物不能混用。

> 0.8.6 首装包含默认 `/sys`、`/help` 关键词，无预装插件、D1 绑定、QQ 或模型凭据。插件在后续按需要安装。

## 上传到 Cloudflare Pages

1. 在 Cloudflare 控制台进入 Workers & Pages，创建 Pages 项目，选择直接上传静态资源。
2. 使用新的项目名，上传可信的首装 ZIP 或按界面要求上传解压内容。发布后以 CF 显示的真实地址为准。
3. 打开 `https://你的实际子域名.pages.dev/health`，确认服务为 `qq-bot-webhook`，并核对构建版本。

项目名与 `pages.dev` 子域名可能不同，地址被占用时 CF 会加后缀，不能只凭项目名拼 URL。

**完成条件：** Pages 生产部署成功，后端健康检查能读取正确服务。

有仓库权限的开发者也可以手动使用现有首次部署 Actions；它拒绝已有部署的项目，不能作为已有实例升级器。

## 连接 WebUI，完成初始配置

打开 [官方 WebUI](https://qq-bot-webui.vercel.app)，填入实际后端地址与 CF Token。首次没有目标 ENV 时，按提示填写账户 ID 和 Pages 项目名。建议使用默认生产 `pages.dev` 地址。

1. **准备 D1：** 自动创建或选择数据库，初始化表结构。已有结构不兼容会停止，不删除旧表。
2. **填写 QQ：** 输入 AppID 和 AppSecret，QQ 应用需要支持 Webhook。
3. **配置模型：** 设置提供商、API Key、模型和人格，或选择暂不使用 AI。
4. **保存并部署：** 一次应用数据库绑定和配置。等待控制台确认目标生产部署、程序构建和配置代次已生效。

**完成条件：** 控制台连接成功、数据库就绪、配置部署已确认。仅看到配置保存不等于生产已切换。

## 验证 QQ 回调与第一条消息

配置生效后，在 QQ 开放平台回调设置中填入：

```text
https://你的实际后端地址/webhook/qq
```

订阅需要的群聊/私聊事件，按平台要求验证。QQ 凭据齐全不等于回调验证通过，最终以平台结果为准。

完成后发送 `/help` 或其他已配置消息，检查实际响应。

**完成条件：** QQ 平台回调验证通过，并收到机器人回复。

## 下一步

- [配置模型与人格](/docs/ai-personas/)
- [关键词与命令面板](/docs/keyword-replies/)
- [安装插件](/docs/plugin-installation/)
- [保留配置升级](/docs/upgrades/)
- [遇到问题](/docs/faq/)
