# 注入内容来源对照（osp ↔ dsp 逐字核对记录）

> 目的：证明 §4 核心 loop 注入内容与两个已投产实现逐字一致。本文件记录核对过程与源码位置，供未来实现（pi-serenity 等）核对。

## 核对时间与方法

- 2026-08-09（S123）
- 方法：读取 osp 与 dsp 源码中的注入文本构造函数，逐块对比

## 源码位置

| 块 | osp（opencode-serenity-plugin） | dsp（dsh-serenity-plugin） |
|----|--------------------------------|---------------------------|
| ACC | `src/hooks/compacting.ts` L44-67（systemTransformImpl accBlock） | `hooks/dsh-serenity-hooks/src/seams/system-prompt.ts` L42-67（accBlock） |
| CCE | `src/hooks/compacting.ts` L70-122（cceBlock） | `seams/system-prompt.ts` L69-120（cceBlock） |
| Constraints | `src/hooks/compacting.ts` L127-139（block） | `seams/system-prompt.ts` L122-134（constraintsBlock） |
| SKILL 全文 | `src/hooks/compacting.ts` L142-145（state.skillContent） | `seams/system-prompt.ts` L136-143（entrySkillSectionText） |
| Session | `src/hooks/compacting.ts` L148-176（sessionMarker） | `seams/system-prompt.ts` L162-189（sessionBlock） |
| keeper 提醒 | `src/session/session-keeper.ts` L57-71（REMINDER_TEXT） | `seams/keeper.ts`（DCP 模式） |

## 逐块核对结论

### ACC 块（§4.1）
- **静态文本一致**：`You are running inside...to discover them.` 逐字相同
- **差异（允许）**：ACC 版本号（osp v0.8.5 / dsp v1.15.7）、CCC 名、Root、工具清单（osp 6 工具 / dsp 9 工具——均为各自真实工具）
- 判定：✅ 符合标准（§4.1 允许动态字段差异）

### CCE 块（§4.2）
- **逐字一致**：osp compacting.ts L70-122 与 dsp system-prompt.ts L69-120 全文完全相同（含空行、破折号、≤ ≥ 符号）
- 判定：✅ 完全一致（标准固定此全文）

### Constraints 块（§4.3）
- **静态文本一致**：4 条 bullet 逐字相同
- **差异（允许）**：Root 路径、msm 工具名（osp=msm_exec / dsp=acc_msm）
- 判定：✅ 符合标准

### SKILL 全文（§4.4）
- osp：注入 `state.skillContent`（入口 SKILL.md 全文，不截断）
- dsp：`entrySkillSectionText` 全文 + `sanitizeSkillContent` 过滤治理内容（safe-mode 提及）
- 判定：✅ 语义一致（dsp 增加治理过滤，属合理增强）

### Session 块（§4.5）
- **静态文本一致**：Rules/IMPORTANT/CRITICAL 逐字相同
- **差异（允许）**：活跃会话解析机制（osp=内存 Map，dsp=.dsh/active-session 标记文件）、会话 id/路径
- 判定：✅ 符合标准

### keeper 提醒（§4.7）
- **文本一致**：ACK 协议（recorded/skipped + 3 位码）与提醒措辞一致
- **差异（允许）**：默认阈值（osp 150 / dsp 100）、注入机制（osp messages.transform / dsp post-execute additionalContexts）
- 判定：✅ 符合标准

## 结论

两个实现的核心 loop 注入内容**逐字对齐**（CCE 完全一致；其余块仅动态字段差异）。§4 注入规范是两者的公共语义提取，可作为任何新 ACC 实现的权威注入内容基线。
