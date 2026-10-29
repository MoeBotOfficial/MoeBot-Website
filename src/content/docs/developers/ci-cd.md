---
title: CI/CD 与发布
description: 五个仓库的构建、测试、Release、首装、更新与 Vercel 部署流程。
slug: developers/ci-cd
version: 核心 / WebUI 0.8.6 · SDK 1.4.0
verifiedAt: "2026-10-29"
---

## 当前自动化事实

构建、发布安装包、部署线上项目是三个动作。目前 Release 工作流不会自动把后端部署到生产 CF，也不会自动把 WebUI 部署到 Vercel；当前两项生产项目未建立 Git 部署集成。

| 仓库/工作流 | 触发 | 验证与产物 | 发布或部署条件 |
| --- | --- | --- | --- |
| 后端 release.yml | 所有分支 push、手动 | npm ci、npm test（pretest 构建）、提交/哈希核验；Pages ZIP 与核心 JSON | 同一批测试产物上传 Release，默认分支且仍为分支最新提交时标 Latest，其他分支预发布 |
| WebUI release.yml | 所有分支 push、PR、手动 | 发布测试、构建 ZIP、解压校验、对解压目录执行 Playwright；ZIP/清单/SHA256SUMS | PR 不发布 Release；其他运行发布验证过的产物，Latest 同样检查默认分支最新提交 |
| SDK release.yml | main push、v* tag、手动 | npm ci、npm test、npm pack；SDK tgz | 仅 v* tag 发布 GitHub Release |
| Daily / Markdown Demo release.yml | main push、v* tag、手动 | npm ci、typecheck、npm test（含构建）；插件 ZIP | 仅 v* tag 发布 GitHub Release |
| 后端 deploy-pages.yml | 手动 workflow_dispatch | 下载私有 Release 的首次安装 ZIP、检查目标、Wrangler 部署、健康检查 | 仅全新项目或没有任何部署的项目；已有部署明确拒绝 |

当前 Release 工作流用固定提交的 actions/checkout、setup-node、upload/download-artifact，构建作业 Contents: read，发布作业 Contents: write。后端/WebUI 先创建 Draft，上传同批产物再公开，重跑已完成发布不改写其文件。

SDK/插件当前按 tag 进入发布，但工作流尚无独立「tag 与包 version 必须一致」门禁；当前后端 release.yml 没有 pull_request 触发。若采用 PR 合并门禁或加强 tag 校验，需要单独修改工作流，不能把这些写成已经存在的检查。

## 本地验证

后端：

```sh
npm ci
npm test
```

后端 pretest 自动构建，测试与 Release 要使用同一次构建产物，不在测试后重新构建另一套包。

WebUI 的当前 CI 顺序：

```sh
npm ci
npx playwright install --with-deps chromium
npm run test:release
npm run build
npm run verify:release -- --extract dist/verified-package
WEBUI_PACKAGE_DIR=dist/verified-package npm run test:browser -- --workers=2
```

SDK：`npm ci` → `npm test` → `npm pack --pack-destination dist`。插件：`npm ci` → `npm run typecheck` → `npm test`，测试会构建 `dist/<id>-<version>.zip`。

## 产物选择

| 产物 | 用途 |
| --- | --- |
| qq-bot-pages.zip | CF Pages 首次安装，0.8.6 默认 /sys、/help 关键词、无预装插件 |
| qq-bot-release.json | 已有后端通过 WebUI 更新，恢复完整插件/配置/密钥/MCP 集合 |
| qq-bot-webui-<版本>.zip | 解压校验后部署静态控制台，不创建或升级 CF 后端 |
| qq-bot-webui-release.json / SHA256SUMS | 核对 ZIP、文件、构建和源提交 |
| qq-bot-plugin-sdk-<版本>.tgz | 插件开发依赖；不是机器人安装包 |
| <插件 ID>-<版本>.zip | WebUI 插件管理安装包 |

私有仓库 Release 仍是私有的。普通访客不能通过匿名 Release 链接获得核心产物；首版需维护者分发可信首装包或用户已有读取权限；若以后公开发布产物，需要单独确定分发方式，不把私有链接当作公众下载入口。

## 后端首装与日常升级

现有首装工作流只负责安装程序，随后在 WebUI 完成 D1、QQ、模型与配置，再去 QQ 平台验证回调。现有健康检查失败输出 warning，不代表已经验证就绪；安装文档需提醒检查真实目标地址、版本和生产部署状态，不将 warning 当作已经确认就绪。

已有实例升级用 WebUI 更新核心 JSON，恢复完整安装集合，提交部署后确认生产部署 ID、build ID 与配置代次。CF ENV 更新与发布不是原子事务；超时要先核实状态，不盲目重装或清空项目。

`npm run deploy` 和首次 Pages ZIP 属于源码/首装工具链，不能当作保留用户完整安装集合的通用升级器。生产 D1 回滚需要独立备份与迁移计划，回滚代码不会回滚数据。当前预览 Pages 与生产共用 D1，应先建立隔离数据环境再做写入测试。

## WebUI 与 Vercel

从同一 Release 下载 ZIP、发布清单和 SHA256SUMS；先核验，再解压到新目录执行 `node verify.mjs`。随后在解压目录登录 Vercel、关联目标项目并使用普通 `vercel --prod` 部署。该包不是 `.vercel/output` 的 prebuilt 目录。

更新官方控制台需要部署权限和明确的正式发布动作。未来如建立 Git 集成，要记录构建/输出配置、预览与正式分支；目前不能把 push GitHub 写成生产站点已经自动更新。



## 官网文档 CI

官网静态构建使用已审阅的 Markdown 快照，检查内部链接与锚点、生成搜索索引并测试页面。原仓库文档更新后由维护者运行同步脚本、审阅来源 diff 再提交。Vercel 构建不需要私有仓库密钥。
