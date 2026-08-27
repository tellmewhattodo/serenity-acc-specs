# Changelog

## v1.3.1 (2026-08-27)

概念定义升级：**Session = Trajectory 的可重建载体**（S142 用户定义——宁静号 session 与 trajectory 同义/承载关系，用于 dsp v1.23.0 提示词全英化 + keeper 改名）：

- **新增 §0.3.1 Session 是 Trajectory 的可重建载体**：
  - Session = trajectory 的可重建载体：SESSION.md 是轨迹的持久身体（存储形态）；工作会话（dsh conversation / session_rebuild 产物）是轨迹的运行副本（再发生形态）
  - 载体可重建，轨迹连续：session_rebuild 丢弃当前载体、新建载体承接同一 trajectory（Ship of Theseus：载体换新，本体不变）
  - 同义视角：session 与 trajectory 指同一认知存在的两个面——连续体与其承载实例
- **§2 术语表**：新增 `会话 / Session`（可重建载体）；修订 `轨迹 / Trajectory`（Agent 可替换、Session 载体可重建）
- **§0.1 定义微调**：发生发生在载体（session）中；再发生时载体与推动者均可换
- **I6 扩展**：Session（会话）是 Trajectory 的可重建载体——载体可丢弃重建，SESSION.md（轨迹身体）与轨迹身份不可随意销毁
- **§5.2 Metaphor 第 7 条修订**（The Logbook）：SESSION.md is the trajectory's logbook — the persistent body of the voyage; sessions are rebuildable carriers / Discard the carrier, keep the logbook
- **§5.10 会话追踪提醒改名 trajectory-keeper**：机制语义显式化（督促记录 SESSION.md——载体可丢但轨迹身体不可断更）；**新增机制预声明要求**（Session 块必须预声明 keeper 机制与 ACK 协议，机制先于提醒）；提醒文本统一（[TRAJECTORY-KEEPER] 前缀 + 全英正文）；改名兼容说明（ACK 码单次使用不跨会话，旧前缀零影响）
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
