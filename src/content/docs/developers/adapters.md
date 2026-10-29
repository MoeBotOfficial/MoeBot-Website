---
title: 适配器开发
description: 平台注册、消息转换、回复和互动能力，以及当前 QQ 关联代码的扩展边界。
slug: developers/adapters
version: 核心 / WebUI 0.8.6 · SDK 1.4.0
verifiedAt: "2026-10-29"
---

## 当前状态

当前仅实现 `qq-official`。描述注册与消息入口已经分开，但尚无通用、独立发布的适配器 SDK，也没有验证过的第二种平台实现。文档应把现有接口和仍需抽象的 QQ 关联代码分开说明。

主要源码位置：

| 文件 | 职责 |
| --- | --- |
| pages/_worker.js/adapters/definitions.js | ID、名称、开关、字段、必填项、路径、别名、平台设置地址、面板范围 |
| pages/_worker.js/adapters/index.js | 绑定 handler、建立路由、拒绝缺失 handler 或重复路径 |
| pages/_worker.js/adapters/qq-webhook.js | QQ HTTP 入口、验证回调、普通事件与互动处理 |
| pages/_worker.js/adapters/qq.js | 凭据、签名、Access Token、平台消息发送、消息/互动转换和续办恢复 |
| pages/_worker.js/config.js | 配置字段、密钥类型、范围和按适配器就绪检查 |
| pages/_worker.js/dispatch.js | 核心命令、插件、MCP、关键词与 AI 分发 |
| pages/_worker.js/runtime/continuation.js | 后台续办；当前显式依赖 QQ，不能默认其他平台可复用 |

## 接入步骤

1. 阅读新平台的签名、回调验证、消息事件、应答时限与回复额度。实现平台要求的验证；不能只照搬 QQ 的 JSON/op 分支。
2. 在 `definitions.js` 注册唯一 ID、独立 endpoint、配置字段与开关，在 `config.js` 定义字段类型及 secret 标记。禁用平台不阻碍其他平台配置，WebUI 按描述展示字段。
3. 实现平台请求 handler，并在 `adapters/index.js` 绑定。路由要避开 `/admin/`、`/health`、受保护恢复文件和内部续办入口。
4. 将平台事件转换为下述标准消息，平台无关业务交给 `dispatch`；所有出站 API、凭据、超时和格式转换留在适配器。
5. 明确平台能否发送图片、Markdown、键盘、互动回应、命令面板与延迟续办。当前若缺少某些能力，必须检查核心/插件降级逻辑并补相应修改，不能仅删掉函数就认为完整兼容。
6. 为未知/无效事件、禁用/未配置、平台错误、超时、会话隔离、回复额度和重放/幂等建立测试。使用模拟平台响应，不将线上 QQ 或其他平台作为自动测试对象。
7. 核对 WebUI 展示、命令面板同步、配置恢复与发布能力标记，重新构建核心，先在隔离测试实例验收。

## 标准消息字段

| 字段 | 约定 |
| --- | --- |
| platform | 唯一的平台标识 |
| channelType | 当前分发与插件 scope 使用 group / c2c；新增类型需要同步评估协议和 UI |
| sessionId | 带平台、会话类型和目标的命名空间，避免跨平台混用记忆 |
| sender / senderName / groupId | 平台用户/群标识与可用名称；不可把不同平台的用户 ID 默认认作同一人 |
| text / msgId | 规范化正文和该平台事件/消息标识 |
| isAt / autoAtOnReply | 是否明确呼叫机器人、平台是否自动加 @，避免重复提及 |
| deadline / meta | 处理时限与受控请求元信息 |
| reply / replyImage / replyMarkdown / replyRich | 适配器封装的出站能力，核心和插件不拼平台 API |
| capabilities | 可用消息能力的声明，需要与实际函数/授权/平台条件一致 |
| canReplyWithin / continuationState | 平台回复时限与可恢复引用；不支持时不能宣传自动续办 |

当前内部 QQ 消息对象含 raw，但 SDK 只暴露筛选后的只读 `ctx.message`，不会把 raw 直接交给插件。

## 互动、命令面板与续办

QQ 按钮有指令按钮与回调按钮；适配器要实现该平台真实的事件与回应协议。业务涉及持久状态时需要幂等，不把单 isolate 的去重当作跨节点 exactly-once。

描述注册中的 commandPanels 不代表任意平台自动支持面板。应实现平台同步接口并核对后台管理、脚本和恢复逻辑。

MCP 续办当前通过 `qqAdapter.restoreContinuation` 恢复回复引用，并检查 QQ 开关/窗口。新增平台如需相同功能，应先将恢复逻辑按适配器分派，再实现平台恢复契约和测试；这部分是未来修改范围，尚未实现。
