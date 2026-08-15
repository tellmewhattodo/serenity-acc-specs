# Changelog

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
