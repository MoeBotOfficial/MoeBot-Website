// 只同步列出的文档，不拉取核心源码、运行配置或发布安装包。
export const repositories = {
  core: { repository: 'AnnaofArendelle/MoeBot', directory: 'qq-bot-webhook', commit: 'da740d62042c770e4f26542302155e6b60396b45', public: false },
  webui: { repository: 'MoeBotOfficial/MoeBot-webUI', directory: 'qq-bot-webui', commit: '523b72c23df33a41ef4524a4a8765711b1cd0072', public: false },
  sdk: { repository: 'MoeBotOfficial/MoeBot-Plugin-SDK', directory: 'qq-bot-plugin-sdk', commit: 'dcd5d2ce509fdd43ef1690b433e3f7ceba5d703d', public: true },
  daily: { repository: 'MoeBotOfficial/MoeBot-Plugin-Daily', directory: 'qq-bot-plugin-daily', commit: '434274662fc2b44c99b0fd5e2fb372f3a35d4a16', public: true },
  markdown: { repository: 'MoeBotOfficial/MoeBot-Plugin-Markdown-Demo', directory: 'qq-bot-plugin-markdown-demo', commit: 'c11da31bb658dd8e9c51fb03d9ac9ef88fd195c1', public: true },
};

export const docSources = [
  {repo:'core',path:'docs/keyword-replies.md',slug:'keyword-replies',title:'关键词与命令面板',description:'关键词规则、Markdown 标签、按钮与 QQ 指令面板的配置和运行协议。'},
  {repo:'core',path:'docs/mcp.md',slug:'mcp',title:'MCP 服务',description:'接入远程工具、配置触发方式，了解自动续办、回复窗口与失败恢复。'},
  {repo:'core',path:'docs/mcp-controls.md',slug:'mcp-controls',title:'MCP 进阶配置',description:'短答、关键词、斜杠命令、工具说明与使用成本的详细设计。'},
  {repo:'core',path:'docs/storage.md',slug:'storage',title:'数据库与存储',description:'D1 数据结构、SQLite 查询边界与按会话、插件分离的数据存储。'},
  {repo:'core',path:'docs/cloudflare-limits.md',slug:'cloudflare-limits',title:'Cloudflare 配额与限制',description:'了解 Worker、Pages 与 D1 的配额，以及对插件、聊天记忆和部署的影响。'},
  {repo:'core',path:'docs/provider-options.md',slug:'provider-options',title:'AI 提供商配置参考',description:'提供商列表、模型参数、密钥与运行时限制的当前实现。'},
  {repo:'core',path:'docs/qq-api-notes.md',slug:'qq-api-notes',title:'QQ 平台接口说明',description:'QQ 事件、Markdown、按钮、回复窗口与指令面板的开发参考。'},
  {repo:'core',path:'docs/management-deployment.md',slug:'developers/management',title:'管理与恢复协议',description:'管理鉴权、D1 初始化、完整安装恢复、配置代次与部署状态确认。'},
  {repo:'core',path:'docs/plugins.md',slug:'developers/plugin-runtime',title:'插件运行与安装协议',description:'核心插件运行、配置恢复、密钥合并和部署安装集合的内部协议。',note:'本文包含按历史版本描述的设计。当前 0.8.6 首装默认插件列表为空，/sys 和 /help 由关键词提供；升级恢复用户完整安装集合。'},
  {repo:'webui',path:'docs/deploy-release.md',slug:'webui-deployment',title:'独立部署 WebUI',description:'下载、校验、解压 WebUI 发布包，使用 Vercel CLI 部署和更新静态控制台。'},
  {repo:'sdk',path:'README.md',slug:'developers/sdk',title:'Plugin SDK 接口参考',description:'类型、构建器、回复、存储、HTTP、Markdown 按钮与测试工具的当前契约。',version:'SDK 1.4.0'},
  {repo:'sdk',path:'AI-PLUGIN-PROMPT.md',slug:'developers/ai-plugin-prompt',title:'AI 辅助插件开发提示',description:'可交给 AI 的插件开发契约、包格式和测试要求。',version:'SDK 1.4.0'},
  {repo:'daily',path:'README.md',slug:'developers/daily',title:'Daily 插件示例',description:'每日人品与图片的安装、配置、命令和开发方式。',version:'Daily 1.0.3',note:'当前插件版本为 1.0.3，安装文件为 daily-1.0.3.zip。原 README 的早期章节仍写 1.0.2，下文保留来源内容；下载时请选择 1.0.3 Release。'},
  {repo:'markdown',path:'README.md',slug:'developers/markdown-demo',title:'Markdown 与按钮示例',description:'学习 Markdown 消息、指令按钮、互动回调和管理员能力授权。',version:'Markdown Demo 0.2.0'},
];
