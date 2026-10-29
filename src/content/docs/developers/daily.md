---
title: "Daily 插件示例"
description: "每日人品与图片的安装、配置、命令和开发方式。"
slug: "developers/daily"
version: "Daily 1.0.3"
verifiedAt: "2026-10-29"
source: {"repository":"MoeBotOfficial/MoeBot-Plugin-Daily","path":"README.md","commit":"434274662fc2b44c99b0fd5e2fb372f3a35d4a16","public":true}
imported: true
---

> 当前版本说明：当前插件版本为 1.0.3，安装文件为 daily-1.0.3.zip。原 README 的早期章节仍写 1.0.2，下文保留来源内容；下载时请选择 1.0.3 Release。

每日人品与图片：.jrrp、!jrrp、。jrrp、！jrrp、/rejrrp、今日/随机小马图、今日/随机冰雪图。人品按用户每天固定，今日图按作品每天固定，日期按 UTC+8。

需要 猫猫机器人（MoeBot） v0.5.0+，插件 API v1。

## 用户安装

1. 在 [Releases](https://github.com/MoeBotOfficial/MoeBot-Plugin-Daily/releases) 下载 `daily-1.0.2.zip`。不要使用 GitHub 的 Source code ZIP。
2. WebUI → 插件管理 → 上传 ZIP。
3. 检查权限和设置，启用插件，选择群聊/私聊范围。
4. 点击全局「保存并部署」，等待面板显示新配置已生效。

设置、更新、卸载也在同一面板完成。卸载默认保留数据；重新安装相同 ID 会复用数据。只安装你信任的 JavaScript：插件与核心共享 CPU 和运行环境。

## 开发

```sh
npm ci
npm run typecheck
npm test
```

输出 `dist/daily-1.0.2.zip`。SDK 独立维护于 [MoeBot-Plugin-SDK](https://github.com/MoeBotOfficial/MoeBot-Plugin-SDK)。配置表单由 config.schema.json 自动生成；完整接口、资源限制和 AI 开发提示见 SDK 仓库。

官方后端首次升级会将旧 jrrp / daily_pic 记录导入 daily 的命名空间，旧表保留供回滚。后续运行只访问插件存储，不写入聊天消息表。

## 1.0.1：MoeBot 品牌更新

项目正式名称为**猫猫机器人（MoeBot）**，统一使用猫猫 SVG Logo。仓库地址、npm 包名、CLI、插件 ID、发布产物文件名和插件 API v1 保持兼容。

## 1.0.2：简化 Logo

使用绿色圆角底板与粗白线猫脸，以眼睛、鼻子、小嘴和胡须构成图标。插件 API v1 保持不变。

### 1.0.3：QQ 指令面板入口

新增 `/jrrp`、`/今日小马图`、`/随机小马图`、`/今日冰雪图`、`/随机冰雪图`，原 `.jrrp` 和不带斜杠的图片命令全部保留；人品及图片缓存继续共用。`/rejrrp` 原样保留。MoeBot 0.7.5 中开启核心“指令面板”，上传新版 ZIP 并保存部署后即可同步到 QQ 菜单。插件自身不访问面板 API。
