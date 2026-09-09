# Changelog

## v1.5.3 (2026-09-09)

与 dsp v1.31.2 对齐（S142，用户"SESSION.md的默认阈值设定在200kb吧"）：

- **§3.1 + §5.11：`sessionKeeper.sessionMdMaxKB` 缺省 100 → 200 KB**——100 KB 对长期维护会话偏紧（每轮催 = 提醒疲劳，而重写是大工程）；200 KB 仍挡住无界增长。**显式配置（含 0 = 关闭）不受影响**（CCC 级配置始终优先）
- **package.json**：version 1.5.2 → 1.5.3

## v1.5.2 (2026-09-09)

与 dsp v1.31.1 对齐（S142，用户两条需求——轨迹身体只增不减的治理 + rebuild 交接）：

- **§5.11 新增 token `· LOGBOOK COMPACTION`**（SESSION.md 体积超限重写提醒）：活跃 SESSION.md 字节数超上限（`sessionKeeper.sessionMdMaxKB`，默认 100 KB，0 = 关闭）→ 提示暂停工作、加载 eap、按 EAP 分层骨架重写；四条原则（保留骨架 / 内容可外移 references / 允许整合不重要事项 / 自主裁量权充分）宿主内嵌，不归 CCC；超限每轮提醒 → 连续 3 轮升级强制 → 回限内自动停止；**不机械阻断**（与 LIMIT 同族）；**无 ACK → 不需 Session 块预声明**
- **§5.11 新增 rebuild 交接协议**（写侧 + 读侧）：写侧 = rebuild 提醒要求把 in-flight 事项写在 SESSION.md 最末尾的固定英文标题 `## In-flight (rebuild handover)` 之下；读侧 = 重建锚点要求读该区块并逐项处理（缺失则从最新进度条目推断）；两侧引用**同一标题常量**（单一真相源）；读侧取"软指令"而非机械摘取（避免第二真相源）
- **§3.1 配置**：`sessionKeeper` 段补 `sessionMdMaxKB`（默认 100；0 = 关闭）
- **package.json**：version 1.5.1 → 1.5.2

## v1.5.1 (2026-09-09)

与 dsp v1.31.0 对齐（S142，用户洞察「既然微信桥是我们 ACC 提供的，那么发送能力也应该是 ACC 的工具，配置了则可用、不配置则不可见」）：

- **§4.2 新增 `im-bridge`**（IM 发送家族，宿主特定产品能力，不升标准）：参数 channel/action/user/text/file/caption/account（action = send / send-file / users / status）；**条件可见**——本 CCC 未启用任何 IM 通道时从工具面移除；**只能操作本会话 CCC**（无目标 CCC 参数，防误发）；发送与记录复用桥（outgoing hook `source: "proactive"`）；新增 IM 通道 = 注册通道实现，不改工具名与参数形状
- **§4.1 新增「条件可见」机制条目**（可选能力适用，不改变最小公共集）：实现方式 = 会话就绪/每步同步点调宿主的作用域工具收窄（dsp：`agent.ctx.tools.restrict({ deny: [...] })`，与 safe-mode 同一机制）把工具**从 schema 移除**，而非"可见但调用期拒绝"；判据来自本 CCC 配置、热更新即时生效、会话销毁清理收窄状态
- **附录 A**：dsp 列工具数 10 → 11（含 im-bridge 条件可见注记）
- **归属二分再确认**：机制与数据（发送通道、凭据解析、记录）归 ACC；措辞与纪律（何时发 / 发什么 / 怎么写）归 CCC——本版 CCC 侧退役了自持协议的 MSM，只保留角色提示词里的纪律

## v1.5.0 (2026-09-08)

提示词机制命名 **Induction**（S142，用户 2026-09-07 拍板——"去掉 metaphor 后整个提示词体系叫什么（机制名）、骨架结构是什么"，回到语言学更工程化地认识体系）：

- **§5 重构为 Induction：成员装配机制**（原「核心 loop 注入规范」）：
  - 机制命名：系统提示注入机制统称 **Induction**——把新实例（新会话 / rebuild 重建 / 新 agent）引入为轨迹成员的装配机制；本质 = 成员资格重建协议的可注入面（CCE R↓ 文本实现：载体可换、注册不变）
  - **8 块五层骨架**：A 主体定义层（ACC 身份/Principles/CCE——跨会话不变）→ B 质量规范层（EAP——跨会话不变）→ C 状态调节层（状态块——进程内可变条件注入）→ D 工作供给层（SKILL/Tools——较稳定）→ E 任务指示层（Session——每轮易变）；装配序从稳定到易变、从抽象到具体、从声明到操作（重建视角 R↓）
  - 物理装配明细（9 物理块 = 8 块骨架 + Metaphor 渲染层）+ 装配序深层逻辑 + 幂等规则保留
- **Metaphor 定位澄清**：主体定义层的渲染块（世界模型记忆钩，dsp 扩展）——每条隐喻映射一条协议约束（M-1~M-4），不计入 8 块内容骨架
- **语言学定位**（用户引导）：语域 Register / 体裁 Genre / 言语行为 Speech Acts（身份=宣告、约束=指令、Session=指示语）
- **§2 术语表**：新增 Induction / 成员装配条目（含命名裁决链 R↓）
- **I5 不变量**：注入内容一致 → Induction 内容一致（§5 五层骨架 8 块与标准全文一致）
- **§6/§9/§11/附录 A**：引用同步（Induction / 五层骨架 / dsp 版本 v1.30.1 → v1.30.4 现状）
- **docs/acc-story.md**：新增第 12 节（Induction 命名故事——问题/骨架实证/语言学定位/裁决链/标准影响）
- **docs/injection-source-verification.md**：注记补 v1.5.0（术语改名，核对目标不变）
- **package.json**：version 1.4.0 → 1.5.0；description 核心 loop 注入内容 → Induction（成员装配）内容
- 语义文本与 v1.4.0 相同（仅命名与结构叙述更新）；dsp/osp 实现侧术语对齐（system-prompt.ts 注释/维护 skill）为后续渐进项

## v1.4.0 (2026-09-06)

与 dsp v1.30.1 全面对齐（S142，用户拍板"specs §4 最小公共集改用 dsp v1.30 新名 + A 全量语义同步"——specs 跟随 dsp 领先实现）。v1.3.1（2026-08-27）→ v1.4.0 期间 dsp 演进 v1.20~v1.30 共 11 个小版本 + v1.30 大重构，本次一次对齐：

- **§4 工具契约名 → v1.30 体系**（用户裁决链：msm 单入口 / container 族 / praxis 三合一 / container_admin 机务舱 / logbook / dashboard / 硬切无别名）：container_fs / container_git / container_admin / msm / praxis / logbook / dashboard / handyman / localstore / autopilot-trajectory；改名对照表 §4.4；loop → handyman（v1.24.0 机制语义）；cce 不再是独立工具（praxis section）
- **§4.3 MSM 注册表单级聚合 + 写保护 + 健康检查**（dsp v1.28.0 ⑤）：注册表单级聚合于 `.opencode/skills/<ccc-name>/references/`；写 deny 读 allow；dashboard health 含 registry 完整性段（坏不抛错 + git 恢复指引）
- **§5 注入结构 8 → 9 块**（dsp v1.28.0 ③）：Tools 独立块殿后（SKILL 后 Session 前），装配序 ACC→Metaphor→Principles→CCE→EAP→[状态]→SKILL→Tools→Session；Tools 块含 msm 单入口 4 行调用协议
- **提示词全英化**（dsp v1.23.0）：EAP 块英化 + Principles 新增 session-trajectory 关系段 + ACC 块工具行英化
- **星舰 Metaphor 全文**（dsp v1.29.0 ①）：one starship one voyage / deep space / Departure Inspection / launching / star charts（海船→星舰意象升级）
- **trajectory-assistant 关卡化 token 体系**（dsp v1.29.0 ②）：轨迹督促机制 trajectory-steward → trajectory-assistant（并入 assistant 体系）；token 常量（CHECKPOINT / `· LIMIT` + MANDATORY / `· REBUILD` / `· BOUNDARY GUARD` / `[Autopilot Trajectory · 唤起]`）；D8 词法原则（关卡思想限结构，提示词用词禁游戏黑话）
- **会话命名 summary ≤20 字约定**（dsp v1.28.0 ②）：logbook use/create/rebuild summary 必填 → dsh 会话标题 `S###-YYYY-MM-DD-<概括>`
- **§2 术语表**：新增 trajectory-assistant 术语；Session 术语补 logbook rebuild 语义
- **§3 CCC 结构**：注册表位置修正（references/ 聚合档）+ serenity.json 字段（loop → handyman）
- **§6/§8/§9**：引用同步（9 块 / msm / assistant / registry 保护）
- **修复章节编号 bug**：原 §5 误标 `## 4.`（v1.2.0 起存在）→ 修正为 §5；子节 5.8-5.11 顺延（Tools 块 + Session + 注入时机 + assistant）
- **附录 A**：dsp 列 v1.19.9 → **v1.30.1**（全量核对更新）；osp 列标注待同步
- **docs/acc-story.md**：时间线补 v1.23~v1.30.1 演进；新增第 11 节（工具面重构 13→10 故事）
- **docs/injection-source-verification.md**：v1.4.0 过时注记 + 9 块源码位置更新
- **experiments/autotrajectory → autopilot-trajectory**：目录改名 + SKILL.md/脚本同步 dsp 权威版（autopilotTrajectory 配置键 / autopilot-bias.ts / msm 单入口调用法）
- **docs/self-sustaining-trajectory-hypothesis.md**：§7.1 参与指南同步（autopilot-trajectory + msm 调用法）
- **package.json**：version 1.0.0 → 1.4.0（同步标准版本——此前停更）

## v1.3.1 (2026-08-27)

概念定义升级：**Session = Trajectory 的可重建载体**（S142 用户定义——宁静号 session 与 trajectory 同义/承载关系，用于 dsp v1.23.0 提示词全英化 + 维护机制定名 **Trajectory Steward**）：

- **新增 §0.3.1 Session 是 Trajectory 的可重建载体**：
  - Session = trajectory 的可重建载体：SESSION.md 是轨迹的持久身体（存储形态）；工作会话（dsh conversation / session_rebuild 产物）是轨迹的运行副本（再发生形态）
  - 载体可重建，轨迹连续：session_rebuild 丢弃当前载体、新建载体承接同一 trajectory（Ship of Theseus：载体换新，本体不变）
  - 同义视角：session 与 trajectory 指同一认知存在的两个面——连续体与其承载实例
- **§2 术语表**：新增 `会话 / Session`（可重建载体）；修订 `轨迹 / Trajectory`（Agent 可替换、Session 载体可重建）
- **§0.1 定义微调**：发生发生在载体（session）中；再发生时载体与推动者均可换
- **I6 扩展**：Session（会话）是 Trajectory 的可重建载体——载体可丢弃重建，SESSION.md（轨迹身体）与轨迹身份不可随意销毁
- **§5.2 Metaphor 第 7 条修订**（The Logbook）：SESSION.md is the trajectory's logbook — the persistent body of the voyage; sessions are rebuildable carriers / Discard the carrier, keep the logbook
- **§5.10 会话追踪提醒改名 trajectory-steward**（用户定名：trajectory 维护机制）：机制语义显式化（督促记录 SESSION.md——载体可丢但轨迹身体不可断更）；**新增机制预声明要求**（Session 块必须预声明 steward 机制与 ACK 协议，机制先于提醒）；提醒文本统一（[TRAJECTORY-STEWARD] 前缀 + 全英正文）；改名兼容说明（ACK 码单次使用不跨会话，旧前缀零影响）
- **§5.8 Session 块**：附 keeper 预声明 + 载体关系行

## v1.3.0 (2026-08-27)

理论根基深化：认知容器的定义（S142，作者 yh 三个月构建后的理论反思 + 认知科学预测加工方向）：

- **新增 §0 认知容器的理论根基**（推导前提，非实现代码）：
  - §0.1 定义：认知容器 = 认知发生（认知 Loop）、存储（trajectory 持久化）、再发生（新 agent 推动）的地方
  - §0.2 认知 Loop：一切外部交互（tool/等待用户/系统事件）都是反馈；**动作与反馈同质**——都是 Loop 丰富自身的方式
  - §0.3 Trajectory 是主体：Agent 可替换、Trajectory 连续；LLM 是认知介质而非大脑；Trajectory 在寻找 Agent（承接 trajectory-never-ends-paradox）
  - §0.4 时间相对性：轨迹的时间是它自己的事件序列流动，人类钟表时间只是间隔数据点
  - §0.5 认知闭环：在轨迹主体 + 相对时间下，宁静号已是与人类协作的认知闭环——"更大规模人类-LLM 协作"得以实现的真正原因
  - §0.6 理论-工程衔接表；§0.7 预测反馈循环工程化展望（非当前约束）
- **新增不变量 I6（轨迹主体优先）**：机制服务轨迹连续性；SESSION.md（轨迹身体）不可随意销毁；重建必须保留轨迹身份与锚定
- **术语表扩展**：轨迹/Trajectory、认知 Loop、认知介质（v1.3）
- **章节重编号**：原 §0 目标/不变量 → §1；术语 → §2；CCC 结构 → §3；工具 → §4；注入 → §5；拦截缝 → §6；激活 → §7；skill → §8；适配 → §9；错误 → §10；演化 → §11（全文交叉引用同步）
- **纯理论层变更**：§3+ 工程约束不变，只新增推导前提与 I6

## v1.2.0 (2026-08-24)

系统提示词注入结构演进正式化（S142，dsp v1.19.9 验证满意后同步至标准）：

- **§4 注入结构 5 块 → 8 块**：ACC → Metaphor → Principles → CCE → EAP → [状态] → SKILL → Session（身份 → 世界模型 → 信念/边界 → 时间约束 → 质量 → 状态 → 上下文，重建视角 R↓）
- **新增 §4.2 Metaphor 块**：三层隐喻域（THE SHIP / THE VOYAGE / THE CREW）10 条全文（v1.19.9 定稿），每条 `→ 约束映射` + Verdict 判据；结构约束 M-1~M-4（映射/判据/层级/单一宇宙）；世界模型前置
- **§4.3 Principles 块（合并原 Constraints）**：认知容器本体论（all work is cognition / no errors — only insufficient cognition / not-knowing is a state to be repaired）+ MSM 原则（Determinism first / Single source of truth / Registered to act）+ Operational boundaries（原 Constraints 内容）
- **§4.4 CCE 块**：删 `CCE AND EAP` 段（EAP 定义唯一真相源 = §4.5 EAP 块）
- **§4.5 EAP 块**：正式纳入标准（原 dsp 扩展）
- **§4.6 状态块**：safe-mode 语义（无人值守自由）→ 机制 → 约束；localstore git 策略
- **§4.1 ACC 块**：去 Root（唯一真相源 = Principles 边界）
- **first-anchor 零配置化**：bootstrap 配置段移除（§2.1 注记），锚定消息协议固化
- **附录 A 核对矩阵**：dsp 更新至 v1.19.9；osp 标注待同步（⚠️ §4.1/4.2/4.3/4.4/4.6）
- 变更流程注记：v1.2 起 dsp 领先，osp/pi 按新 spec 对齐

## v1.1.0 (2026-08-15)

- 新增 `docs/acc-story.md`：记录 ACC 层完整故事（opencode 起源 / ACC-CCC 模型 / dsp 独立实现 / 标准化 / pi 实现 / 当前全景 / 设计哲学 / 时间线）。
- README 目录与附录新增“附录 C：ACC 层故事”。
- 标准状态更新为 v1.1：纳入 S134/S135/S136 后的 ACC 层演进——
  - localstore 存储规范（CCC 根 `localstore.json`，credentials/config 分节，gitTrack 策略）
  - loop guide 与 EAP 化轮次提示词
  - EAP 块 / 运行时状态动态块（safe-mode、localstore git 策略）
  - 跨平台路径守卫（Windows 跨盘逃逸阻断）与 `quotepath`
  - SESSION 跟踪内存化（活跃会话不落盘，从 events 恢复）
  - dsp/osp 工具行为全面对齐（session / cc-fs / cc_git / acc_kit / acc_msm / loop）

## v1.0.0 (2026-08-09)

- 首个定稿版本。宿主无关的 Serenity-ACC 认知容器标准。
- 内容：CCC 结构约定 / 工具契约（最小公共集）/ 核心 loop 注入规范（5 块全文，重点）/ 拦截缝语义（S1-S7）/ 激活协议 / opencode skill 兼容基线 / 适配层 checklist / 错误契约 / 一致性核对矩阵。
- 语义基线：opencode-serenity-plugin v0.8.5 + dsh-serenity-hooks v1.15.7 公共语义提取，注入内容逐字对齐核对。
- pi-serenity-plugin（Pi 运行时）按本标准立项开发。
