---
title: "独立部署 WebUI"
description: "下载、校验、解压 WebUI 发布包，使用 Vercel CLI 部署和更新静态控制台。"
slug: "webui-deployment"
version: "核心 / WebUI 0.8.6"
verifiedAt: "2026-10-29"
source: {"repository":"MoeBotOfficial/MoeBot-webUI","path":"docs/deploy-release.md","commit":"523b72c23df33a41ef4524a4a8765711b1cd0072","public":false}
imported: true
---

需要 Node.js 22 或更新版本，以及能部署目标项目的 Vercel 账号。

## 下载与校验

从同一个可信的 [GitHub Release](https://github.com/MoeBotOfficial/MoeBot-webUI/releases) 下载：

- `qq-bot-webui-<版本>.zip`：完整静态前端与部署配置。
- `qq-bot-webui-release.json`：源提交、构建标识和逐文件 SHA-256。
- `SHA256SUMS`：ZIP 和发布清单的 SHA-256。

不要下载 GitHub 自动生成的 Source code ZIP 来代替部署包。私有仓库的 Release 仍需要仓库访问权限。

Linux 在三个文件所在目录运行 `sha256sum -c SHA256SUMS`；macOS 使用 `shasum -a 256 -c SHA256SUMS`。Windows PowerShell 使用 `Get-FileHash .\qq-bot-webui-<版本>.zip, .\qq-bot-webui-release.json -Algorithm SHA256`，将两个结果与 `SHA256SUMS` 中对应值比较。校验值用于检查内容完整性，下载来源仍应是你信任的 Release。

将 ZIP 解压到一个新的空目录。进入其中包含 `public`、`vercel.json` 和 `verify.mjs` 的目录，运行：

```sh
node verify.mjs
```

不需要安装项目依赖。校验器会检查文件内容、大小、构建清单，以及缺失或额外文件；校验不通过时先重新下载。Vercel 后续创建的本地 `.vercel` 关联目录不参与文件校验。

## 部署到 Vercel

在解压后的目录运行：

```sh
npx vercel login
npx vercel --prod
```

按照 CLI 提示选择自己的团队，以及新建或已有项目。已有项目请选择原项目，避免创建重复站点。项目使用 Other 框架、`public` 输出目录、空安装命令和空构建命令；`vercel.json` 已提供这些设置及 PWA 所需响应头。

这是静态部署目录包，使用普通 `vercel --prod`；它不是 `.vercel/output` 格式的 `--prebuilt` 包。Vercel CLI 不直接把 ZIP 当作站点解压，必须先解压。将 ZIP 文件作为单个静态文件上传也不会部署其中的应用。

包中没有固定的 Vercel 项目 ID、账号凭据或机器人配置。发布包解压部署不带 Git 元数据，但 `release.json` 保留来源提交。CLI 需要登录并拥有目标团队的部署权限。此方式本身不会建立 Git 集成；未连接 Git 集成的站点需要下载新 Release，校验后关联原项目再次部署。已有项目若已连接 Git 集成，其原有自动部署规则仍然生效。

## 部署后

打开 Vercel 返回的正式地址，填写已有 Pages 后端地址和自己的 CF Token，连接机器人。CF Token、QQ AppSecret 和 AI 密钥不需要配置到 Vercel 环境变量中。

前端部署包不会创建或升级 CF 后端；更新后端继续使用 WebUI 的“更新程序”和后端 `qq-bot-release.json`。

PWA 更新下载完成后，先完成当前操作，再关闭所有旧控制台窗口并重新打开。许可证与第三方声明分别见 `LICENSE` 和 `THIRD_PARTY_NOTICES.md`。
