---
title: "AI 提供商配置参考"
description: "提供商列表、模型参数、密钥与运行时限制的当前实现。"
slug: "provider-options"
version: "核心 / WebUI 0.8.6"
verifiedAt: "2026-10-29"
source: {"repository":"AnnaofArendelle/MoeBot","path":"docs/provider-options.md","commit":"da740d62042c770e4f26542302155e6b60396b45","public":false}
imported: true
---

在 WebUI「AI 服务」读取并管理提供商，展开「高级请求参数」。新增字段保存在原有 Secret `AI_PROVIDERS` 中，不增加数据库表或聊天请求时的查询。

```json
[
  {
    "id": "gemma",
    "name": "Google Gemma",
    "baseUrl": "https://generativelanguage.googleapis.com/v1beta/openai",
    "model": "models/gemma-4-26b-a4b-it",
    "apiKey": "YOUR_API_KEY",
    "enabled": true,
    "headers": {"X-Client-Name": "MoeBot"},
    "extraBody": {"reasoning_effort": "minimal"}
  }
]
```

`headers` 是字符串键值对象，用于模型列表 GET 和聊天 POST。大小写重复、换行、控制字符、鉴权和传输层请求头均被拒绝：包括 Authorization、Cookie、API Key、Host、Content-Type/Length、Accept、Connection、Transfer-Encoding，以及 `Sec-*`、`Proxy-*`、`CF-*`、`X-Forwarded-*`。最多 16 项、2000 UTF-8 字节。

`extraBody` 附加到 `/chat/completions` 请求体顶层，支持服务商接受的 `reasoning_effort`、`temperature`、`top_p` 等。它不影响模型列表请求。禁止覆盖 model、messages、tools、tool_choice、stream、n、max_tokens/max_completion_tokens/max_output_tokens、response_format 等程序控制字段；嵌套原型污染键也会被拒绝。最多 3000 字节、8 层、200 节点。服务商不支持的合法参数会导致该服务请求失败，程序不通过再次请求来尝试猜测正确参数。

提供商列表合计仍最多 8 项、5000 UTF-8 字节。普通状态接口仅返回 `hasOptions`，不返回自定义头、额外请求体或 Key；读取明文使用原有的显式密钥读取流程。无效 JSON 草稿保留在内存中，切换页面也不能绕过部署前校验。

## 模型列表与模型参数

点击「拉取模型列表」，浏览器向后端 `POST /admin/providers/models` 提交当前编辑的 API 地址、Key 和请求头；需要当前项目的 Pages 编辑权限。后端 GET `{baseUrl}/models`，不会再盲目拼接 `/v1`，也不会把 CF 管理凭据传给提供商。修改地址后不会隐式复用旧地址的密钥。接口拒绝重定向和本地/私有地址字面量，请求限时 12 秒，响应最多 2 MiB、1000 个模型。

接受 OpenAI 的 `{data: [...]}`、`{models: [...]}` 和数组；模型可使用 `id`，缺失时取 `name`。其余模型字段保留并脱敏。界面展示已知的上下文、输入/输出 Token 上限、思考能力、支持参数和默认参数，同时提供完整原始字段的只读视图。不会根据名称推断能力，不把上限视为默认值，不自动覆盖用户设置；`false`、`0` 也会完整显示。服务商只提供 ID 时，其余显示“未提供”。接口声明还有分页时会提示，本次仅取当前页，不自动追踪远端 URL。

例如 Google 的兼容 `/models` 实测仅返回 ID、显示名和归属，没有 Token 限制或思考能力。这不等于模型不支持思考。模型默认参数取决于服务商返回的数据，并非所有 OpenAI 兼容接口都提供。

## 升级与运行约束

旧配置没有 `headers`、`extraBody` 时保持原样。先升级后端到 0.7.2，再设置新参数；无需修改旧 Key、数据库、插件或 MCP 配置。能力标记为 `providerOptions: 1`。已配置的参数不会因旧客户端省略字段而被静默删除，明确填写 `{}` 才会清空；新版 WebUI 会拦截携带自定义参数降级到不支持它们的发布包。

参数合并不会增加模型请求次数，MCP 仍保持每个事件最多一次模型 HTTP 尝试。列表查询仅由用户点击触发，元数据只保留在当前页面。Gemma 4 26B 使用 `reasoning_effort=minimal` 的一次真实回合测试约 4.9 秒，生成了有效的 MCP 预约决策；这是外部请求的实测耗时，不是稳定延迟承诺，也不是 Cloudflare CPU 用量测量。
