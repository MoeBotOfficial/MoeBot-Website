---
title: 插件开发
description: 插件清单、能力授权、运行契约、配置与密钥、测试和 ZIP 发布。
slug: developers/plugins
version: 核心 / WebUI 0.8.6 · SDK 1.4.0
verifiedAt: "2026-10-29"
---

## 插件与适配器的分工

插件在现有平台接入之上扩展命令、回复和上下文；适配器负责平台请求、事件转换、消息发送和平台权限。插件通过 SDK 工作，不接触 CF Token、QQ AppSecret、原始 ENV 或 D1 对象。

当前插件可通过 WebUI 上传 ZIP 并重新部署安装。适配器是核心构建中的代码，需要核心仓库权限及重新发布；SDK 尚无适配器开发 API。

## 从示例开始

推荐从公开的 Daily 或 Markdown Demo 仓库开始：

```sh
npm ci
npm run typecheck
npm test
npm run build
```

Daily 测试覆盖每日存储/图片等能力；Markdown Demo 用于学习 Markdown、指令按钮和互动回调。以上命令只构建/测试本地插件，安装到机器人仍需 WebUI 保存并部署。

安装 SDK 时固定版本，例如当前 SDK 1.4.0：

```sh
npm install -D https://github.com/MoeBotOfficial/MoeBot-Plugin-SDK/releases/download/v1.4.0/qq-bot-plugin-sdk-1.4.0.tgz
```

## 包结构与构建

源码通常包括 `plugin.json`、`config.schema.json`、`src/index.ts` 和测试。构建器 `qq-plugin build` 用 esbuild 生成独立 ESM，并校验导出、生成代码哈希、打包 ZIP。

发布 ZIP 的根目录严格为三个文件：

```text
plugin.json
config.schema.json
plugin.mjs
```

依赖必须编入单个 ESM。不要使用 Node 内置模块、外部 import、dynamic import 或 import.meta。GitHub 自动生成的 Source code ZIP 不是插件安装包。

`plugin.json` 声明稳定 `id`、SemVer `version`、`apiVersion: 1`、命令和所需能力；`config.schema.json` 描述 WebUI 表单。ID 也是存储身份，同一插件更新不要随意改 ID。

## 运行契约

| 接口 | 用途与约束 |
| --- | --- |
| onCommand(ctx) | 处理 exact/prefix 命令；触发词不可含空白，不能与启用命令或核心保留指令冲突 |
| beforeModel(ctx) | 声明 model.context 后补充现有 AI 请求的系统上下文，不创建额外模型请求 |
| onInteraction(ctx) | 处理已签名的 Markdown 回调按钮，及时回应互动后再发送后续消息 |
| ctx.reply.text/image/markdown | 每次命令共用最多 3 次 SDK 回复；Markdown/按钮需声明并获管理员授权 |
| ctx.storage | 插件 ID 隔离的 JSON KV；单值最多 4000 字符、每次最多 8 次操作 |
| ctx.http.json | HTTPS GET；最多 4 次、单响应最多 1 MiB、1–15 秒超时，不跟随重定向 |
| ctx.commands/runtime | 命令目录、核心版本、按需读取的已确认生产部署时间 |

SDK 权限检查是可信插件的使用约定，不能隔离恶意 JavaScript。插件与核心处于同一 Worker isolate，共享 CPU；同步死循环不能可靠抢占。异步处理必须 await，不保存过期 context，不用全局内存保存业务数据。

## 配置与能力授权

schema 当前支持一层 string、boolean、integer、number，以及标题、说明、默认值、枚举、长度/数值范围。暂不支持嵌套对象、数组或自定义浏览器脚本。

字符串 `x-secret: true` 生成密钥控件，插件包不可带非空默认密钥。密钥由管理操作合并到 CF Secret，仅在运行时注入插件配置。

Markdown 最低核心 0.8.0，按钮最低核心 0.8.1 / SDK 1.4.0。需要分别声明 reply.markdown、reply.keyboard 并在 WebUI 授权，默认关闭。QQ 普通自定义 Markdown 已开放；自定义按钮仍需确认平台开通条件并订阅 INTERACTION_CREATE。发布前必须测试未授权、停用、群聊/私聊范围和旧核心降级。

## 安装、升级与数据

在 WebUI 上传 `dist/<id>-<version>.zip`，检查设置、开关、范围和授权，然后保存并部署。只有生产部署、程序构建与配置代次确认匹配后，管理界面才报告生效。

同 ID 升级保留兼容配置，新增能力授权默认关闭；卸载默认保留 D1 数据，重装同 ID 可以继续读取。代码回滚不等于数据回滚。SDK、核心和 WebUI 的 `protocol.js` 是同步副本，修改协议需要保持三份字节一致并同步检查版本与能力标记。
