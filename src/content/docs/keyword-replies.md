---
title: "关键词与命令面板"
description: "关键词规则、Markdown 标签、按钮与 QQ 指令面板的配置和运行协议。"
slug: "keyword-replies"
version: "核心 / WebUI 0.8.6"
verifiedAt: "2026-10-29"
source: {"repository":"AnnaofArendelle/MoeBot","path":"docs/keyword-replies.md","commit":"da740d62042c770e4f26542302155e6b60396b45","public":false}
imported: true
---

群聊与私聊先走现有核心命令、插件命令和直接／待办 MCP；这些路径未结束时才检查关键词，随后才是 AI。关键词不依赖 AI_ENABLED，也不检查是否 @。QQ 只推送已订阅的消息，未推送的消息无法匹配。

每组稳定 ID，多条正则共享一份 Markdown 和按钮。按列表顺序取首个命中组，回复一次并结束后续 AI；发送失败不转 AI。正则匹配适配器规范化后的正文，使用 RE2 搜索匹配（find），精确命中使用 ^／$。斜杠命令也通过同一正则匹配，没有单独的命令匹配模式。不增加图片能力、范围白名单、数字优先级或正则捕获变量替换。

最多 32 组，每组 8 条正则，每条 160 字符；沿用 RE2 限制，不支持环视、回溯引用或匹配空消息。消息上限 6000 字符，配置／YAML 上限 128 KiB，Markdown 模板和输出上限 4000 字符，按钮最多 5 行 × 5 列。

```yaml
version: 1
enabled: true
rules:
  - id: sys
    patterns:
      - '^/sys$'
    panel:
      enabled: true
      command: /sys
      description: 显示系统信息
    reply:
      markdown: |-
        # MoeBot 运行状态

        版本：{{version}}

        运行时长：{{uptime}}
  - id: help
    patterns:
      - '^/help$'
    panel:
      enabled: true
      command: /help
      description: 命令帮助
    reply:
      markdown: |-
        # 命令帮助

        {{commands}}
      buttons:
        - - text: 系统信息
            action:
              kind: reply
              target: sys
  - id: greeting
    patterns:
      - '早安'
      - '早上好'
    reply:
      markdown: '# 早安！'
```

`enabled` 总开关必填；组内 `enabled` 可省略（默认开启）。`panel` 可省略（不展示）；开启时填写斜杠命令和描述；编辑和部署组装时，若现有正则不能命中 command，自动补上一条转义后的精确正则（如 `^/hello$`），原正则保留。勾选同步时命令和描述均为必填，缺失任何一项会阻止保存；不勾选则可仅配置普通关键词；无效的非空命令格式会报错。已有 8 条正则且命令未命中时，需先留出一条位置。后端运行校验仍要求实际正则能命中命令，触发始终只走正则。关闭面板同步可保留命令和描述，不影响正则触发。自然语言规则不自动进面板。

面板只是输入入口：QQ 点击后填入命令，用户发送后仍走现有分流和正则。面板目录遵循核心、插件、MCP、关键词的原路由优先顺序，同名命令去重；已装 Essentials 的 /sys、/help 仍由插件优先处理。QQ 适配器负责平台格式、名称长度（14 单位，中文占 2）、描述截短（30 单位）和每面板 20 项限制；不能展示的命令在预览中说明，不改变真实正则。

标签只在命中的 Markdown 模板中解析（回调目标也一样）：

| 标签 | 内容／数据来源 |
| --- | --- |
| `{{version}}` | 当前后端构建版本，无数据库查询 |
| `{{uptime}}` | 距 Cloudflare 上次成功部署的时长，查询当前部署记录 |
| `{{deployed_at}}` | 当前成功部署时间，与 uptime 共用一次查询 |
| `{{node}}`、`{{network}}` | 当前请求节点、网络信息 |
| `{{channel}}` | 平台与群聊／私聊渠道 |
| `{{time}}` | 当前服务器时间，UTC+8 |
| `{{group_id}}`、`{{sender_id}}` | 当前群和发送者 openid，私聊无群 |
| `{{commands}}` | 当前渠道启用的核心、插件、MCP 和声明面板的关键词命令，无数据库查询 |

正则和模板在安装时预编译；未命中的含标签规则不取数，普通关键词没有额外标签查询。重复标签和共享部署依赖在一次回复中只取一次。uptime 缺少、过期或无法读取部署记录时显示“未知（请完成部署后的确认）”；不会把无服务器进程存活时间当成运行时长。

标签为固定白名单，允许括号内空格。为兼容已有 Markdown，未知 `{{name}}` 原样保留。替换是单次纯文本插入，不执行表达式、不递归解析、不访问任意 ENV 或密钥；动态文本转义 Markdown，commands 生成列表。输出过长截断并标注，不发送超过 4000 字符的内容。浏览器预览保留标签原文，不请求生产运行信息。

表单／YAML 滑块切换，共用结构化草稿，双向同步。YAML 支持整段复制粘贴，保留原文和注释；表单修改重新格式化。没有额外批量导入、复制或下载按钮。错误阻止保存与切换；草稿绑定后端地址和部署版本。

通用按钮声明 `command`（发送指令）或 `reply`（显示目标回复组），QQ wire 格式由适配器转换。回调签名绑定部署、来源、目标、按钮、渠道和会话，跨群／跨私聊不可用。5 分钟、256 项 isolate 去重沿用现有互动模型，不提供跨 isolate 全局恰好一次保证。

首装入口 `keywords/defaults.js` 提供 /sys、/help 默认规则，用标签保留原 Essentials 系统信息与帮助内容，首装插件列表为空。Essentials 仍可从独立仓库安装。核心工厂不注入默认规则；已有安装升级从完整恢复产物读取用户关键词、插件和 MCP，原样保留，不注入／覆盖默认内容或卸载 Essentials。

配置仍使用 version: 1，新增 panel 为可选字段。`keywordReplies: 1`、`keywordTemplates: 1` 发布能力标记和 `keywordPlan: 1`、`keywordTemplatePlan: 1` 管理检查防止旧控制台或旧核心静默丢失配置。扩展规则降级必须先明确移除标签和 panel。

后端职责：protocol 校验、runtime 匹配／回调、templates 按需渲染、command-panels/catalog 共用目录、storage/runtime 查询部署记录、QQ 适配器转换和发送。前端 public/keywords 负责草稿、表单／YAML；共享 protocol 和 tags 文件由测试对比。Markdown 不写 AI 回复历史，现有入站历史和 MCP 行为保留。
