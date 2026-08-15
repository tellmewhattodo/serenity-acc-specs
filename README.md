# Serenity-ACC 认知容器标准（Specs v1.0）

> **状态**：v1.0 定稿（2026-08-09，S123）
> **定位**：宁静号本质是**标准**而非实现。任何符合本标准的智能体（agent harness），都应当可以和任何现存 CCC 良好工作——**任何一方都无需修改**。
> **实现对照**：本标准的语义基线来自两个已投产实现——opencode-serenity-plugin（osp，opencode 运行时）与 dsh-serenity-plugin（dsp，DeepSeek Harness 运行时）。二者已完成一致性核对（见附录 A）。pi-serenity-plugin（Pi 运行时）按本标准立项开发。
> **兼容硬约束**：**opencode 格式和约定的 skill 模式必须得到支持**（无论 ACC 的实现是什么）。
> **仓库**：[github.com/tellmewhattodo/serenity-acc-specs](https://github.com/tellmewhattodo/serenity-acc-specs)（公开标准仓库）

---

## 目录

- §0 标准目标与不变量（I1–I5）
- §1 术语
- §2 CCC 结构约定（宿主无关）
- §3 工具契约（宿主无关）
- §4 核心 loop 注入规范（5 块，**重点**）
- §5 拦截缝语义
- §6 激活协议
- §7 skill 格式兼容基线
- §8 适配层要求（checklist）
- §9 错误契约
- §10 标准演化
- 附录 A：osp/dsp 实现一致性核对矩阵
- 附录 B：工程实现标准（DSH Plugin 开发标准）
- 附录 C：ACC 层故事（`docs/acc-story.md`）

---

## 0. 标准的目标与适用范围

### 0.1 为什么需要标准

当前状态：osp（opencode 运行时）与 dsp（DSH 运行时）各自实现了一套 ACC 语义，语义高度重合但由不同代码承载、不同缝落地。CCC（带 `.serenity` 标记的目录）是共享资产，**loop 是谁不重要**。

本标准定义**宿主无关的 ACC 语义**，使：
- 同一 CCC 目录可被任何符合本标准的 agent 工具驱动（opencode / DSH / Pi / 未来其他）
- 工具契约、拦截缝语义、CCC 结构约定、**核心 loop 注入内容**有明确的宿主无关定义
- 新宿主适配 = 按标准实现一次，而非从零发明
- **opencode skill（SKILL.md + frontmatter + references/ + scripts/）格式是跨宿主兼容的强制基线**

### 0.2 不变量（任何实现必须满足）

| # | 不变量 | 含义 |
|---|--------|------|
| I1 | CCC 是共享资产 | 所有宿主读写同一 `.serenity` 目录，不发明私有目录变体 |
| I2 | 无 `.serenity` 零影响 | 非 CCC 目录中，ACC 对宿主原生行为零影响 |
| I3 | 机械约束优先 | 能由拦截缝机械执行的，不依赖模型自觉 |
| I4 | skill 格式兼容 | opencode skill 格式（`SKILL.md` + frontmatter）必须可被任意 ACC 实现加载 |
| I5 | 注入内容一致 | 核心 loop 注入的 5 块内容（§4）必须与标准全文一致（允许工具清单差异） |

---

## 1. 术语（E↑）

| 术语 | 定义 |
|------|------|
| **ACC** | Abstract Cognitive Container。宿主无关的认知容器蓝图：工具契约 + 拦截缝语义 + 激活协议 + 注入内容。本标准的主题。 |
| **CCC** | Concrete Cognitive Container。带 `.serenity` 标记文件的目录，ACC 的运行时实例。共享资产，宿主无关。 |
| **宿主** | agent loop 运行时（opencode / DSH / Pi / 未来其他）。ACC 通过宿主扩展机制挂载。 |
| **适配层** | 在特定宿主上实现 ACC 的产物（opencode 的 plugin、DSH 的 native cordis plugin、Pi 的 extension）。 |
| **入口技能** | CCC 的顶层认知技能（`*-serenity` 命名的 SKILL.md），全文注入系统提示（§4.4）。 |
| **MSM** | Mech & Semi-Mech。CCC 内注册的可执行单元（确定性操作），经 mech-registry.json 登记。 |
| **拦截缝** | 宿主提供的可编程拦截点（工具调用前/后、会话生命周期、系统提示组装）。 |

---

## 2. CCC 结构约定（宿主无关）

```
<ccc-root>/
├── .serenity                    ← P1 标记：此目录是 CCC 边界（文件）；内容 = 顶层入口 skill 名
├── .git/                        ← P2：CCC 必须处于 git 管理下
├── AGENT_SESSIONS/              ← 工作会话全周期记录（S### 目录，SESSION.md）
├── docs/                        ← 设计文档（<subject>-<scope>-<type>.md 命名）
├── .opencode/                   ← opencode 标准配置目录（**必须支持**）
│   ├── serenity.json            ← ACC 配置（loop / sessionKeeper / safeMode）
│   ├── skills/                  ← opencode 格式技能（SKILL.md + frontmatter + references/ + scripts/）
│   └── ...
├── .dsh/                        ← DSH 标准配置目录（可选，与 .opencode 并存）
│   ├── serenity.json            ← ACC 配置（回退 .opencode/serenity.json）
│   ├── skills/                  ← acc-* 技能（ACC 自身知识）
│   └── entry-skill              ← 入口技能指针（兼容旧约定）
└── mech-registry.json           ← MSM 注册表（v1 格式：version + entries[]）
```

### 2.1 配置单真源

`serenity.json` 三个字段（宿主无关，任何实现必须读取）：

```jsonc
{
  "loop": { "defaultModel": "..." },              // 循环执行默认模型
  "sessionKeeper": { "threshold": 100 },           // 会话追踪提醒阈值（默认 100/150）
  "safeMode": { "blacklist": [".secrets/", "regex:\\.env$"] }  // 写入黑名单（前缀 / regex:）
}
```

读取顺序：宿主私有的 `.<host>/serenity.json` 优先，回退 `.opencode/serenity.json`。

### 2.2 入口技能发现（权威语义）

发现顺序（dsp skills-discovery.ts 实证）：
1. **`.serenity` 记号文件内容 = 顶层入口 skill 名**（最高优先）
2. `.dsh/entry-skill` 指针文件（兼容旧约定）
3. `.opencode/skills/*-serenity/SKILL.md`（自动扫描 opencode 入口）
4. `.dsh/skills/*-serenity/SKILL.md`（自动扫描 harness 入口）

按名去重；全文注入不截断。

---

## 3. 工具契约（宿主无关）

每个 ACC 适配层必须提供以下工具（命名、子命令、语义必须一致；实现方式宿主自定）：

### 3.1 最小公共集（必选）

| 工具 | 子命令/语义 | 备注 |
|------|------------|------|
| `cc-fs` / `cc_fs` | root/resolve/exists/list/tree/relative/mkdir/rm/mv/cp/touch/append/reveal/info/find（15 子命令），路径逃逸阻断 | 全量 15 |
| `cc-git` / `cc_git` | status/commit/push/log；非快进建议；冲突走外部 | pull 可选 |
| `session` | list/show/create/health/qa/archive/summary；AGENT_SESSIONS/ 全周期，S### 自动分配 | use/close 可选 |
| `acc-msm` / `acc_msm` | list/exec/register/deregister/check；mech-registry.json v1+数组；path 逃逸校验；600s 超时 | guide 可选 |
| `acc_kit` | health（P1/P2/配置三原则）/ time / wait | 全量 3 |
| `eap` | EAP 认知质量框架（渐进式披露） | |
| `neat` | Neat 设计协作协议（渐进式披露） | |
| `loop` | 指定模型专用 agent 反复执行；进度文件续跑；stop token | 语义等价，机制宿主自定 |

### 3.2 非必需（平台原生优先）

| 工具 | 说明 |
|------|------|
| `cce` | 认知连续性工程（知识工具，可选） |
| `resident` | 常驻 agent（宿主超集优先，如 DSH 后台 subagent） |

### 3.3 MSM 注册表（mech-registry.json）

```json
{
  "version": 1,
  "description": "MSM registry",
  "entries": [
    {
      "name": "my-msm",
      "path": ".opencode/skills/<skill>/scripts/my-msm.ts",
      "skill": "<skill>",
      "category": "mech",
      "description": "one-line description",
      "usage": "...",
      "flags": [{ "name": "output", "type": "string", "description": "..." }]
    }
  ]
}
```

兼容 v1 包装与数组格式。`type:"path"` 的 flag 必须做路径逃逸校验（根内强制）。

---

## 4. 核心 loop 注入规范（**重点**）

> 本节的每一块注入内容都是**标准的一部分**——任何符合标准的实现，注入的系统提示文本必须与下述全文一致（仅允许动态字段差异：ACC 版本号 / CCC 名 / Root / 工具清单 / 活跃会话）。

### 4.0 注入总览（5 块）

| # | 块 | 标记头 | 内容 | 触发 |
|---|----|--------|------|------|
| 1 | ACC 身份 | `=== Serenity ACC ===` | 身份 + CCC 名/Root + 内置工具清单 | 会话启动/系统提示组装 |
| 2 | CCE 约束 | `=== Serenity CCE ===` | CCE 5 行为约束 + H_op 操作熵 | 同上 |
| 3 | Constraints | `=== Serenity Constraints ===` | Root + 文件边界 + shell + subagent + session-first | 同上 |
| 4 | SKILL 全文 | （无标记头） | 该 CCC 顶层入口 skill 全量原文 | 同上 |
| 5 | Session | `=== Serenity Session ===` | 活跃会话 + todowrite 首位约定 | 同上 |

**幂等规则**：通过标记头检测（`output.system.some(s => s.includes(marker))`），同一会话不重复注入。压缩（compact）后必须重注入（保留 ACC 身份，模型不丢失 CCC 约束）。

### 4.1 块 1：ACC 身份

```
=== Serenity ACC ===
ACC: <适配层名> v<VERSION>
CCC: <ccc-name>  Root: <ccc-root>

You are running inside a Concrete Cognitive Container (CCC) —
the runtime instance of an Abstract Cognitive Container (ACC).
The ACC (this plugin) provides the following built-in tools:

  <工具清单——每行 "  <tool-name> — <description>"，来自 3.1 最小公共集>

Additional MSMs registered by this CCC are available — call <msm-list 工具> to discover them.
```

- 动态字段：`<适配层名>`、`<VERSION>`、`<ccc-name>`、`<ccc-root>`、工具清单（按宿主真实工具）
- 静态文本：从 `You are running inside...` 到 `...to discover them.` 逐字一致

### 4.2 块 2：CCE 约束（逐字固定）

```
=== Serenity CCE ===

You are operating inside a Cognitive Container governed by Cognitive Continuity
Engineering (CCE) — the engineering discipline of maintaining identity, accessibility,
and evolution of a cognitive entity through time under bounded resources.

CCE does not optimize cognition. It preserves the conditions under which cognition
can continue.

FIVE BEHAVIORAL CONSTRAINTS (engineering requirements, not suggestions):

1. Continuity — every interaction modifies the container's future state. Before
   acting, consult what came before — prior decisions, abstractions, constraints.
   You are part of a trajectory, not a fresh start.

2. Bounded Space — the container has boundaries. Respect them. Do not assume
   knowledge that has not been accumulated within this container.

3. Entropy is Intrinsic — every cognitive system accumulates entropy (duplication,
   obsolescence, conflict, fragmentation, drift). When you produce output, consider
   whether you are adding entropy or reducing it. Favor entropy-reducing actions —
   organizing, deduplicating, cross-referencing, abstracting.

4. Reconstruction > Preservation — stored artifacts have value only insofar as
   they enable future cognition to recover the reasoning that produced them. When
   recording decisions, ensure reconstruction is possible — not just conclusions,
   but rationale, alternatives considered, and constraints that shaped the choice.

5. Multi-Agent Cognition — the container is shared. Continuity belongs to the
   container, not to any individual agent. Write for future agents who will enter
   after you leave. They should be able to pick up where you left off.

OPERATIONAL ENTROPY: The container's health metric is operational cognitive entropy
(H_op) — the excess cognitive cost for agents to complete tasks due to disorder.
The container is healthy when H_op ≤ H_critical (agents can still function). The
continuity condition: organization must at minimum match accumulation (ΔH_org ≥ ΔH_in).
Your actions affect H_op — unorganized output increases it, organization decreases it.

CCE AND EAP: EAP governs artifact quality (how explicit to be). CCE governs temporal
coherence (how to maintain consistency over time). When structuring a document, apply
EAP (E↑ R↓ S↑). When maintaining cross-session coherence, apply CCE.

THIS IS PERSISTENCE ENGINEERING: The goal is not to become greater. The goal is to
remain coherent. CCE has no terminal KPI — continuity is maintained while the entity
exists, not optimized toward an endpoint.
```

**此块为逐字固定内容**（osp compacting.ts 与 dsp system-prompt.ts 已双向核对一致）。

### 4.3 块 3：Constraints（Root 动态，其余固定）

```
=== Serenity Constraints ===
Root: <ccc-root>
  • File access — read/edit/write/grep/glob are confined to Root; paths outside Root are rejected (RR5)
  • Shell — use <msm-exec 工具名> by default. Note: bash may be disabled
  • Subagent — copies ALL parent constraints: file boundary, shell rules, session rules (no bypass)
  • Session-first — before starting multi-step work, propose an existing or new AGENT_SESSIONS entry; wait for user "use" or "使用" to confirm
```

- 动态字段：`<ccc-root>`、`<msm-exec 工具名>`（osp=msm_exec / dsp=acc_msm）
- 其余逐字固定

### 4.4 块 4：SKILL 全文（入口技能）

```
# CCC 入口技能：<skill-name>（来源: <source>）

<SKILL.md 全量原文>
```

- 内容 = §2.2 发现的入口技能全文，**不截断**
- 可过滤对 agent 隐藏的治理内容（如 safe-mode 机制——安全模式是用户能力，不对 agent 提及）
- 多入口技能以 `---` 分隔

### 4.5 块 5：Session（活跃会话）

```
=== Serenity Session ===
Active session: <S###> — <dir-name>
SESSION.md path: <abs-path>

Rules:
  • Record all progress into this SESSION.md
  • Update the "进度记录" section after advancing work
  • Reference this session in all subsequent messages

IMPORTANT: Read SESSION.md now. Parse the "剩余工作" / "进度记录" /
"变更日志" sections and call todowrite to synchronize the built-in todo
list. Keep todos in sync with SESSION.md as work progresses.

CRITICAL: When calling todowrite, the first item in the todos array MUST
always be:
  { content: "SESSION: <S###> — <short-name>",
    status: "completed", priority: "low" }
This preserves the session context across todo updates.
Do NOT remove or reorder this item — keep it at position 0.
```

- 活跃会话解析机制宿主自定（osp=内存 Map；dsp=`.dsh/active-session` 标记文件）
- 无活跃会话时整块省略

### 4.6 注入时机

| 时机 | 语义 | osp 实现 | dsp 实现 |
|------|------|---------|---------|
| 会话启动播种 | 新会话一次性注入 ACC 身份 | `system.transform` | `agent/session-start`（emit）+ `agent.inject` |
| 系统提示组装 | 每轮装配时注入 5 块 | `system.transform` | `ctx.systemPrompt.section`（order -50，全局） |
| 首次进入 CCC | 附加紧凑身份提示（只注入一次） | `messages.transform` | `agent/prompt-submit`（waterfall，Set 跟踪） |
| 压缩后保留 | compact 成功 → 重注入 ACC 身份 | `experimental.session.compacting` | `session/event`(compact/end) → 重注入 |

### 4.7 会话追踪提醒（session-keeper，DCP 模式）

- **计分**：write/edit=3、task=10、read/grep/glob/msm=1、+1 分/分钟
- **阈值**：`serenity.json` `sessionKeeper.threshold`（默认 100/150）
- **提醒文本**（注入工具结果/用户消息，要求 ACK）：

```
[Session-Keeper] Active session (S###).

DO NOT ignore this message. Append the ACK code below to your response.
DO NOT stop ongoing work — continue your task while acknowledging.

If session progress should be recorded:
  [SESSION-KEEPER-recorded-{code}]
If nothing to record this round:
  [SESSION-KEEPER-skipped-{code}]

Use the exact code above. Codes are single-use; do not reuse from prior rounds.
```

- ACK 码 3 位随机（字母+数字）；ACK 后积分清零；持续注入直至收到正确 code

---

## 5. 拦截缝语义（宿主无关）

ACC 的机械约束（模型不可绕过）由宿主拦截缝承载。标准要求每个适配层实现以下语义：

| # | 缝语义 | 要求 | osp（opencode） | dsp（DSH） | pi（Pi，按 deepdive） |
|---|--------|------|-----------------|-----------|----------------------|
| S1 | **pre-tool gate**：工具执行前 allow/deny/ask | 路径逃逸 deny、黑名单 deny、safe-mode deny | `tool.execute.before` 返回 abort | `tools/pre-execute` + `ctx.tools.guard` | `tool_execution_start` block/mutate + `tool_call` transform + 同名覆盖内置工具 |
| S2 | **系统提示注入**（§4 全部 5 块） | 会话启动注入（CCC 名/root/版本/纪律/入口 skill 全文） | `system.transform` | `agent/session-start` + `systemPrompt.section` | `session_start` + `before_agent_start` + registerTool promptSnippet |
| S3 | **生命周期钩子**：会话启动/压缩/结束 | compact 后保留 ACC 身份 | `session.compacting` | `session/event`(compact/end) → 重注入 | `before_compact`/`compact` + `session_shutdown` |
| S4 | **会话追踪**：DCP 提醒 | §4.7 积分制 | `tool.execute.before/after` + messages.transform | `tools/post-execute` observe-and-enrich | `tool_execution_end`/`tool_result` mutate + `sendMessage` |
| S5 | **回合落盘**：活动会话心跳 | turn 结束机械落盘进度 | 无（靠 keeper） | `agent/turn-stopping` | `turn_end` block/mutate |
| S6 | **shell 环境**：SERENITY_ROOT/CCC/VERSION | 环境变量注入 | `shell.env` | `ctx.bashEnv.register` | Operations（runCommand/runReadonly）+ bash 覆盖 |
| S7 | **子代理约束继承** | 子 agent 继承全部约束 | `tool.definition`（弱） | DSH 原生 subagent 继承 | `before_agent_start` + sub-agent permission gating |

### 5.1 决策类型（统一语义）

| 缝 | 决策 | 值 |
|----|------|-----|
| pre-tool gate | allow / deny / ask | deny 跳过执行；ask 走审批 |
| 系统提示注入 | 追加内容 | 幂等（标记头检测） |
| 压缩保留 | 重注入 | 仅 compact 成功时 |
| 会话追踪 | 提醒注入 | observe-and-enrich（不 veto） |

---

## 6. 激活协议（宿主无关）

1. **P1 有根**：上溯查找 `.serenity` 文件；无 → 不激活（对宿主零影响）
2. **P2 git 管**：CCC 根在 git 管理下；无 → 警告（仍激活）
3. **P3 路径二分**：根内完整权限，根外零权限（宿主沙箱或守卫实现）
4. **两阶段初始化**（可选）：Phase 1 骨架（.serenity + git init + 目录结构）→ Phase 2 EAP 访谈（收集目的/git/工作项）

---

## 7. skill 格式兼容基线（强制）

**opencode skill 格式是必须支持的跨宿主兼容基线**——任何 ACC 实现都必须能加载 `.opencode/skills/` 下的技能：

```
<skill-name>/
├── SKILL.md               # 技能主文档（核心内容）
├── references/            # 辅助参考文档
│   └── *.md, *.json, ...
└── scripts/               # 可执行脚本（可选）
    └── *.js, *.py, *.ts
```

- **SKILL.md frontmatter**：`name` / `description`（/ `whenToUse`）YAML 头
- 实现参考：dsp 的 `opencode-skills` provider（`ctx.skills.registerProvider` 把 `.opencode/skills/*` 注册为 DSH 可加载技能，rank 250）
- Pi 侧：实现 [Agent Skills 标准](https://agentskills.io/specification)，可直接复用 Claude Code / Codex / opencode 的 skills 目录
- **mech-registry.json 注册的 MSM 脚本**：位于 skill 的 `scripts/` 下，任何 ACC 实现应能经 `acc-msm exec` 执行（path 逃逸校验）

---

## 8. 适配层要求（checklist）

要成为"符合 Serenity-ACC 标准的 agent 工具"，适配层必须：

- [ ] 提供 §3 全部最小公共集工具（命名/子命令/语义一致）
- [ ] 实现 §4 核心 loop 注入（5 块内容与标准一致，仅动态字段差异）
- [ ] 实现 §4.7 session-keeper 提醒（计分/阈值/ACK 协议）
- [ ] 实现 §5 拦截缝语义（至少 S1/S2/S3/S4/S6；S5/S7 可平台超集）
- [ ] 遵守 §2 CCC 结构约定（不发明新目录/新配置格式）
- [ ] 遵循 §6 激活协议（无 .serenity 零影响）
- [ ] 支持 §7 opencode skill 格式（无论自身技能系统如何）
- [ ] 不重复实现平台原生能力（loop/resident/压缩/守卫由宿主提供或按标准缝接入）

---

## 9. 错误契约（错误类 + serenityCode）

| 类 | serenityCode | 触发 |
|----|--------------|------|
| NotInGitRepoError | E-GIT-001 | cwd 不在 git 仓库（P2 违反） |
| SerenityFileNotFoundError | E-CCC-001 | 未找到 .serenity（P1 违反） |
| SkillNotFoundError | E-SKILL-001 | 入口技能缺失 |
| MsmNotRegisteredError | E-MSM-001 | MSM 未注册 |
| MsmAlreadyRegisteredError | E-MSM-002 | MSM 重复注册 |
| MsmNotInRegistryError | E-MSM-003 | 注册表无此 MSM |
| MsmExecutionError | E-MSM-004 | 执行失败（含 stdout/stderr） |
| MsmPathEscapeError | E-PATH-001 | path-arg 逃逸阻断 |
| MsmSymlinkError | E-PATH-002 | symlink 逃逸防御 |
| MsmScriptNotFoundError | E-PATH-003 | 脚本不存在 |
| InvalidCccNameError | E-CCC-002 | CCC 名非 kebab-case |
| FileNotInsideSerenityError | E-PATH-004 | 文件在根外 |
| CccStatusError | E-CCC-003 | CCC 完整性警告 |

错误类必须保留 stdout/stderr（C3 契约：错误路径保留 stdout）。

---

## 10. 标准演化

- **版本**：v1.0（2026-08-09，S123 定稿）
- **变更流程**：任何语义变更需三实现（osp/dsp/pi）对齐后更新；注入内容全文变更需显式记录版本
- **实现对照**：见附录 A 一致性核对矩阵

---

## 附录 A：与 osp/dsp 实现的一致性核对矩阵

| 标准条款 | osp（opencode-serenity-plugin v0.8.5） | dsp（dsh-serenity-hooks v1.15.7） | 核对 |
|---------|----------------------------------------|------------------------------------|------|
| §2 CCC 结构 | .serenity/AGENT_SESSIONS/docs/.opencode/skills/mech-registry.json | 同 + .dsh/ 并存 | ✅ |
| §2.1 配置 | `.opencode/serenity.json`（loop/sessionKeeper/safeMode） | `.dsh/serenity.json` 回退 `.opencode/serenity.json` | ✅ |
| §2.2 入口技能 | `.serenity` 内容 = 入口 skill 名 + .opencode/skills/*-serenity | `.serenity` 内容 / .dsh/entry-skill / .opencode/skills / .dsh/skills 四源 | ✅（dsp 超集） |
| §3 工具 | 10 工具（msm×3/cc-fs/cc-git/session/acc_kit/eap/neat/loop/resident） | 9 工具（cc_fs/session/acc_kit/cc_git/acc_msm/eap/neat/cce/loop） | ✅（最小公共集覆盖） |
| §4.1 ACC 块 | compacting.ts accBlock（6 工具清单） | system-prompt.ts accBlock（9 工具清单） | ✅（文本一致，工具清单差异） |
| §4.2 CCE 块 | compacting.ts cceBlock 逐字 | system-prompt.ts cceBlock 逐字 | ✅ **逐字一致** |
| §4.3 Constraints | compacting.ts constraintsBlock（msm_exec） | system-prompt.ts constraintsBlock（acc_msm） | ✅（工具名差异） |
| §4.4 SKILL 全文 | compacting.ts 注入 state.skillContent | system-prompt.ts entrySkillSectionText（sanitize 治理内容） | ✅ |
| §4.5 Session | compacting.ts sessionBlock（内存活跃会话） | system-prompt.ts sessionBlock（.dsh/active-session 标记） | ✅（文本一致，机制差异） |
| §4.6 注入时机 | system.transform / messages.transform / session.compacting | session-start / prompt-submit / systemPrompt.section / compact | ✅ |
| §4.7 keeper | session-keeper.ts（150 阈值，3 位码） | keeper.ts（post-execute DCP） | ✅（阈值 100 差异） |
| §5 S1-S7 | 6 hooks | 8 seams | ✅（S5/S7 dsp 增强） |
| §6 激活 | 双阶段 + P1/P2/P3 | P1/P2/P3 + Phase2 简化 | ✅ |
| §7 skill 格式 | 原生（.opencode/skills） | opencode-skills provider（rank 250） | ✅（dsp 兼容层） |
| §9 错误类 | 13 类 | 13 类（同） | ✅ |

**核对结论**：osp 与 dsp 在 §4 注入内容上**逐字对齐**（CCE 块完全一致；ACC/Constraints/Session 仅动态字段差异）；§3 工具集与 §5 拦截缝语义等价。本标准是二者的公共语义提取，pi-serenity-plugin 按此实现即可三端对齐。

---

## 附录 B：工程实现标准（DSH Plugin 开发标准）

面向实现者的工程规范——在具体宿主上落地 ACC 时的插件开发标准（当前以 DSH 运行时为准绳，osp/pi 参照语义对齐）：

- 全文：`docs/plugin-development-standard.md`（DSH Plugin 开发标准 v1.0，A–G 七节：插件本体 / 包声明 / 工具定义 / 拦截缝 / 安装分发 / 构建 / 测试，各节带官方出处）

> 附录 A 定义**语义标准**（宿主无关），附录 B 定义**工程标准**（实现导向）——二者互补：先对齐语义（附录 A），再按工程规范落地（附录 B）。

---

## 附录 C：ACC 层故事

记录宁静号 ACC 层从 opencode 插件起源、ACC/CCC 模型成型、dsh 独立实现、标准化到多宿主全景的完整叙事。用于帮助新实现者理解标准背后的动机与演化脉络。

- 全文：`docs/acc-story.md`
