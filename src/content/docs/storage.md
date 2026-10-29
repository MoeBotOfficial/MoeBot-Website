---
title: "数据库与存储"
description: "D1 数据结构、SQLite 查询边界与按会话、插件分离的数据存储。"
slug: "storage"
version: "核心 / WebUI 0.8.6"
verifiedAt: "2026-10-29"
source: {"repository":"AnnaofArendelle/MoeBot","path":"docs/storage.md","commit":"da740d62042c770e4f26542302155e6b60396b45","public":false}
imported: true
---

机器人运行时通过 `storage/index.js` 的 `getDatabase(env)` 取得 SQLite 执行接口。没有绑定时返回 null，不发查询。只有 `storage/d1.js` 接触 Cloudflare DB 绑定、prepare/bind 和平台结果。

| 操作 | 输入 | 返回 |
| --- | --- | --- |
| all | SQL 字符串、参数数组（默认空数组） | 行对象数组，缺失 results 时为空 |
| first | SQL 字符串、参数数组 | 首行或 null；允许 INSERT/UPDATE RETURNING |
| run | SQL 字符串、参数数组 | `{changes,lastInsertRowid}`，零变更保持零 |

SQL 使用 SQLite 语义和 `?` 位置占位符。值与 SQL 分开传入；适配器不拼接值、不改写 SQL、不拆分条件 UPSERT、不新增读取、不自动重试。错误原样抛给原调用方决定降级。不能用先 SELECT 再 UPDATE 替代一次条件更新或 RETURNING：并发抢占、取消、按天保留依赖同一语句的原子性。

存储目录中的 operations 提供现有聊天/主动/旧数据操作；tasks 管 MCP 状态；plugins 提供按插件 ID 隔离的 KV；runtime 管部署时间；schema 管只读结构检查。功能模块调用这些操作，不使用 DB 绑定或 D1 statements。原 d1Store/getStore 和 mcp/tasks、admin/storage、runtime-info 导出入口保留兼容。

管理端通过 storage/cloudflare.js 的相同 SQL/params 方法访问账户数据库。`execute(sql,params?)` 专门保留已有 d1-query 管理 API 的多语句结果数组及平台 metadata；它不是把 SQL 拆成客户端多请求的 batch，也不提供新事务语义。d1-query 原来的鉴权、SQL大小/参数校验、数据库目标验证及写SQL能力不变。列表、创建与绑定是资源管理，不属于 SQL 执行。

WebUI 的 public/storage.js 对应这一协议，把 d1-query 请求收在一处；数据浏览、初始化和升级只调用它。旧 UI 对失败结果、分页和多语句的处理保持原样，PWA 静态缓存包含新模块。

本次不修改 schema.sql、插件 SDK/包协议或机器人功能。未来增加 SQLite 驱动只需实现存储执行协议，并在 getDatabase 中选择；业务操作保留 SQLite SQL。新增数据库读写必须放在 storage 操作里，通过接口执行。
