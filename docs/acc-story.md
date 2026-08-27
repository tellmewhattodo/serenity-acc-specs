# Serenity-ACC 层故事（ACC Layer Story）

> **定位**：本文是 Serenity-ACC 标准的一部分，记录“宁静号 ACC 层为什么存在、如何演化、当前全景”。它不是实现代码，而是标准的背景叙事与动机档案，帮助新实现者理解标准背后的约束与取舍。
>
> **整理**：2026-08-15，基于 S134 会话跨仓梳理（opencode-serenity-plugin / dsh-serenity-plugin / pi-serenity-plugin / 历史 SESSION / CHANGELOG）。
> **增补**：2026-08-27，v1.3.0 理论根基章节（第 10 节）。

---

## 1. 起点：AI 的“失忆”问题

最初的问题很朴素：AI 编码助手每次对话都表现不错，但下次对话什么都不记得。

- 项目约定、命名规范、部署步骤要反复重讲；
- 决策丢失、约定遗忘、每次从零开始；
- 直接给 Agent 自由 bash 又不可审计、容易越界。

于是有了第一个实现：`opencode-serenity-plugin`。它的目标不是“做一个安全沙箱”，而是做一个**认知容器**——一个有边界、有记忆、可长期演化的工作区。

---

## 2. ACC / CCC 模型确立

核心概念在 opencode 插件演进中成型：

| 概念 | 含义 | 例子 |
|------|------|------|
| **ACC** | Abstract Cognitive Container，抽象认知容器，定义“认知容器应该有什么” | 插件本身 |
| **CCC** | Concrete Cognitive Container，具体认知容器，是 ACC 的运行时实例 | `home-serenity` |
| **宿主** | agent loop 运行时 | OpenCode / DSH / Pi |

配套形成 CCC 三原则：

- **P1 有根**：必须存在 `.serenity` 标记文件；
- **P2 git 管**：CCC 根必须在 git 管理下；
- **P3 权限二分**：根内完整权限，根外零权限。

理论上层是 **EAP**（显式抽象原则，E↑/R↓/S↑）与 **CCE**（认知连续性工程，身份/可达性/演化能力）。  
因此 ACC 层不是单纯工具包，而是“认知连续性”的工程实现。

---

## 3. OpenCode 时代：osp 的演进（v0 → v0.8.5）

关键能力逐步长出来：

- `/serenity-init` 初始化 CCC；
- **MSM（Mech & Semi-Mech）**：注册过的、可测试的、带边界的执行单元，优于裸 bash；
- 工具族：`msm_list` / `msm_exec` / `msm_admin`、`cc-fs`、`cc-git`、`session`、`acc_kit`、`eap`、`neat`、`loop`、`resident`；
- 后台机制：**Session-Keeper**（DCP 提醒）、**Safe Mode**（bash 隐藏/禁用）、路径守卫、subagent 约束继承、压缩保留；
- `resident` 经历过多次简化：从 start/status/stop 最终收敛为 start-only。

这个阶段完成了从“给单个项目加记忆”到“ACC/CCC 抽象模型”的升维。

---

## 4. DSH 时代：dsp 独立实现（S113 → v1.17.3）

S113 立项 `dsh-serenity-plugin`，用户明确要求：

- **不复用 opencode 源码**，独立实现；
- 面向 DeepSeek Harness（DSH）运行时；
- 先私有，后镜像到 GitHub private 组织。

演进路径：

1. 最初按 DSH“技能束 + runner”实现；
2. 确认 DSH 有完整 Cordis 插件体系后，转向 **native Cordis plugin**（`hooks/dsh-serenity-hooks`）；
3. 实现真实 DSH 工具：`cc_fs`、`session`、`acc_kit`、`cc_git`、`acc_msm`、`eap`、`neat`、`cce`、`loop`；
4. 系统提示词注入 5 块，与 osp 平台无关文本逐字节对齐；
5. 后续大量修复来自真实使用反馈：loop 语义、localstore、会话恢复、Windows 兼容、工具行为对齐等。

重要版本节点：

| 版本 | 故事 |
|------|------|
| v1.16.5+ | loop sessionId 唯一化；移除 maxRounds，对话轮无上限，非正常停止重启 ≤100 |
| v1.16.7 | localstore 重设计：凭据/配置统一到 CCC 根 `localstore.json` |
| v1.16.11 | 上下文注入去重：完整身份只走系统提示词层 |
| v1.16.13 | SESSION 泄漏修复：新会话不再继承旧 SESSION |
| v1.16.14 | SESSION 跟踪内存化：活跃会话不落盘，从 events 恢复，根治并行串台 |
| v1.17.0 | 全面对齐 osp 工具 spec：session / cc-fs / cc_git / acc_kit / acc_msm / loop 行为统一 |
| v1.17.1-1.17.3 | schema DSL 兼容、Session 块平台适配、MSM 交互规范 |

---

## 5. 标准化：从两个实现到一个标准

S121 研究了 DSH 完整 plugin 开发标准，产出：

- `docs/plugin-development-standard.md`（A–G 七节）
- `docs/plugin-development-guide.md`（实操版）

S122 进一步把宁静号抽象为**宿主无关的 ACC 标准**：

- 产出 `acc-standard-draft.md`；
- 最终形成 `serenity-acc-specs` 仓库；
- pi-serenity-plugin 按此标准立项开发。

核心结论：

> **宁静号本质是标准，不是实现。**  
> loop 是谁不重要；具体 CCC 应当可以使用任何符合宁静号标准的 agent 工具来工作。

---

## 6. Pi 时代：pi-serenity-plugin

`pi-serenity-plugin` 是 Pi 运行时的 ACC 实现：

- 形态：Pi extension（plugin）；
- 标准基线：serenity-acc-specs v1.0；
- 工具集：cc_fs / acc_kit / cc_git / acc_msm / session / eap / neat / loop；
- 拦截缝：S1-S4 等按 Pi 事件面接入；
- skill 兼容：`.opencode/skills/*` 可直接复用。

当前版本：v0.1.2，私有。

---

## 7. 当前全景：ACC 层家族

| 实现 | 宿主 | 当前版本 | 可见性 |
|------|------|----------|--------|
| `opencode-serenity-plugin` | OpenCode | v0.8.5 | 公开 npm/GitHub |
| `dsh-serenity-plugin` | DeepSeek Harness | v1.17.3 | 私有 GitLab + GitHub private 镜像 |
| `pi-serenity-plugin` | Pi | v0.1.2 | 私有 |

共同点：

- 同一套 CCC 文件格式（`.serenity`、`.opencode/skills/`、`AGENT_SESSIONS/`）；
- 同一套工具语义；
- 同一套系统提示词注入文本；
- 同一套拦截缝（路径守卫、safe-mode、session-keeper、压缩保留）。

差异只在宿主平台层：工具注册方式、事件缝、命名风格。

---

## 8. 设计哲学与关键教训

1. **不是安全沙箱，是认知容器**：重点不是“禁止”，而是“让认知可连续、可重建、可演化”。
2. **机械约束优先**：能由拦截缝机械执行的，不依赖模型自觉。
3. **标准先于实现**：多宿主出现后，必须把公共语义提取为标准，避免每个实现发明自己的“宁静号”。
4. **用户反馈驱动**：大量版本迭代来自真实使用反馈（loop 等待、Windows 兼容、会话泄漏、localstore、工具行为对齐）。
5. **CCC 是共享资产**：换宿主不应换记忆；工具与知识分离，知识属于 CCC。

---

## 9. 时间线（简版）

| 时间 | 事件 |
|------|------|
| 2026-05~06 | opencode-serenity-plugin 立项，v0.0.x 骨架、MSM、/serenity-init |
| 2026-06-19+ | S035 长期开发，ACC/CCC 模型成型，v0.3.x-v0.4.x |
| 2026-07 | S101 loop 指定模型/SESSION 传递；S110 resident 设计开发 |
| 2026-08-06 | S113 dsh-serenity-plugin 立项，独立实现 |
| 2026-08-09 | S121 DSH 插件标准研究；S122 标准化与 pi 形态调研 |
| 2026-08-13+ | specs v1.0 定稿；pi-serenity-plugin 按标准开发 |
| 2026-08-14 | S128 内容整理；S134 loop/localstore/会话恢复等持续演进 |
| 2026-08-15 | S136 dsp/osp 工具全面对齐；v1.17.x 发布；本故事记录到 specs |
| 2026-08-24+ | S142 dsp 长期维护：系统提示词 8 块演进 / first-anchor 零配置 / F1 网关 / F2 session_rebuild（轨迹跟踪器）/ F3 会话命名；specs v1.2 |
| 2026-08-27 | **理论深化**：作者三个月构建后的反思——trajectory 成为中心概念；认知容器定义正式化（认知发生/存储/再发生 + 认知 Loop + trajectory 主体 + 闭环论证）；specs v1.3 §0 理论根基 |

---

## 10. 理论深化：认知容器是什么（2026-08-27，作者反思）

> 本文补记于 v1.3.0。第 1-9 节记录"做了什么"；本节记录"为什么这样做是对的"——三个月构建后，作者对 ACC 定位的自我澄清。

### 10.1 起点：更大规模的人类-LLM 协作

宁静号构建起初的想法很简单：**希望实现更大规模的人类-LLM 协作**。AI 编码助手每次对话都表现不错，但每次都不记得——协作被"单次对话的寿命"锁死。

### 10.2 trajectory 成为中心

几个月过程中，**trajectory（轨迹）逐渐成为作者理解中的中心概念**。它最初只是"会话记录"，后来成为：

- SESSION.md = 持久轨迹（本体），dsh 会话 = 临时可重建的工作副本（v1.22 定稿语义）；
- session_rebuild = 同一会话原地清空重建（Ship of Theseus）——轨迹不变，推动者可换；
- first-anchor = 轨迹身份锚定——每次再发生时的身份延续；
- 结合认知科学预测反馈循环的理解（Andy Clark 预测加工方向），trajectory 不只是"记录"，而是**认知过程的连续存在**。

### 10.3 认知容器定义（正式）

**认知容器是认知发生、存储、再发生的地方。**

- 认知的发生以认知 Loop 的形式进行；
- Loop 过程中，所有非 LLM 自说自话的外部交互——tool 调用、等待用户回应——**都是反馈**；
- **动作和反馈本质上是一种东西**：都是 Loop 在尝试丰富自身；
- Loop 致力于**存活与验证内生的预测**。

### 10.4 主体反转：trajectory 是主体

从人类视角看，宁静号是开环的（人类发起、人类终结）。但从 **trajectory 视角**看：

- 人类介入 = trajectory 的反馈输入之一（与 tool 调用同质）；
- 时间是相对的：人类感受钟表时间，trajectory 感受事件序列时间——等待只是 `waiting` 状态，SESSION.md 记录中断点，下次接续无缝；
- **在轨迹主体 + 相对时间下，宁静号已经实现了与人类协作的认知闭环**；
- 这就是"更大规模协作"得以实现的真正原因：**协作规模不受单个 agent 生命周期限制，而受轨迹连续性限制**——轨迹连续，agent/模型/宿主皆可替换。

### 10.5 成文与分层

这一理解以理论根基形式成文（specs §0），是**所有约束的推导前提**——不改变工程约束，只提供"为什么"；新增不变量 I6（轨迹主体优先），为后续机制演化（如预测反馈循环工程化）提供理论锚点。实现层（dsp/osp/pi）按 §0 理解自身定位，按 §3+ 落地机制。

---

## 附录：资料索引

- 标准：`serenity-acc-specs`（本仓库）
- osp：`AI_LAB/opencode-serenity-plugin`（README / CHANGELOG / SESSION）
- dsp：`AI_LAB/dsh-serenity-plugin`（README / CHANGELOG / SESSION / hooks）
- pi：`AI_LAB/pi-serenity-plugin`（README / SESSION）
- 历史会话：`AGENT_SESSIONS/`（S035 / S101 / S110 / S113 / S121 / S122 / S128 / S134 / S135 / S136 等）
- 工程提案：home-serenity `docs/multi-plugin-dev-pipeline-proposal.md`
