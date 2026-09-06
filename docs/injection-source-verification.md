# 注入内容来源对照（osp ↔ dsp 逐字核对记录）

> **⚠️ v1.4.0 过时注记（2026-09-06）**：本文件为 2026-08-09（S123）的历史核对快照——当时注入 5 块、dsp v1.15.7。v1.4.0 起注入已演进为 **9 块**（ACC/Metaphor/Principles/CCE/EAP/状态/SKILL/Tools/Session）+ 星舰 Metaphor + trajectory-assistant token，dsp 领先 v1.30.1。**需要按 specs README §5 全文重核**（osp 侧同步后执行）。下方历史记录保留为方法参考。

> 目的：证明 §5 核心 loop 注入内容与两个已投产实现逐字一致。本文件记录核对过程与源码位置，供未来实现（pi-serenity 等）核对。

## 核对时间与方法

- 2026-08-09（S123）
- 方法：读取 osp 与 dsp 源码中的注入文本构造函数，逐块对比

## 源码位置（v1.4.0 现状：dsp 权威源行号随版本演进，此处为核对时快照）

| 块 | osp（opencode-serenity-plugin） | dsp（dsh-serenity-plugin） |
|----|--------------------------------|---------------------------|
| ACC | `src/hooks/compacting.ts`（identityBlock） | `hooks/dsh-serenity-hooks/src/seams/system-prompt.ts`（identityBlock） |
| Metaphor | 无（待新增） | `system-prompt.ts` metaphorBlock（星舰，v1.29） |
| Principles | compacting.ts（constraintsBlock） | `system-prompt.ts` principlesBlock |
| CCE | compacting.ts（cceBlock） | `system-prompt.ts` cceBlock |
| EAP | 无（dsp 扩展） | `system-prompt.ts` eapBlock |
| 状态块 | safe-mode | `system-prompt.ts` safeModeBlock / localstoreBlock |
| SKILL 全文 | compacting.ts（state.skillContent） | `system-prompt.ts` entrySkillSectionText |
| Tools | 无（待新增） | `system-prompt.ts` toolsBlock |
| Session | compacting.ts（sessionMarker） | `system-prompt.ts` sessionBlock |
| assistant 提醒 | session-keeper.ts（REMINDER_TEXT） | `seams/trajectory-assistant.ts` + keeper.ts（DCP 模式） |

## 逐块核对结论（2026-08-09 历史快照——§5.1-5.5 结论已被 v1.4 取代，保留仅作方法参考）

### ACC 块（§5.1）
- **静态文本一致**：`You are running inside...to discover them.` 逐字相同（v1.23 全英化后文本已更新为 toolsBlock 指引）
- **差异（允许）**：ACC 版本号（osp v0.8.5 / dsp v1.30.1）、CCC 名、Root、平台工具行
- 判定：✅ 符合标准（允许动态字段差异）

### CCE 块（§5.4）
- **逐字一致**：osp compacting.ts 与 dsp system-prompt.ts cceBlock 全文完全相同（含空行、破折号、≤ ≥ 符号）
- 判定：✅ 完全一致（标准固定此全文）

### Principles 块（§5.3）
- **静态文本一致**：本体论 + session-trajectory 关系 + MSM 原则 + 边界
- **差异（允许）**：Root 路径、MSM 工具名（v1.4 起统一 `msm`）
- 判定：✅ 符合标准

### SKILL 全文（§5.7）
- osp：注入 `state.skillContent`（入口 SKILL.md 全文，不截断）
- dsp：`entrySkillSectionText` 全文 + `sanitizeSkillContent` 过滤治理内容（safe-mode 提及）
- 判定：✅ 语义一致（dsp 增加治理过滤，属合理增强）

### Session 块（§5.9）
- **静态文本一致**：Rules/IMPORTANT/CRITICAL 逐字相同（v1.4 去 priority）
- **差异（允许）**：活跃会话解析机制（osp=内存 Map，dsp=serenity/bound 会话事件 + 标题恢复链）、会话 id/路径
- 判定：✅ 符合标准

### trajectory-assistant 提醒（§5.11）
- **文本一致**：ACK 协议（recorded/skipped + 3 位码）与提醒措辞一致（v1.29 token 体系：CHECKPOINT/LIMIT/REBUILD/BOUNDARY GUARD）
- **差异（允许）**：默认阈值（osp 150 / dsp 100）、注入机制（osp messages.transform / dsp post-execute additionalContexts）
- 判定：✅ 符合标准

## 结论

v1.4.0 起**注入内容以 dsp v1.30.1 为权威实现**（specs README §5 全文 = 标准基线）。两实现核心 loop 注入文本**语义一致**（CCE 完全一致；其余块仅动态字段差异）。§5 注入规范是公共语义提取，可作为任何新 ACC 实现的权威注入内容基线——**osp 侧按 v1.4.0 同步后需更新本核对文件**。
