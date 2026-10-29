---
title: 安装与管理插件
description: 下载可信 Release ZIP，在 WebUI 配置插件、能力授权和范围，保存部署后启用。
slug: plugin-installation
---

## 获取插件安装包

当前提供两个公开官方示例：

| 插件 | 当前包 | 说明 |
| --- | --- | --- |
| Daily | `daily-1.0.3.zip` | 今日人品、重置、固定图和随机图 |
| Markdown Demo | `markdown-demo-0.2.0.zip` | Markdown、指令按钮与互动回调 |

从对应仓库 Release 下载 ZIP，不要选择 GitHub 的 Source code ZIP。参考 [插件与 SDK](/plugins/)。

## 上传并配置

1. WebUI 连接后端，进入插件管理，上传 ZIP。
2. 检查插件身份、版本、配置和群聊/私聊范围。
3. 启用需要的能力。Markdown 消息和按钮默认关闭，需管理员分别授权。
4. 点击保存并部署，等待生产运行确认。

网页只校验和组装插件包，不执行插件浏览器脚本；插件在部署后的同一 Worker 中运行。

## 更新与卸载

更新时上传同 ID 的新版本 ZIP，保留兼容设置、启用状态、范围和已有授权；新能力授权默认关闭。

卸载默认保留 D1 中该 ID 的数据。重装相同 ID 可继续读取，但代码回滚不等于存储回滚。

## 能力与资源限制

插件与核心共享同一运行环境和 CPU，SDK 权限不是防恶意代码沙箱。安装前确认可信来源。

当前包数量、大小、回复、HTTP 与存储操作存在限制。完整契约见 [SDK 接口参考](/docs/developers/sdk/)。

## 编写自己的插件

从 [插件开发](/docs/developers/plugins/) 开始。Daily 示例适合学习每日存储与图片；Markdown Demo 适合学习能力授权与互动。
