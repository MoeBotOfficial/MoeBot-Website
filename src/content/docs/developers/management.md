---
title: "管理与恢复协议"
description: "管理鉴权、D1 初始化、完整安装恢复、配置代次与部署状态确认。"
slug: "developers/management"
version: "核心 / WebUI 0.8.6"
verifiedAt: "2026-10-29"
source: {"repository":"AnnaofArendelle/MoeBot","path":"docs/management-deployment.md","commit":"da740d62042c770e4f26542302155e6b60396b45","public":false}
imported: true
---

## 连接与认证

`POST /admin/connect` 使用 `Authorization: Bearer <CF API Token>`。响应保持 API v1，并以 `capabilities` 宣告 `relay:1`、`onboarding`、`secretRead`、`adapters`、`dataBrowser`、`liveLogs`、`plugins:1`；`qqBind:false` 表示已移除扫码创建。旧前端 `/admin/apply` 返回 CLIENT_UPGRADE_REQUIRED，避免覆盖插件；新版前端通过下面的原语编排部署，避免在 Pages 做发布包计算。

新上传的 ZIP 不需要预填 ENV。没有 `CF_ACCOUNT_ID` / `CF_PAGES_PROJECT` 时，前端发送 `X-CF-Account-ID` 和 `X-CF-Pages-Project`。后端通过 CF 返回的生产域名核实目标，其他账户或项目的 Token 不能读取本部署的密钥。首次保存时写入这两个目标变量；之后使用 ENV 中的固定目标，不接受客户端更改。

`ADMIN_ALLOWED_ORIGINS` 可限制前端来源，多个来源以英文逗号分隔。未设置时允许 HTTPS 和本机 HTTP 来源，每次管理操作仍需 Token。所有管理响应 `Cache-Control: no-store`，不缓存或打印凭据。

## 管理接口

| 接口 | 用途 |
| --- | --- |
| `POST /admin/connect`、`GET /admin/status` | 版本、目标、脱敏配置、适配器描述与状态、权限和修订号；不查 D1 |
| `GET /admin/plugins` | 已部署插件的描述、开关、普通配置和密钥存在状态 |
| `GET /admin/installation` | 验证编辑权限后恢复当前核心发布包和插件包 |
| `GET /admin/storage` | 单独检查当前运行的 DB 绑定和表结构 |
| `POST /admin/providers/models` | `{provider:{id,baseUrl,apiKey,headers}}`，按需拉取模型与元数据，需要 Pages 编辑权限；0.7.2 起支持 |
| `POST /admin/secrets` | `{name:"QQ_APP_SECRET"}` 或 `{name:"AI_PROVIDERS"}`，读取当前运行值，额外验证 Pages 编辑权限 |
| `POST /admin/cf` | 下面列出的 CF 操作原语 |
| `POST /admin/deploy` | 浏览器生成的 multipart 部署包，加 `baseRevision`，后端校验并转发 |
| `GET /admin/deployments/:id` | 部署阶段、是否生产激活、实际构建和配置代次 |
| `GET /admin/releases`、`POST /admin/artifact` | 固定发布仓库的公开版本 / 发布包；不发送 CF Token |

CF 原语 `operation`：

- `d1-list`：`page`，每页 100 项。
- `d1-create`：`name`，返回 ID 和名称。
- `d1-query`：`databaseId, sql, params?`。固定为当前账户的 D1 API，最多 32000 字符 SQL、64 个参数，需相应 D1 权限。参数与 SQL 分开转发；初始化和数据浏览使用同一原语。
- `logs-start`：只连接项目当前 `canonical_deployment`，创建 CF tail，返回部署 ID、会话 ID 与临时 WebSocket URL。
- `logs-stop`：`deploymentId, tailId`，只可删除当前固定项目下的日志会话。
- `upload-token`：获得 CF Pages 临时上传 JWT。
- `assets-check` / `assets-upload` / `assets-register`：`uploadToken, payload`，仅固定 Pages assets 接口。
- `project-update`：`baseRevision, changes:{set,delete}, databaseId?, pluginPlan:{items,artifactKey,secretChanges}`；验证可编辑配置字段，保留其他绑定和未修改 ENV，生成 `CONFIG_GENERATION`。返回新修订号和代次。

不接受任意 URL、账户、HTTP 方法或请求头作为代理目标。返回 CF 错误时追加 Cloudflare 的错误码与说明，便于定位原因；转发前移除本次请求的 Token 和所有 `secret_text` 值，去掉控制字符并截断到 300 字符，错误仍不写入日志。上游请求不跟随重定向。

## D1 和部署流程

数据库创建、选择、初始化、旧 `messages.source` 字段迁移由浏览器执行。初始化 SQL 来自当前后端鉴权接口 `/admin/installation` 返回的 release.schemaSql，与程序一同构建。结构检查只发生在向导或主动检查时，不读取聊天正文。已有结构不兼容时停止，不删表；重复执行使用 `IF NOT EXISTS`，重试先通过名称核实是否已创建。

浏览器在 sessionStorage 记录待绑定数据库的名称和 ID，重新连接后重新校验。此记录不包含 Token 或 QQ / AI 凭据；Token 使用独立连接存储。关闭页面可能丢失未保存的凭据编辑，用户可重新填写。

浏览器恢复全部插件、校验发布包与插件、组装独立模块及加密恢复文件、计算 Pages 内容哈希、上传资源，然后保存 ENV 与 `DB` 绑定，最后提交 multipart 部署。只有生产部署 ID、阶段、实际程序构建和 CONFIG_GENERATION 都匹配才显示生效。D1 准备与 QQ 凭据收集可以合并为一次部署；更换 D1 不迁移聊天记录，原库保留。

项目设置保存和部署不是原子操作；版本检查不防止所有竞争。网络超时可能发生在 CF 已保存之后，应在 CF 核实，不要盲目重试创建或清除资源。

## 适配器注册与实时日志

`adapters/definitions.js` 声明适配器 ID、字段、必填项、开关和路径；`adapters/index.js` 绑定处理器并检查重复路径。QQ HTTP 入口在 `adapters/qq-webhook.js`，规范路径 `/webhook/qq`，保留 `/webhook`、`/`。配置就绪检查只要求已开启适配器的字段；QQ 消息处理单独检查本适配器与公共配置。管理状态包含描述和 `enabled/configured/missing/errors`，不代表官方平台已验证。添加其他适配器仍需实现后端处理器，不是前端动态安装插件。

`POST /admin/qq` 已删除并返回 404，不再请求 QQ 扫码服务。

CF tail URL 只接受 `wss://tail.developers.workers.dev`。浏览器以 `trace-v1` 子协议接收二进制 JSON 帧，并发送 `{debug:false}`；流量直接在浏览器与 CF 之间传递，不经过机器人。会话创建与关闭均认证，Token 不进入 WebSocket URL / 消息。前端取消尚未完成的创建时，会在响应到达后清理会话。页面关闭时尽力清理；网络中断时由 CF 过期回收，不自动重连。日志不存 D1、ENV 或浏览器持久存储，不支持查询连接前的历史记录。

数据浏览先查 `sqlite_master` 的用户表元信息，再用参数化 `pragma_table_info(?)` 查字段；取记录 / 统计行数均由用户主动点击。表与列标识符转义，结果按文本呈现，避免执行数据中的 HTML。初次列出最多 200 张用户表，每页最多 20 行 / 32 列，文本前 500 字符。OFFSET 分页和显式统计可能扫描较多行，均使用 D1 额度。

## 密钥与配置读取

普通状态接口只返回密钥存在状态；显式读取接口返回**当前运行部署**的值，并要求编辑权限。已知保存代次与运行代次不一致时拒绝读取，避免把旧密钥编辑回去。直接在 CF 控制台修改 Secret 不会经过本系统的代次标记；这种情况应先部署，再在 WebUI 编辑，不能把运行值当成尚未部署的最新 CF 值。

提供商 JSON 使用 `secret_text`，人格和其他普通配置使用 `plain_text`。公开发布包、浏览器持久存储和日志均不得含 QQ / AI 凭据。生产升级保留旧 ZHIPU / MISTRAL / AI_SYSTEM_PROMPT ENV，用户保存新列表后才切换格式，避免升级中断。

## 恢复

| 状态 | 处理 |
| --- | --- |
| 首次缺少部署目标 | 在连接页填账户 ID 和项目名，使用生产 pages.dev 地址 |
| D1 权限不足 | 给当前账户的 Token 增加 D1 编辑权限 |
| D1 创建超时 | 重试前通过同名数据库列表核实，已有库会复用 |
| 旧表结构不兼容 | 停止初始化，备份并迁移，或选择其他数据库 |
| 已保存但部署失败 | 刷新配置，重新部署已保存配置；更新包可重新选择 |
| 密钥读取提示未生效 | 先完成部署，再读取当前密钥 |
| 实时日志无法连接 | 检查 Pages 编辑权限及浏览器到 Cloudflare WebSocket 的网络；重新连接当前生产部署 |
| 自管理接口不可用 | 从 CF 控制台回滚或通过 Wrangler 上传可信发布包 |

AppID / AppSecret 配置齐全不代表官方回调验证成功；回调需用户在 QQ 开放平台完成。静态 WebUI 无法在不增加持久状态的情况下推断历史回调验证结果。


### 部署时间确认（0.7.7+）

`capabilities.runtimeInfo === 1` 时，在部署状态成功、当前程序和配置代次匹配后，使用同一编辑令牌调用 `POST /admin/runtime`，JSON 为 `{deploymentId, buildId, generation}`。这三个值来自本次已确认的部署；不得发送客户端时间。响应 `runtime` 包含 `deploymentId`、`buildId`、`version` 和 Cloudflare 部署完成时间 `deployedAt`（ISO 8601）。此接口需要 Pages 编辑权限及就绪的 D1；预览部署或标识不匹配会拒绝。重复确认不会重置计时。记录失败时保留已上线状态，重试确认后再同步指令面板。
