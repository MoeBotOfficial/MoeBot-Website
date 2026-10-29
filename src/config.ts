export const site = {
  name: 'MoeBot',
  subtitle: '猫猫机器人',
  description: '由你定义的 QQ 机器人。AI 对话、关键词回复、插件与 MCP，通过 WebUI 管理你自己的 Cloudflare Pages 后端。',
  consoleUrl: 'https://qq-bot-webui.vercel.app',
  repositoryUrl: 'https://github.com/MoeBotOfficial/MoeBot-Website',
  communityUrl: 'https://github.com/MoeBotOfficial',
  // 填入腾讯问卷或其他托管表单的 HTTPS 地址即可开放候补登记。
  // 留空时显示「登记即将开放」，不会提交或保存任何资料。
  waitlistUrl: '',
  versions: { core: '0.8.6', webui: '0.8.6', sdk: '1.4.0' },
  verifiedAt: '2026-10-29',
};

export const navigation = [
  { label: '功能', href: '/features/' },
  { label: '文档', href: '/docs/' },
  { label: '插件与 SDK', href: '/plugins/' },
  { label: '更新', href: '/changelog/' },
];

export const features = [
  { icon: 'chat', title: 'AI 对话与记忆', text: '选择模型、设置人格，让机器人结合会话记忆回应。', detail: '支持 OpenAI 兼容提供商。需要模型服务与相应 API Key，调用费用取决于提供商。', href: '/docs/ai-personas/' },
  { icon: 'command', title: '关键词、Markdown 与按钮', text: '常用问答、帮助指令，用更清楚的内容呈现。', detail: '支持群聊和私聊、RE2 关键词规则及命令面板。自定义按钮需确认 QQ 平台权限。', href: '/docs/keyword-replies/' },
  { icon: 'puzzle', title: '独立插件', text: '每日人品、图片与更多玩法，按需要安装和配置。', detail: '通过 WebUI 上传插件安装包。更新保留兼容设置，新增能力需显式授权。', href: '/plugins/' },
  { icon: 'tool', title: 'MCP 工具接入', text: '接入远程工具，让模型按任务调用外部能力。', detail: 'MCP 默认关闭。需要配置服务、认证和工具；一次任务调用一个工具并整理回复。', href: '/docs/mcp/' },
  { icon: 'spark', title: '按群设置主动发言', text: '把握每个群的节奏，为不同会话设置参与方式。', detail: '主动发言需要相应群消息事件与配置。建议先小范围启用，再调整频率和人格。', href: '/docs/memory-proactive/' },
  { icon: 'sliders', title: '可视化配置与管理', text: '模型、人格、数据库、插件和更新，在控制台完成。', detail: '使用自己的 CF Token 连接已有后端。官网不接收机器人凭据。', href: '/docs/webui/' },
];

export const docGroups = [
  { label: '开始使用', pages: ['getting-started', 'qq-setup', 'webui', 'faq'] },
  { label: '配置与玩法', pages: ['ai-personas', 'memory-proactive', 'keyword-replies', 'mcp', 'plugin-installation'] },
  { label: '维护与恢复', pages: ['upgrades', 'storage', 'cloudflare-limits', 'webui-deployment'] },
  { label: '开发者', pages: ['developers/plugins', 'developers/sdk', 'developers/markdown-demo', 'developers/daily', 'developers/adapters', 'developers/ci-cd', 'developers/management'] },
];
