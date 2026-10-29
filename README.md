# MoeBot 官方网站

MoeBot（猫猫机器人）的纯静态官网、使用文档与开发者文档。首版沿用 WebUI 的绿色风格，使用 Astro 构建 Markdown，部署到独立 Vercel 项目。

## 本地运行

需要 Node.js 24+。

```sh
npm ci
npm run dev
```

正式产物检查：

```sh
npm run check
npm run build
npx playwright install chromium
npm test
npm run preview
```

构建输出为 `dist/`，包含静态页面和 Pagefind 搜索索引。没有 Worker、Vercel Functions、数据库、账号或产品激活接口。

## 配置入口

修改 `src/config.ts`：

- `site.waitlistUrl`：填入托管表单 HTTPS 地址；留空显示「登记即将开放」，不提交或保存资料。
- `site.consoleUrl`：官方 WebUI 地址。
- `site.versions` / `verifiedAt`：对应版本与内容核对日期。

`PUBLIC_SITE_URL` 设置正式站点地址，用于 canonical 和 sitemap。更换域名时同步修改 `public/robots.txt` 的 sitemap 地址。

## Markdown 文档

`src/content/docs/` 包含官网指南与经过审阅的仓库 Markdown 快照。`scripts/doc-sources.mjs` 指定白名单文件、固定提交、路由和版本；`docs-sources.json` 保存来源与 SHA-256。

普通构建直接解析已提交的快照，不访问私有仓库、不需要任何账号密钥。更新原仓库文档时，先调整来源提交，再运行：

```sh
# 五个源仓库在同一上级目录时：
npm run docs:sync -- --local

# 或通过 GitHub API 读取，私有来源需要受限只读 GITHUB_TOKEN：
npm run docs:sync
```

审阅文档 diff 后再提交。脚本只读取白名单 Markdown，转换相对链接、移除 README Logo HTML、保留版本说明；不获取核心代码或安装包。私有来源文档发布到本站后，正文将公开，因此只同步适合公开的内容。

新增官网指南在 frontmatter 中设置 title、description、slug；导航分组在 `src/config.ts` 配置。GFM 表格和代码高亮在构建时完成，Mermaid 使用受限配置在浏览器渲染，复制与搜索不需要运行时 API。

## Vercel

项目框架 Astro，安装 `npm ci`，构建 `npm run build`，输出 `dist`，Node 24。正式地址：https://moebot-website.vercel.app 。

当前通过 GitHub Actions 发布：main push 完成类型检查、构建、链接检查与浏览器测试后，`scripts/deploy-vercel.mjs` 把同一提交源码发送到独立 Vercel 项目；PR 只验证，不接触发布密钥。Vercel 的 GitHub App 目前未获得新仓库读取权限，因此暂未启用原生 Git 预览部署。

发布令牌存放于 GitHub 加密 Secret `VERCEL_TOKEN`，项目和团队 ID 在工作流中配置。维护者替换令牌时更新这个 Secret 即可。发布脚本只在 CI 或维护者终端运行，不打包进网页；普通构建不需要发布令牌。不要把 QQ、CF 或模型密钥配置到官网。

## 首版范围

首页、功能、插件与 SDK、候补入口、更新记录、隐私、404；快速开始、QQ 接入、配置、关键词、MCP、存储、升级；插件/适配器/CI/CD 开发文档。

核心与 WebUI 仓库目前私有，安装包由维护者分发或由有仓库权限者下载。官网只提供安装说明，不提供公开安装包或自动部署任务。

网站代码采用 MIT。仓库文档与品牌素材来自对应 MoeBot 项目，来源见 `docs-sources.json` 与 `THIRD_PARTY_NOTICES.md`。
