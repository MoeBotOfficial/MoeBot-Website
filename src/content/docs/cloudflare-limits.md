---
title: "Cloudflare 配额与限制"
description: "了解 Worker、Pages 与 D1 的配额，以及对插件、聊天记忆和部署的影响。"
slug: "cloudflare-limits"
version: "核心 / WebUI 0.8.6"
verifiedAt: "2026-10-29"
source: {"repository":"AnnaofArendelle/MoeBot","path":"docs/cloudflare-limits.md","commit":"da740d62042c770e4f26542302155e6b60396b45","public":false}
imported: true
---

本项目跑在 Cloudflare Pages(Functions 走 Workers 运行时)。以下是**免费(Free)套餐**的关键限制,数字来自 Cloudflare 官方文档(CPU 限额再次核对于 2026-10-07；其余表格为 2026-09-19 基线)。开发新功能前先扫一眼,避免撞墙。

> 官方来源:
> - Workers 限制:https://developers.cloudflare.com/workers/platform/limits/
> - Pages 限制:https://developers.cloudflare.com/pages/platform/limits/
> - D1 限制:https://developers.cloudflare.com/d1/platform/limits/
> - D1 计费(每日读写额度):https://developers.cloudflare.com/d1/platform/pricing/

## Workers 运行时限制(直接影响每个请求)

| 项 | 免费层 | 对本项目的影响 |
|---|---|---|
| **CPU 时间 / 每次调用** | **10 ms** | ⚠️ 最需要注意的一条。指纯计算时间,**等待网络(fetch)不计入**。签名、JSON 处理这类计算必须轻。别在请求里做重计算(大循环、复杂加解密、大量字符串处理)。 |
| **每次请求子请求数(subrequests)** | **50** | 一次事件里最多发 50 个 `fetch`。当前:取 token 1 次 + 发消息 1 次 = 2 个,离上限很远。以后接 AI/多次外部调用要留意。 |
| **每次请求并发外连** | **6** | 同时进行的 `fetch` 最多 6 个。串行调用不受影响。 |
| **每日请求数** | **100,000 / 天** | UTC 零点重置。超了返回 `Error 1027`。个人机器人远够用。 |
| **内存 / isolate** | **128 MB** | 同一 isolate 的核心和所有插件共享内存。别在内存里堆大数据。 |
| **Worker 体积(解压后)** | **64 MiB** | 代码 + 依赖的总大小。此外须符合 Workers 压缩后代码体积限制，不能仅按解压大小判断。 |

**最重要的一条:CPU 10ms。** 网络等待不算,所以"取 token → 发消息"这种 IO 密集没问题;但**纯 CPU 计算要克制**。以后加 AI 时,推理放在远端(调 API),别想在 Worker 里本地算。

## Pages 平台限制

| 项 | 免费层 | 说明 |
|---|---|---|
| **构建次数** | 500 次 / 月 | 仅 Git 连接的自动构建才算;当前用 `wrangler pages deploy` 直传,**不占构建额度**。 |
| **每次构建超时** | 20 分钟 | 无构建步骤,不涉及。 |
| **单站文件数** | 20,000 | 远够。 |
| **单文件大小** | 25 MiB | 超大文件建议放 R2。 |
| **自定义域名 / 项目** | 100 | 够用。 |
| **预览部署** | 无限 | 每次 `wrangler pages deploy` 会生成一个带 hash 的预览 URL。 |
| **项目数 / 账户** | 100 | 注意:**新账户前 48 小时**创建新项目会受限。 |

**Functions 用量并入 Workers 配额**:Pages 上的 Functions 请求算进上面 Workers 的每日 10 万次里。

## D1 限制(上下文存储用)

| 项 | 免费层 | 对本项目的影响 |
|---|---|---|
| **每日写入行数** | **100,000 行 / 天** | ⚠️ **最先撞到的一条**。一次对话写 2 行(群友 1 + 机器人 1),折算约 **5 万条消息/天** —— 比 Workers 的 10 万请求/天更早见底。UTC 零点重置。 |
| **每日读取行数** | **5,000,000 行 / 天** | 取一次上下文读 40 行,折算约 12.5 万次/天,不是瓶颈。 |
| **每次 Worker 调用的查询数** | **50** | 当前一条消息最多 4 条(存入站 + 取上下文 + 存回复 + 偶尔一次清理),离上限很远。 |
| **单次调用并发 D1 连接** | **6** | 全是串行调用,不涉及。 |
| **单库大小** | **500 MB** | 7 天保留期下,日均几千条消息也就几 MB 量级,无压力。 |
| **账户总存储** | **5 GB** | 同上。 |
| **数据库数 / 账户** | **10** | 当前 1 个。 |
| **单条 SQL 语句长度** | 100 KB | 入库前正文截断到 2000 字,够不着。 |
| **单查询最长耗时** | 30 秒 | 够不着。 |
| **Time Travel 回溯** | 7 天 | 误删数据可在 7 天内恢复。 |

**超额会怎样:** 读写额度用完后**查询直接被拒**,D1 返回"已超出每日限额"的错误。本项目的上下文模块对读写失败是降级处理(记日志、返回空),所以真超了机器人不会挂,只是当天退回无记忆的单轮对话。

**存储不是按天重置的**,是硬占用;真顶到 5 GB 得先删数据才能继续写入。过期清理就是防这个 —— 见 README 的「上下文(记忆)」。

## 与本项目相关的注意点

1. **无状态是平台特性,不是选择。** Workers 可能复用 isolate，但不保证其生命周期或内存持久性。**没有持久内存、没有常驻进程、没有 uptime**。要存状态只能靠外部存储 —— 本项目的上下文就是放在 D1 里的(见上面的 D1 限制表)。
2. **`ctx.waitUntil` 不是后台任务。** 它只延长**当前请求**的执行窗口,让你在返回响应后还能把 `fetch` 跑完。不能拿来做定时/常驻。
3. **Pages Functions 没有 Cron Triggers。** 定时触发器是 Workers 独有的,Pages 上没有。所以"定期清理过期消息"这类活只能搭在正常请求里顺手做(本项目用概率抽样触发,见 `context/index.js`)。
4. **CPU 10ms 是硬线。** 真需要重计算,应调用外部服务或调整套餐；放进 waitUntil 并不能避开 CPU 计费。
5. **免费层没有 workers.dev/pages.dev 的可用性承诺。** 从中国访问依赖线路(见主 README「为什么用 Pages」)。

2026-10-07 核对：Cloudflare 官方文档的 production 源码仍列出免费 HTTP 请求 CPU 为 10 ms。来源：https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/workers/platform/limits.mdx 。不要把本地 wall time 当成 CF CPU time；本次集成验证没有形成生产 CPU 分位数测量。
