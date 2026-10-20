# Serenity-ACC 认知容器标准（Specs v4.1.0）

> **一句话**：宁静号本质是**标准**而非实现。任何符合本标准的 agent harness，都应当能与任何现存 CCC 良好工作——**任何一方都无需修改**。
>
> **兼容硬约束**：**opencode skill 格式必须得到支持**（无论 ACC 的实现是什么）。
> **仓库**：[github.com/tellmewhattodo/serenity-acc-specs](https://github.com/tellmewhattodo/serenity-acc-specs)（公开标准仓库）

---

## 这份标准是什么／不是什么

| | |
|---|---|
| **是** | 宿主无关的 **ACC 语义**：六条不变量、容器结构、工具契约面、成员装配内容、拦截缝语义、激活协议、错误契约 |
| **是** | **验收依据**——§1 每条不变量都带**机械判据**与**违反时的可观测症状**，可据此判一个实现合不合规 |
| **不是** | 任何实现的当前状态。**版本号、工具计数、发布/代码态一律不进正文**（易变值 ⇒ 指针化） |
| **不是** | 宿主内部实现指南。宿主专有的产品能力（IM 桥 / ACP / 定时）**不升标准**，以各实现仓文档为准 |
| **不是** | 历史。逐版本变更记录只在 `CHANGELOG.md` |

> **为什么"不是"要写出来**（R↓）：上一版没有非目标，于是"什么都讲"= 没有重点；读者读完 1300 行仍不知道**自己该拿什么去验收**。非目标与不变量是同一枚硬币的两面。

## 怎么读（本仓三条纪律）

| 纪律 | 内容 | 去哪看 |
|---|---|---|
| **① 历史不入正文** | 每个版本改了什么、为什么改、取舍是什么 —— 全部归 `CHANGELOG.md`。正文只写**此刻必须成立什么**。 | `CHANGELOG.md` |
| **② 易变值只给指针** | 会漂的值（实现版本号、工具计数、发布态）**一律不写进正文**，只写"去哪读"。确需具体读数时须标**当时读数 + 日期**，并声明它会漂。 | `dashboard health`（运行态）／各实现仓 `CHANGELOG.md` |
| **③ 断言实现行为要取证** | 凡说"某实现如何行为"，取证等级见 §11.4 —— **不照散文转述实现**。 | §11.4 |

> **② 的由来**：上一版把实现的版本号与工具数写死，而这两者会漂 ⇒ 本标准的漂移**全部从同一处结构缺陷产出**。改成指针后，实现升版不再触发本仓修订。

## 目录

| 章 | 内容 | 读者 |
|---|---|---|
| **§1** | **六条不变量**（唯一必读章）| 所有人 |
| §2 | 术语 | 所有人 |
| §3 | 容器结构约定 | 实现者 |
| §4 | 工具契约面 | 实现者 |
| **§5** | 成员装配（Induction）→ **全文在 [`docs/induction.md`](docs/induction.md)** | 实现者 |
| §6 | 拦截缝语义 | 实现者 |
| §7 | 激活协议 | 实现者 |
| §8 | skill 格式兼容基线 | 实现者 |
| §9 | 适配层 checklist（**验收用**）| 验收者 |
| §10 | 错误契约 | 实现者 |
| §11 | 标准演化 | 维护者 |
| 附录 A | osp/dsp 一致性核对矩阵 | 维护者 |
| 附录 B/C | 工程标准 / ACC 层故事（外链） | 实现者 |

---

# §1 六条不变量（唯一必读章）

> **为什么这一章最重要**：其余各章是它的**工程展开**。任何实现只要这六条成立，细节怎么写都不影响互通；任何一条不成立，其余写得再像也不合规。
>
> 🔴 **每条三栏并列**：承诺（要求什么）／**机械判据**（怎么验，不靠读代码）／**违反症状**（坏了长什么样）。第三栏是新增的——**没有它，失效是静默的**。

| # | 不变量 | 承诺 | 机械判据 | 违反症状 |
|---|---|---|---|---|
| **I1** | **CCC 是共享资产** | 所有宿主读写同一 `.serenity` 目录，不发明私有目录变体 | 换一个实现驱动同一目录，`dashboard health` 的 P1/P2 结论不变；无该实现的私有目录出现在 CCC 根 | 两个实现各建一份目录/配置 ⇒ 同一 CCC 出现两套状态 |
| **I2** | **无 `.serenity` 零影响** | 非 CCC 目录中，ACC 对宿主原生行为零影响 | 在无标记目录开会话：工具面与未装插件时**逐项相同**，系统提示无 ACC 块 | 出现"ghost 激活"——有注入/有工具但无根 |
| **I3** | **机械约束优先** | 能由拦截缝机械执行的，不依赖模型自觉 | 关掉提示词、只留缝：越界/黑名单/safe-mode 仍被拦 | 只有提示词在拦 ⇒ 换模型即失效 |
| **I4** | **skill 格式兼容** | opencode skill 格式必须可被任意实现加载 | 把同一 `SKILL.md` 放进两套实现的 CCC，都能被发现并注入 | 某实现只认自己的格式 ⇒ 技能不能跨宿主带走 |
| **I5** | **装配内容一致** | Induction 各块文本与 §5 一致（仅动态字段可差） | 逐块做**定长全文检索**，要求**单命中**；块序与标记头一致 | 散文描述"差不多"，实际文本已漂 ⇒ 换实现后主体认知不同 |
| **I6** | **轨迹主体优先** | 一切机制服务轨迹连续性；**载体可重建，轨迹身份不可销毁** | 执行 `rebuild` 后 `SESSION.md` **逐字节不变**、绑定仍指向同一轨迹；`archive` 后目录**一字节不动** | `rebuild` 丢失轨迹身体，或"归档"删改了内容 ⇒ 主体被测掉了 |

**I6 展开**（它是其余五条的目的）：Agent 可替换、Session 可重建，**认知轨迹连续**。轨迹**没有生命周期**——不完成、不关闭、不过期；唯一会变的是**存在哪里**（`archive` 只移出活跃清单）。

---

### 1.0 这些不变量从哪来（理论根基 · 指针）

本章六条不是约定俗成的清单，它们有一条推导前提：**认知轨迹是主体，会话只是它的可重建载体**（Agent 可替换、LLM 是介质、载体可丢弃重建）。**I6 是这条前提的直接形式化**，其余五条是它的工程条件。

完整论证（认知 Loop／时间的相对性／闭环／与现有概念的衔接／命名判据）见 **[`docs/theory.md`](docs/theory.md)**。

> 为什么不在正文展开：标准正文的职责是「**必须成立什么**」，理论的职责是「**为什么**」。两者读者不同——验收者读 §1，理解者读 theory。

---

## §2 术语（E↑）

| 术语 | 定义 |
|---|---|
| **ACC** | Abstract Cognitive Container。宿主无关的认知容器蓝图：工具契约 + 拦截缝语义 + 激活协议 + 装配内容。**本标准的主题**。 |
| **CCC** | Concrete Cognitive Container。带 `.serenity` 标记文件的目录，ACC 的运行时实例。**共享资产，宿主无关**。 |
| **宿主** | agent loop 运行时（opencode / DSH / Pi / 未来其他）。ACC 通过宿主扩展机制挂载。 |
| **适配层** | 在某宿主上实现 ACC 的产物（opencode 的 plugin、DSH 的 native cordis plugin、Pi 的 extension）。 |
| **入口技能** | CCC 的顶层认知技能（`*-serenity` 命名的 `SKILL.md`），全文注入（§5.7）。 |
| **MSM** | Mech & Semi-Mech。CCC 内注册的可执行单元，经 `mech-registry.json` 登记；由 `msm` 单入口执行。 |
| **拦截缝** | 宿主提供的可编程拦截点（工具前后、会话生命周期、系统提示组装）。 |
| **认知轨迹 / cognitive trajectory** | 认知过程的连续存在。**主体**：Agent 可替换、Session 可重建，轨迹连续。**没有生命周期**。 |
| **会话 / Session** | **认知轨迹的可重建载体**。`SESSION.md` 是持久身体（存储形态），工作会话是运行副本（再发生形态）。 |
| **自我交代** | 轨迹目录内关于它自己的三份声明：`SESSION.md`（过程）／`trajectory.json`（设定）／`current.dsh_session_bind`（当前载体）。**轨迹的全部身份 = 这三份**。 |
| **Induction** | 系统提示注入机制统称——把新实例（新会话／rebuild／新 agent）**注册为轨迹成员**的装配机制。 |
| **轨迹督促 / trajectory-assistant** | 过程性动态提示注入（计分督促＋重建提醒＋输出打回＋体积治理）。 |
| **serenity-skill** | 增强型 skill 标准：opencode 格式之上追加**可选**本体口（`skill.ttl`）与**必过**分层档（A3）。**未建模的普通 skill 完全合法**。 |

---

## §3 容器结构约定

```
<ccc-root>/
├── .serenity                     ← P1 标记（文件）；内容 = 顶层入口 skill 名
├── .serenity-safe-on             ← 安全模式标记（存在即 ON；用户能力）
├── .git/                         ← P2：CCC 必须处于 git 管理下
├── AGENT_SESSIONS/               ← 认知轨迹的库房
│   ├── <轨迹目录>/
│   │   ├── SESSION.md            ← 持久身体（7 段固定格式，权威）
│   │   ├── PROMPT.md             ← 章程（轨迹级提示词，§5.9a）
│   │   ├── trajectory.json       ← 声明面：约束 ＋ 旧标识 ＋ 机器绑定（§3.0.1）
│   │   ├── current.dsh_session_bind ← 当前载体（单槽位，唯一真相）
│   │   ├── REBUILD-TODO.md       ← 交界便签（非权威，10 KB 硬上限）
│   │   ├── cro-wake-log.log      ← 唤起流水（2 日窗轮转）
│   │   └── continuous-re-occurrence.ts ← CRO 程序（文件在 = 启用）
│   └── _archived/                ← 归档区（模板目录；**归档不释放编码**）
├── _tmp/acc-usage.json           ← 用量统计
├── docs/                         ← 设计文档
├── .opencode/                    ← opencode 标准配置（**必须支持**）
│   ├── serenity.json             ← ACC 配置（§3.1）
│   └── skills/<ccc-name>/references/mech-registry.json ← MSM 注册表（单级聚合，写保护）
└── .dsh/                         ← DSH 标准配置（可选，二选一即可）
```

> **注册表位置**：单级聚合于入口技能目录的 `references/` 下（`ccc-name` = `.serenity` 首行）。文件**写 deny、读 allow**；管理走 `container_admin msm register/deregister`，**不得经文件工具直接改**。

### 3.0 结构文件的三条语义线（别混为一谈）

按**主语**分三线——混用会让"谁负责清理"无从判定：

| 文件 | 主语 | 格式义务 | 上限 | 权威性 |
|---|---|---|---|---|
| `SESSION.md` | **轨迹**（持久身体） | **有**：7 段固定 + 粒度纪律 | `sessionKeeper.sessionMdMaxKB`（缺省 200 KB） | **权威**（轨迹唯一持久真相源） |
| `REBUILD-TODO.md` | **交接**（一次性） | **无**——要求按 EAP 写但不给骨架 | **10 KB 硬编码常量**，刻意不设配置键 | 🔴 **明确非权威**，可整份丢弃 |
| `cro-wake-log.log` | **实现**（投递面） | 有（字段形状实现自定） | **2 日窗**，写入时程序化轮转 | 观测档，非判定真相源 |

- **`REBUILD-TODO.md`**：与 `SESSION.md` 同目录、固定文件名、唯一机械约束 = 10 KB。取代旧机制"把 in-flight 写在 SESSION.md 末尾"——**持久文件（有格式义务）与只用一次的交接材料必须分离**。写侧 = rebuild 提醒；读侧 = 重建锚点；三处引用**同一文件名常量**（漂移则读侧找不到写侧写的，**且无机械信号报警**）。
- **`.restrict-diag.json`**：工具可见性诊断档，至少含 `denyByKey` —— `{会话 key → 实际生效的 deny 清单}`，用于回答"某工具为什么／为什么没被隐藏"。**只读诊断面**。

### 3.0.1 轨迹声明面：`trajectory.json`（一份文件，三件事）

```jsonc
{
  "model": "provider/model",          // 可选；缺省回退宿主级默认 worker 模型
  "tools": ["read","grep","msm"],     // 非 MSM 工具白名单（白名单外**从 schema 移除**）
  "msms":  ["memory-tool"],           // MSM 白名单
  "cognitiveTrajectory": { "session": true, "keeper": true, "rebuild": true },
  "systemPrompt": "...",              // 内嵌章程（兼容期；PROMPT.md 优先）
  "systemPromptFile": ".opencode/…",  // 章程文件（相对 CCC 根，按 mtime 热重载）
  "uid": "my-handle",                 // 只读遗留标识（身份已归轨迹编码）
  "cro": { "host": "<机器名>" },       // 本轨迹的 CRO 程序只许哪台机器跑
  "resident": { "serves": "…" },      // 自我声明：我在此、我擅长什么
  "prompt": {                         // 章程**怎么进场**（缺省 = 追加）
    "injection": "replace",           //   append（缺省）| replace（替换下方点名的约束块，§5.9b）
    "replaces": ["cce", "eap"]        //   可选；不写 = metaphor/principles/cce/eap 四块全换
  }
}
```

**`prompt` 段的三条契约**（§5.9b「约束层例外」）：① `injection` 只有 `append` / `replace`；② `replace` 要求该轨迹目录里**真有 `PROMPT.md`**（没有替代物的替换 = 静默清空纪律 ⇒ 降级回 `append` 并告警）；③ `replaces` 的合法值只有 `metaphor` / `principles` / `cce` / `eap`，**`identity` 刻意不可替换**（写进去即丢弃并指名告警）。

**三件事为什么并进一个文件**（判据 = 主语一致）：约束面／旧标识／机器绑定**都是"这条轨迹的声明"**，主语相同、生命周期相同、都应随 git 走。分散成三个文件名时，**"哪个是声明、哪个是运行态"只能靠记文件名**——而运行态（`cro-state.json`）恰好也在同一目录。收拢后主语一目了然：**`trajectory.json` 里的是声明；`cro-state.json` 是程序的产物。**

**刻意不并进去的**：`cro-wake-log.log` —— ① 它是**追加型流水**（按时间窗裁剪）；② 并入结构文件 ⇒ 每写一行流水都要**重写整份声明** ⇒ 一次写坏**同时丢掉约束面与机器绑定**。⇒ **声明可人改可 diff；流水高频追加可丢** —— 两种写入频率、两种失效代价，不能同居一个写通道。

#### 文件名族与两代并读（**不得硬切**）

| 项 | 契约 |
|---|---|
| **判据族** | `trajectory.json` → `trajectory-constraint.json` → `skiff.json` —— **任一存在即成立，顺序即优先级** |
| **写入** | **只写新名**；旧文件**永不自动删** |
| **为什么认族** | 上游改名、下游写死旧名是本族**反复发生的失效形态**（症状"配置没生效"与真因"文件名对不上"在读数上完全不像）。⇒ 再改名只往族里加一项 |
| **`cro.host` 的额外硬约束** | 🔴 **必须两代并读**（新字段 ＋ 旧文件）。理由**有行为后果**：绑定要跟着轨迹**走到第二台机器**，在那里被判成「**绑给了别人**」而正确地不跑；硬切之后那台机器读到「**没绑**」——*表面结果相同，但判据退化*（失去可诊断性） |
| **`uid` 的读法** | 有合法 `uid` ⇒ 用它；否则回落旧独立文件 `TRAJECTORY-UID`。**写入侧无此动作** |

> **术语**：**轨迹编码（code）= 目录名里那个固定位置的段**（`YYYY-MM-DD--<code>`），它是轨迹的**唯一标识**。`uid` 是它之前的一代标识，**只读保留**。⚠️ 两者**不是同一个字段**：`code` 是派生的结构，`uid` 是可选别名。

> 🔴 **编码终身唯一 —— 归档不释放它**（2026-10 裁决）。`archive` 只改位置、不改身份 ⇒ **分配新编码时必须扫归档区**。一个可复用的身份码会让历史投递/唤醒条目/文档引用**静默指向另一个对象**。

### 3.1 配置单真源

**(a) CCC 级配置** —— `<CCC>/.opencode/serenity.json`（宿主私有的 `.<host>/serenity.json` 可作回退）：

- **白名单模型 / worker 轮次与并行上限 / 安全模式黑名单 / 工具可见性 / 会话督促阈值** 等键集见实现仓配置 schema。
- **配置读优先级：面板层 > 部署层 > 内建缺省**，且**每次求值现读**（改配置无需重启宿主）—— 见 §7。

**(b) 三键的失败方向各异（不得统一处理）**：`exclusiveTools` **fail-closed**（默认态即隐藏，读不到 = 无证据要它）｜`im-bridge` 可见性 **fail-open**（隐藏一个**已在使用**的通道才静默损害能力）｜`safeMode.hiddenTools` **fail-open**（是**附加**屏蔽；**隐藏是危险方向**）。

### 3.2 入口技能发现（权威语义）

`.serenity` 首行给出入口技能名；实现按名定位 `SKILL.md`。多源（如 `.dsh/entry-skill` 指针）属实现扩展，**不得改变"按名定位"这一语义**。

### 3.3 用量统计

`_tmp/acc-usage.json`：**loads / injections 口径分离**、**只记名字**、原子写。属实现侧观测面，不进契约。

---

## §4 工具契约面

每个适配层必须提供以下工具（**命名、子命令、语义一致**；实现方式宿主自定）。

> **命名判据**：**`container_<X>` = 掌管容器自身结构之 X**（`container_fs` / `container_git` / `container_admin`）——前缀表**作用域**。
> **主语不是容器结构的工具一律无前缀**：`cognitive_trajectory`（它是容器服务的**主体**）／`msm`／`praxis`／`dashboard`／`localstore`。
> 🔴 **工具数与现值不回写本节**：本节写契约面；此刻注册了几个 = `dashboard health`。

### 4.1 最小公共集（常驻，必选）

| 工具 | 动作/子命令面 | 要点 |
|---|---|---|
| `container_fs` | 15 子命令：`root/resolve/exists/list/tree/relative/mkdir/rm/mv/cp/touch/append/reveal/info/find` | **路径逃逸阻断** |
| `container_git` | **6 动作**：`status/commit/push/log/pull/diff` | 见下「提交-推送耦合」 |
| `cognitive_trajectory` | **10 动作**：`list/show/create/use/rebuild/archive/uid/send-later/send-now/cro-guide` | 见下逐动作语义 |
| `msm` | 单入口执行＋发现：`msm(name, args)` | 未命中 → 模糊候选；`inspect=true` 查用法；无参 → 分类目录；path 逃逸校验；600s 超时 |
| `container_admin` | `config`（docs / docs `<chapter>` / view / guide / validate / apply / list）＋ `msm`（register / deregister / check / guide / catalog / ccc-config） | **机务舱**。已退场：`autopilot` 域、`role` 域（保留为过渡别名） |
| `dashboard` | `health`（P1/P2/配置 + registry 完整性）/ `time` / `wait` | 常开仪表 |
| `praxis` | 索引（无参）/ **四段** `eap` / `neat` / `cce` / `ontology` | 方法文本注入 |
| `ontology` | **7 动作**：`init/check/explain/verify/review/compliance/viz` | **引擎**（`praxis ontology` 是**说**，本工具是**跑**）。退出码 0/1/2/4 **作为返回值不抛** |
| `serenity-skill-creator` | `guide` / `create` / `check` / `review` / `index` / `status` | **只有 `create` 写文件**且拒绝已存在目录 |
| worker（`handyman` / `cheap-worker`） | 前台串行委派（缺省）／后台循环（白名单模型 + stop token） | **前台并行上限 10（硬编码）**，超限 ⇒ **拒绝且一个都不起** |
| `localstore` | 凭据/配置存储（CCC 根 `localstore.json`） | git 策略 `localstore.gitTrack` 缺省 deny |

**`cognitive_trajectory` 逐动作语义**：

| 动作 | 语义 |
|---|---|
| `list` / `show` / `create` | 清单+统计+异常标注 / 读一条 / 建一条（`--id` 可**指定编码**，撞车即拒） |
| `use` | 激活（内联三项完整性检查：存在性 / 空壳 / 长期无活动——通过则静默） |
| `rebuild` | 原地清空重建 = Ship of Theseus（**`SESSION.md` 逐字节不变**） |
| `archive` | 移入归档区、离开活跃清单；**单向、不覆盖、内容逐字节不变**；无反向动作 |
| `uid` | **只读**遗留标识（传值 ⇒ 拒绝并指向 `create --id`） |
| `send-later` | 未来时刻 + 一条 message；fire-and-forget——**无回执、不可回收** |
| `send-now` | **即时投递**：live 立即注入；非 live 走冷载入；**同步回执**；不落注册表 |
| `cro-guide` | CRO 编写指南——无参数、纯读 |

- **两条投递路径的分界**：预约（无回执）vs 递话（有回执）——**刻意不把两种语义塞进同一动作**。
- **队列语义（真机实测）**：每个轮次边界只投出一条待投消息、先入先出，其余顺延——两条同时在队**不会同批到达**、**不丢**；回执只承诺「**已入队**」（目标在跑轮次时于**轮次边界**生效，**不打断当前轮**）。
- **已淘汰**：`close`（轨迹无生命周期）/ `health`·`qa`·`summary` / `wake-list`·`wake-rm`（不可回收）。⚠️ `archive` **不是**淘汰项。

**`container_git` 契约要点（提交-推送耦合）**：

| 项 | 要求 |
|---|---|
| **commit 默认随后自动 push** | `noPush` 可关。**push 失败不得吞** |
| **`paths`** | 传 ⇒ 只提交这些路径；**不传 = 整仓 `add -A`**（会卷入其它轨迹的在途文件 ⇒ 回执**必须显式告知**） |
| **`status` 字段** | 至少含 `clean` / `files[]` / `summary` / **`ahead`** / **`behind`** |
| **`pull`** | fetch + `merge --ff-only`；非快进 ⇒ `[REJECTED]` + 建议，**never auto-force** |
| **🔴 push 成功判据** | = **`git push --porcelain` 的 stdout 里读到 ref 行**。**超时/读不到 ⇒ 一律不声称成功**，并给 `ls-remote` 核验指令。⚠️ **不得**用"stderr 为空"当判据（实证：超时**不设 `err.killed`**，成功路径又丢弃 stderr ⇒ 两种情形都交出空 stdout/stderr ⇒ 旧判据把**超时**报成成功） |
| **超时** | 本地/网络**分别**可配；**每次调用现读**（不在模块加载时固化） |
| **冲突** | merge/rebase/冲突解决**走外部 shell**，不 Mech 化 |

**条件可见**：工具可声明"本 CCC 未配置该能力时不可见"——实现 = 调宿主作用域工具收窄，把工具**从 schema 移除**（非"可见但调用期拒绝"）。判据必须来自**本 CCC 的配置**，热更新即时生效。**不改变 §4.1 最小公共集。**

**专属工具**：可声明"**默认对所有 CCC 隐藏**"——判据 = `exclusiveTools` **逐字声明**；ACC 侧不出现具体 CCC 的名字。**条件可见不改变"注册"事实**（故工具计数含它）。

**🔴 域外全局隐藏**：ACC 工具注册在**宿主级** ⇒ 与会话 cwd 无关地出现在每个会话里。**判据 = 在不在 CCC 内**：在 CCC 内 ⇒ **一次 restrict 都不发**；不在 CCC 内 ⇒ **全部 ACC 工具从模型清单移除**（不得只靠"调用时抛错"——那是运行时报错，不是事先不可见）。⚠️ 必须**逐个名字显式列出**，且因**条件工具缺省不在册**，全表 deny 会**整次失败** ⇒ 须**两档尝试**（① 全表 → ② 常驻段）；**档①失败不报警**（按设计就失败），只有**两档全失败**才响亮报告一次。

### 4.2 非必需（平台原生优先）

| 工具 | 说明 |
|---|---|
| Skiff / ACP / IM 桥 / Autopilot | **宿主特定产品能力**，不升标准 |
| `im-bridge` | IM 发送家族（`channel/action/user/text/file/caption/account`）；**条件可见**——未启用任何通道则从工具面移除；**只能操作本会话 CCC**。新增通道 = 注册实现，不改工具名与参数形状 |
| `acc-diag` | 运行态诊断（live 会话 + 时钟态 + 唤醒注册表）；**专属可见**（逐字声明后才可见）；**只读** |
| `diagram` | 标签源码 → 图（进程内光栅化，不借浏览器）。🔴 **两条宿主契约**：① `output.render` 是**同步投影**（返 Promise ⇒ **整条调用失败**，图文一并丢失）② 图片走附件 **durable 引用** ⇒ `execute` 异步存字节 + `render` **同步**装配。**缺省关，关时连注册都不调用** |

> **条件可见的三者**：判据各不同（IM 配置 / `exclusiveTools` / 开关），但**都仍在注册清单里**——"条件可见"不改变"注册"这一事实。

### 4.3 MSM 注册表（`mech-registry.json`）

```json
{
  "version": 1,
  "entries": [
    { "name": "my-msm", "path": ".opencode/skills/<ccc>/scripts/my-msm.ts",
      "skill": "<skill>", "category": "mech", "description": "one line",
      "usage": "...", "flags": [{ "name": "output", "type": "string" }] }
  ]
}
```

- **顶层键三形态**：`entries` ｜ `msms` ｜ 裸数组 —— 实现须**三种都认**。
- `type:"path"` 的 flag **必须**做路径逃逸校验。
- 🔴 **"读不出来"是 error 不是 info**：注册表读不出 ⇒ 健康检查 registry 段须**报错**。
- **写保护**：注册表及 `references/` 节点**写 deny、读 allow**（它是结构核心不是秘密——需被输出守卫读建词表）；`container_admin msm` 内部豁免。
- **健康检查**：`dashboard health` 必须含 **registry 完整性段**——parse（剥 BOM）/ 顶层 wrapper / 每 entry 字段类型 / name 唯一 / path 根内 + 脚本存在；坏不抛错（坏表 → `ok:false` + issues + git 恢复指引）。
- **恢复**：register/deregister 精提交后可 `git checkout -- <registry>`（ACC 只给指引，不内置 `--restore`）。

### 4.4 改名对照（现行 ← 历史）

| 现行 | 历史 |
|---|---|
| `container_fs` | `cc-fs` / `cc_fs` |
| `container_git` | `cc-git` / `cc_git` |
| `container_admin` | `skiff_admin` + `acc_msm` 管理面 |
| `msm` | `acc-msm` / `acc_msm` 执行面 |
| `praxis` | `eap` + `neat` + `cce`（+ `ontology` 段） |
| `cognitive_trajectory` | `session` + `session_rebuild`；`logbook` → `trajectory` → `container_trajectory` → **本名** |
| `dashboard` | `acc_kit` |
| worker | `handyman` / `loop` |

> **改名一律硬切、无兼容别名**；旧会话中出现旧名时，**取所在组的末项**。

### 4.5 CRO（Continuous Re-Occurrence）—— 轨迹自编程唤起

一条轨迹可以在自己目录里放**一段程序**，由它决定**自己何时该被唤醒**：文件 `continuous-re-occurrence.ts` 存在即启用；ACC **只 spawn 不 import**；输入 = 一份**快照约定**（含**明确不包含**项）；输出 = **决策契约**；🔴 **CRO 失败不得影响既有投递链路**；`cro-guide` 可及；唤起流水落 `cro-wake-log.log`（§4.5.8：纯文本行 + 固定名 + 原子写 + 2 日窗；`notReady` **不记**）。

---

## §5 成员装配（Induction）

> **全文见 [`docs/induction.md`](docs/induction.md)** —— 那里是**逐字契约**（各块文本 + 判据），本章只给骨架与不变量。

**骨架 = 8 内容块 × 五层**，按「从稳定到易变、从抽象到具体」装配。物理固定位 9（8 骨架 + 1 渲染层）：

```
ACC → Metaphor → Principles → CCE → (EAP | Persona) → [状态] → [SKILL] → Tools → [Session]
```

| 层 | 稳定性 | 块 | 职责 |
|---|---|---|---|
| **A 主体定义** | 跨会话不变 | ACC 身份 + Metaphor* + Principles + CCE | 成员资格声明 |
| **B 质量规范** | 跨会话不变 | **EAP 或 Persona**（二选一，占同位） | 输出质量标准 |
| **C 状态调节** | 进程内可变 | SafeMode / Localstore（条件） | 当前运行状态 |
| **D 工作供给** | 较稳定 | SKILL 全文 + Tools | 用什么知识/能力工作 |
| **E 任务指示** | 每轮易变 | Session（条件） | 本轮在哪条轨迹、做什么 |

\* Metaphor 是 **dsp 扩展**（渲染层，不计入 8 块骨架）。

**四条装配约束**（缺一条即不合规）：

1. **相邻层不得跳**：永不从"一句话意图"直接展开为"具体产物"（= 无约束解压 ⇒ 幻觉）；永不把表面直接压成公理而不经中间层（= 无结构压缩 ⇒ 信息丢失）。
2. **四层覆盖权限**（`§5.9b`）：①容器层（**身份**）🔴 **永不可被轨迹覆盖**；①b 约束块（Metaphor/Principles/CCE/操作边界）＋ ②质量层（EAP）⚠️ **默认不可覆盖**，**唯一例外** = 该轨迹显式声明 `prompt.injection="replace"` 且自带 `PROMPT.md`（§5.9b「约束层例外」）；③轨迹章程层（`PROMPT.md`）✅ 可补充/收窄（`replace` 时取代被点名的块）；④表达层 ✅ 只能收窄。**判据 = "这一层被覆盖会不会动摇安全或质量底线"**。
3. **幂等**：按标记头检测，同一会话不重复注入；**compact 后必须重注入**。
4. **Persona 未配置 ⇒ 与无 persona 逐字节一致**（这是该机制的验收判据，不是"近似"）。

**为什么写死"不可覆盖"**（R↓）：旧实现允许整段替换 ACC 注入，它带来一个**安静的失效**——被替换的实例**拿不到容器身份与质量约束**，而**它自己不会知道自己缺了什么**（读到的就是全部）。⇒ **层级不是分格，是权限**。

**相关机制**（全文在 induction 文档）：注入时机（§5.10，含 **scoped 双注册抗 shadow**）／轨迹督促 §5.11（计分、token 体系、ACK、`LOGBOOK COMPACTION` 与 `SCRATCH PRUNE` **刻意分开**）／轨迹 skill 供给 §5.12（CCC 级 ∪ 轨迹级，**并集不是二选一**）。

---

## §6 拦截缝语义

ACC 的机械约束（模型不可绕过）由宿主拦截缝承载。每个适配层必须实现以下**语义**：

| # | 缝语义 | 要求 |
|---|---|---|
| **S1** | **pre-tool gate**：执行前 allow/deny/ask | 路径逃逸 deny、黑名单 deny、safe-mode deny |
| **S2** | **Induction**（§5 全部内容） | 会话启动注入 + 每轮系统提示组装 |
| **S3** | **生命周期钩子**：启动/压缩/结束 | **compact 后保留 ACC 身份** |
| **S4** | **会话追踪**：提醒 | §5.11 积分制，**observe-and-enrich 不 veto** |
| **S5** | **回合落盘**：活动会话心跳 | turn 结束机械落盘进度 |
| **S6** | **shell 环境**：`SERENITY_ROOT` / `CCC` / `VERSION` | 环境变量注入 |
| **S7** | **子代理约束继承** | 子 agent 继承**全部**约束（文件边界、shell、会话规则，无旁路） |

- **最低要求**：S1/S2/S3/S4/S6；S5/S7 可平台超集。
- **子槽唯一声明者**：宿主槽位同一子槽**不允许两个声明者**——第二个在**装载期抛错**（不是运行时静默覆盖）。⇒ 实现须保证任一子槽**只有一个** ACC 侧声明者；新增客户端面时先在实现内查重。

---

## §7 激活协议

1. **P1 有根**：上溯查找 `.serenity` 文件；无 ⇒ **不激活**（对宿主零影响，I2）。
2. **P2 git 管**：CCC 根在 git 管理下；无 ⇒ 警告（仍激活）。
3. **P3 路径二分**：根内完整权限，根外零权限（宿主沙箱或守卫实现）。
4. **两阶段初始化**（可选）：Phase 1 骨架（标记 + git init + 目录结构）→ Phase 2 EAP 访谈（目的 / git / 工作项）。

**配置读优先级**：**面板层 > 部署层 > 内建缺省**，且**每次求值现读**（改配置无需重启宿主）。

---

## §8 skill 格式兼容基线（强制）

### 8.1 兼容基线：opencode skill 格式

```
<skill-name>/
├── SKILL.md          # 主文档（name / description / whenToUse YAML 头）
├── skill.ttl         # 🧬 可选：本体预留口（固定名，见 §8.2.1）
├── references/       # 辅助参考
└── scripts/          # 可执行脚本（MSM 落此，经 msm 执行，path 逃逸校验）
```

### 8.2 serenity-skill：增强型 skill 标准

**核心判据：未建模的普通 skill 完全合法**——增强必须对普通 skill **零告警、零误差**。

#### 8.2.1 本体预留口（可选）

- 🔴 **唯一被认的名字 = `<skill>/skill.ttl`**（与 `SKILL.md` 同级、固定名）。旧写法 `references/<name>-domain.ttl` **静默不被读**（不是报错，是**不会被任何读取方读取**）。
- **"已建模"的判据 = 恰好存在名为 `skill.ttl` 的文件**。**没有它不是异常**。
- **必须链上基础链**：`owl:imports` 指向本容器基础链，**且挂在 `a owl:Ontology` 的主语上**（引擎只在那里收集 import；写在别处会让检查照样全绿而链接实际不存在 —— 这正是检查档要捕捉的）。

#### 8.2.2 三档判据（A3 / A1 / A2）

| 档 | 适用范围 | 判据 |
|---|---|---|
| **A3 分层抽象树** | 🔴 **每一个 skill 都适用**（与有无 `skill.ttl` **无关**） | **A3-1** 顶层正文 ≥ **2048 B**（低于它 = 顶层只是桩）；**A3-2** 顶层**不得自称"只是导航层"**（≡ 顶层空缺，树倒置的直接症状）；**A3-3** `references/` **一级**下每份 `.md` **必须在 `SKILL.md` 里被点名**（顶层是**地图**）。⚠️ 字节口径：扣除 frontmatter 与生成的导航块。⚠️ **修法 = hoist**（把下层陈述上提，从原处删除并留指针），**不是加一句辩解** |
| **A1 结构合法** | 仅**已建模**的 skill | `check --level strict` 退出码 0 |
| **A2 链上基础链** | 仅**已建模**的 skill | `explain` 退出码 0 **且**报告含 `Imports:` —— 🔴 只认 `owl:imports` |

- **三态可分辨**：`check` 须让"已建模且通过" / "普通 skill（未建模）" / "已建模但检查跑不起来"**三种状态可分辨**；对普通 skill 也要给 A3 结论，并**明写**"A1/A2 未建模 ⇒ 不适用"。
- 🔴 **A3 与 A1/A2 分列**：**A3 判"文字住在哪一层"（结构形态）**；**A1/A2 判"本体"**。

#### 8.2.3 第二层披露规则（参考件清单）

**只告知模型"有什么"，不注入"是什么"**。六条：① 只枚举不注入正文；② 排序 = 相对路径 **UTF-8 字节序**（🔴 不用 mtime——它随检出漂移，会让每请求注入文本抖动）；③ **有界＋响亮**（超限**必须显式写出还剩多少项**，绝不静默截断）；④ 摘要 = 该文件**首个 `#` 标题**（取不到 ⇒ 留空，**不编**）；⑤ `skill.ttl` 存在 ⇒ 标 🧬 ＋ "已建模"；⑥ 范围 = `references/` **一级**条目 ＋ `skill.ttl`（子目录给名字＋计数、不展开）。

**三处落点必须同源**（共用同一份范围定义——各写一遍必然漂移）：**载入面**（入口段 order −50 ／轨迹段 order −45 ／目录 provider 的 `get().content`）= 名字＋首标题＋字节；**目录面**（`list()` 的 `SkillSummary.description`）= 🔴 **只有名字、零字节正文读取**（每请求 × 每 skill，必须最轻）。

#### 8.2.4 工具面

`serenity-skill-creator` 是标准的**机械检查入口**：`check <name>` 打印序 **A3 → A1/A2**；`index <name>` 预览模型将看到的第二层清单；`status` 给全容器三态一览。**只有 `create` 写文件**。

---

## §9 适配层 checklist（**验收用**）

要成为"符合 Serenity-ACC 标准的 agent 工具"，逐项打勾：

- [ ] §4 全部最小公共集工具（动作面：`container_git` 6 ／ `cognitive_trajectory` 10 ／ `ontology` 7 ／ `praxis` 4 段）
- [ ] §4.1 **域外全局隐藏**（不在 CCC 内 ⇒ 全部 ACC 工具从模型清单移除；两档尝试，档①失败不报警）
- [ ] §5 Induction 与标准一致（仅动态字段差异）；**Persona 未配置时与无 persona 逐字节一致**
- [ ] §5.11 提醒机制（计分/阈值/预声明/ACK + token 体系**含 `SCRATCH PRUNE`**）
- [ ] §4.5 CRO（文件在即启用 / 快照契约 / 决策契约 / **失败不影响既有链路** / 流水）
- [ ] §6 拦截缝（至少 S1/S2/S3/S4/S6）
- [ ] §3 结构约定（不发明私有目录/配置格式；注册表单级聚合 + 写保护）
- [ ] §7 激活协议（**无 `.serenity` 零影响**）
- [ ] §8.1 opencode skill 格式；若实现 serenity-skill，须实现 **A3**（所有 skill）与 **A1/A2**（已建模），普通 skill 零噪声
- [ ] 不重复实现平台原生能力

> **验收判据（机械）**：§1 六条不变量的"机械判据"列**逐条可执行**；本 checklist 只是把 §1 展开到可打勾粒度。**两处不一致时以 §1 为准。**

---

## §10 错误契约

| 类 | serenityCode | 触发 |
|---|---|---|
| `NotInGitRepoError` | `E-GIT-001` | cwd 不在 git 仓库（P2 违反） |
| `SerenityFileNotFoundError` | `E-CCC-001` | 未找到 `.serenity`（P1 违反） |
| `SkillNotFoundError` | `E-SKILL-001` | 入口技能缺失 |
| `MsmNotRegisteredError` | `E-MSM-001` | MSM 未注册 |
| `MsmAlreadyRegisteredError` | `E-MSM-002` | 重复注册 |
| `MsmNotInRegistryError` | `E-MSM-003` | 注册表无此 MSM |
| `MsmExecutionError` | `E-MSM-004` | 执行失败（**必须保留 stdout/stderr**） |
| `MsmPathEscapeError` | `E-PATH-001` | path-arg 逃逸阻断 |
| `MsmSymlinkError` | `E-PATH-002` | symlink 逃逸防御 |
| `MsmScriptNotFoundError` | `E-PATH-003` | 脚本不存在 |
| `InvalidCccNameError` | `E-CCC-002` | CCC 名非 kebab-case |
| `FileNotInsideSerenityError` | `E-PATH-004` | 文件在根外 |
| `CccStatusError` | `E-CCC-003` | CCC 完整性警告 |

### 10.1 失败方向与"非零退出"的边界

| 项 | 契约 |
|---|---|
| **逐键失败方向** | `exclusiveTools` **fail-closed**；`im-bridge` / `safeMode.hiddenTools` **fail-open**。**不得统一处理**——方向由"默认态"与"隐藏是否为危险方向"共同决定 |
| **引擎退出码** | `0` 干净 / `1` 参数或校验失败 / `2` 文件或解析失败 / `4` 内部错误。🔴 **非零作为返回值不抛**；回执须**逐字**带引擎文本——**读它，不要从"调用成功"推断检查通过** |
| **🔴 退出码非零 ≠ 覆盖了全部错误** | 结构检查覆盖面**有限**：某些类别（单段裸标识符、函数名）**从不检查**；表达式解析**只要求"某个前缀能解析"**、不要求消费到串尾 ⇒ **尾部可被静默丢弃**。⇒ **绿灯不等于整条规则被理解** |
| **配置损坏** | **响亮告警**（含路径与原因，同路径去重），并按**空配置**继续（apply 期抛错 = 整个宿主起不来，而单个 CCC 损坏只应影响该 CCC） |
| **输出/回执类失败** | 降级**不得吞回执**（例：图贴不进 ⇒ 落盘并给路径与原因） |
| **交付类动作的成功判据** | 必须依**可核验事实**（例：push 判据 = `--porcelain` 的 ref 行；超时/未确认**一律不声称成功**） |

---

## §11 标准演化

> 本节**只写流程与判据**；逐版本变更在 `CHANGELOG.md`（唯一家）。

### 11.1 版本与变更流程

1. **任何语义变更需三实现（osp/dsp/pi）对齐后**才能更新本标准；未对齐的写入须显式标注"待同步"及对象。
2. **Induction 装配内容（§5 各块全文）的变更必须显式记录**——它即规范本体，**改一个标点即改契约**。
3. **主版本号判据**：契约面**扩容**（工具/动作/键/块增删）**或**文档**结构性重写** ⇒ **主版本**。
4. **发版时穷举版本号出现处，不靠记忆**：本仓已数次发生"一处更新、另一处没更新"的同源漏改 ⇒ 改版本号 = 一次**机械检索**。

### 11.2 编号与指向纪律

- **章节号是外部引用面，不得重排**；新增内容走**子节**。
- **清单必须点名，禁止位置指代**：不得写"后 N 个按条件出现"——追加一项即把指代**改指**（已实测发生）。
- **易变值不写死**：一次性事实可入标准；会漂的当前值只能指针化。

### 11.3 ACC 通用性红线

- **ACC 内不出现任何具体 CCC 的名字**：机制在 ACC（通用）、**声明在 CCC**。凡"某容器要开某能力"，形态必须是**配置键**或**数据文件**，**不是**代码里的一份判断。
- 同理：**ACC 内本体方法文本不得出现任何具体 CCC 名**。
- 违反此红线 = 该 ACC 只能服务一个容器，**跨实现可移植性（I4/I5）随之失效**。

### 11.4 证据等级纪律（断言"实现如何行为"时）

| 等级 | 可采信度 | 说明 |
|---|---|---|
| **源码/配置真身**（实现仓 `src/**`、插件清单、配置 schema） | **最高** | 断言行为必须以此取证 |
| 实现仓 `CHANGELOG.md`（散文） | **低** | **凡与源码冲突以源码为准**；可找线索，不能当判据 |
| 本仓历史叙述 | — | **不得**作为证据（本仓不存"当前状态"，只存契约） |

- **否定性结论的可信度上限 = 扫描域**：写"某某不存在/没被接上"之前，先证明扫描域**覆盖**了它（有深度盲区的 glob 不能当"无遗漏"的证明）。

---

## 附录 A：osp/dsp 一致性核对矩阵

> **读法**：本表记**语义面是否对齐**（✅ 已对齐 / ⚠️ 待同步），**不记版本号与工具数**。

| 标准条款 | osp（opencode） | dsp（DSH，**领先实现**） | 核对 |
|---|---|---|---|
| §3 CCC 结构 | 基础 + mech-registry 旧位 | 同 + `.dsh/` 并存；注册表单级聚合；新增 `REBUILD-TODO.md` / `trajectory.json` / `cro-wake-log.log` / `.restrict-diag.json` | ⚠️ 待同步 |
| §3.0 结构件三线 | —— | SESSION.md（权威，7 段）/ REBUILD-TODO.md（非权威，10 KB）/ cro-wake-log.log（2 日窗） | ⚠️ 待同步 |
| §3.0.1 声明面 | —— | `trajectory.json` 收拢约束 + `uid` + `cro.host` + `resident`；认族不认名 | ⚠️ 待新增 |
| §3.1 配置 | `.opencode/serenity.json` | 同（`.dsh` 回退）；退役键静默忽略 | ⚠️ 待同步（键集） |
| §3.2 入口技能 | 标记内容 + skills | **三源**（+ `.dsh/entry-skill`） | ⚠️ 待同步 |
| §3.3 用量统计 | —— | `_tmp/acc-usage.json` | ⚠️ 待同步 |
| §4 工具 | 旧名族（待改名） | 常驻 + 条件可见；含 `ontology` / `serenity-skill-creator` / `diagram`；`cognitive_trajectory` 已更名 | ⚠️ 待改名对齐 |
| §4.1 轨迹工具 | `container_trajectory`（8 动作） | **`cognitive_trajectory`（10 动作**：+ `archive` / `uid`） | ⚠️ 待改名对齐 |
| §4.1 域外全局隐藏 | —— | 不在 CCC ⇒ 全工具面移除（两档尝试，档①失败不报警） | ⚠️ 待新增 |
| §4.1 git 契约 | 同源语义（spec 源） | 6 动作；commit 默认随后 push；push 判据 = `--porcelain` ref 行 | ✅（源头）/ ⚠️ 镜像行待收敛 |
| §4.2 条件可见 | 部分（im-bridge 复用） | `im-bridge` / `acc-diag` / `diagram`；`diagram` **缺省关且关时不注册** | ⚠️ 待同步 |
| §4.3 registry 保护 | 待同步 | 单级聚合 + 写 deny 读 allow + 健康检查段 | ⚠️ 待同步 |
| §4.5 CRO | **待新增** | 已落地：仅 spawn 不 import / 快照契约 / 决策契约 / 独立总闸 | ⚠️ 待新增 |
| §5.0 骨架 | 8 骨架块 + 渲染层（无 Persona / 无 Code Mode 行） | 固定位 9；EAP 位可被 **Persona** 替换；末尾可追加 **Code Mode 行** | ⚠️ 待同步 |
| §5.2 Metaphor | **无（待新增）** | 三层骨架 10 条星舰全文 | ⚠️ 待新增 |
| §5.5 EAP | **无（dsp 扩展）** | 独立块，全英 | ✅（dsp 扩展） |
| §5.5a Persona | **无（dsp 扩展）** | 条件替换块；未配置 ⇒ 逐字节一致 | ✅（dsp 扩展） |
| §5.8 Tools | **待新增独立块** | 常驻行 + MSM 协议 4 行；与实现**逐字**镜像 | ⚠️ 待新增 |
| §5.9a/5.9b 章程与四层 | **待新增** | `PROMPT.md` 热重载；**身份层不可覆盖**，约束块可被 `prompt.injection=replace` 显式替换（§5.9b 例外） | ⚠️ 待新增 |
| §5.10 注入时机 | system/messages/compacting | 会话启动 / 提示提交 / section（**全局 + scoped**）/ compact | ✅ |
| §5.11 assistant | 旧名 | token 单一真相源 + 两条体积提醒 + 便签交接 | ⚠️ 待同步 |
| §5.12 skill 供给 | **待新增** | 两条来源并集 + 名字安全 + 32 KB 守卫 | ⚠️ 待新增 |
| §6 拦截缝 | 6 缝 | 8 缝 + 输出守卫 + 子槽唯一声明者 | ✅（dsp 增强） |
| §7 激活 | 双阶段 + P1/P2/P3 | P1/P2/P3 | ✅ |
| §8 skill 格式 | 原生 `.opencode/skills` | opencode-skills provider + **serenity-skill 三档** | ⚠️ 待同步 |
| §10 错误类 | 13 类 | 13 类 + 失败方向表 + 退出码语义 | ✅（语义一致） |

**结论**：**dsp 是领先实现**——§5 各装配块文本与 §4.1 工具契约的**实证来源**即它（当前版本/工具数请查 `dashboard health` 与其 `CHANGELOG.md`，本表刻意不写）。osp 侧待按本 spec 同步（重点：§3 结构件与 `trajectory.json` 收拢 / §4 改名与域外隐藏 / §4.5 CRO / §5 各块 / §8 serenity-skill）。pi 按本标准实现即可三端对齐。

---

## 附录 B：工程实现标准（DSH Plugin 开发标准）

面向实现者的工程规范——在具体宿主上落地 ACC 时的插件开发标准（当前以 DSH 运行时为准绳）：

- 全文：`docs/plugin-development-standard.md`（A–G 七节：插件本体 / 包声明 / 工具定义 / 拦截缝 / 安装分发 / 构建 / 测试，各节带官方出处）

> 附录 A 定义**语义标准**（宿主无关），附录 B 定义**工程标准**（实现导向）——先对齐语义，再按工程规范落地。
>
> 🔴 **工具面变更必须同时改三处**（实测教训：曾出现"两侧同错 ⇒ 陈旧的双侧一致 = 静默通过"）：① 工具注册代码 ② 包级工具常量 ③ 插件清单的 `contributes.tools`。凡**声明面散文**含工具总数与名单的，须由**机械断言**钉住（而非靠纪律——纪律已被多次证伪）。

## 附录 C：ACC 层故事

- 全文：`docs/acc-story.md`

## 其他参考件

| 文件 | 内容 |
|---|---|
| [`docs/induction.md`](docs/induction.md) | **§5 成员装配全文**（逐字契约） |
| [`docs/plugin-development-standard.md`](docs/plugin-development-standard.md) | 附录 B 工程标准全文 |
| [`docs/acc-story.md`](docs/acc-story.md) | 附录 C 故事全文 |
| [`docs/injection-source-verification.md`](docs/injection-source-verification.md) | 注入来源取证方法 |
| [`docs/self-sustaining-trajectory-hypothesis.md`](docs/self-sustaining-trajectory-hypothesis.md) | 自维持轨迹假设（研究性，非约束） |
| `CHANGELOG.md` | 逐版本变更（**唯一历史家**） |
