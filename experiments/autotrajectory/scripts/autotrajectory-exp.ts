#!/usr/bin/env bun
/**
 * autotrajectory-exp.ts — 自主轨迹实验管理 MSM（Mech，纯 TS 零 LLM 决策）——一站式
 *
 * 一个 tool 整合实验全部所需：
 *   acc_msm exec autotrajectory-exp            → 一站式全报告（背景 + 就绪 + 状态 + 下一步）
 *   acc_msm exec autotrajectory-exp init       → 初始化实验（写配置 + 生成偏见提供者脚本模板）
 *   acc_msm exec autotrajectory-exp random     → 运行偏见提供者脚本，输出当前偏见内容（验证）
 *   acc_msm exec autotrajectory-exp diag       → 唤起条件链诊断（--ccc <path> 指定；无参递归扫描 /home/yh 两层）
 *   acc_msm exec autotrajectory-exp doc        → 实验定义说明全文（SKILL.md）
 *   acc_msm exec autotrajectory-exp check      → 仅就绪度检查
 *   acc_msm exec autotrajectory-exp status     → 仅当前状态
 *   acc_msm exec autotrajectory-exp guide      → 仅步骤指引
 *
 * 概念（用户拍板命名）：偏见内容提供者（bias provider）——CCC 根目录下一个脚本，
 * stdout 输出本轮唤起要注入的偏见内容（反事实方向/探索动机等）。tool 直接运行它；
 * 脚本缺失 → 报错要求实现（不再经 mech-registry 注册 MSM）。
 *
 * 轨迹焦点（topPrompt，v1.26.17）：CCC 定义 autotrajectory 时自己填写本轨迹核心焦点，
 * 每次唤起最先注入（[轨迹焦点] 段）——稳定锚定防漂移，与偏见内容（每轮随机探索）互补。
 *
 * 状态查看：WebUI 设置面板「自主轨迹」区块（GET /serenity/autotrajectory）+「立即唤起」按钮
 * （POST /serenity/autotrajectory {action:'wake'}，调试语义跳过窗口/间隔）——由插件提供，脚本不重复。
 *
 * 零 DSH 依赖，任何 CCC 可运行。环境：SERENITY_ROOT（acc_msm exec 注入）或 cwd 上溯 .serenity。
 */

import { existsSync, readFileSync, statSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve, basename, dirname } from 'node:path'
import { spawnSync } from 'node:child_process'

const DEFAULT_BIAS_PROVIDER = 'autotrajectory-bias.ts'
const AUTO_SUFFIX = '--auto'
const MOTIVATION_MARKER = '下一轮动机'
const CONFIG_PATHS = ['.opencode/serenity.json', '.dsh/serenity.json']

/** 偏见内容提供者脚本脚手架模板（init 生成；CCC 按自己的反馈信息来源改写） */
const BIAS_TEMPLATE = `#!/usr/bin/env bun
/**
 * autotrajectory-bias.ts — 自主轨迹偏见内容提供者（CCC 实现）
 *
 * stdout 输出一行/一段文本 = 本轮唤起注入的偏见内容（反事实问题 / 探索方向 /
 * 任何让轨迹偏离既有路径的输入）。偏见内容归 CCC——用本 CCC 自己的反馈信息来源
 * 保证"足够随机"（历史会话 / 技能 / 文档 / 外部信息 / 真随机源……）。
 *
 * 本文件为脚手架——请按本 CCC 的信息来源改写。
 */
const sources = [
  'AGENT_SESSIONS 中的历史会话',
  '.opencode/skills 技能目录',
  'docs/ 设计文档',
  '…（CCC 自己的信息来源）',
]
const pick = sources[Math.floor(Math.random() * sources.length)]
console.log(\`反事实：如果「\${pick}」换个做法会怎样？\`)
`

/** 背景摘要（一站式的第一节——CCC agent 快速理解"为什么/验证什么"） */
const BACKGROUND = [
  '═══ 自主轨迹实验（Self-Sustaining Trajectory）═══',
  '背景：Trajectory 是主体（Agent 可替换、Session 载体可重建）。瓶颈 = 人类 waiting——',
  '      轨迹以"等待人类"为推进条件时，事件序列时间被人类响应间隔锚定，运转被拖慢。',
  '猜想：无人等待的 trajectory——时钟自动唤起 + 先验偏见（自生动机 + 偏见内容）→ 运转加速。',
  '验证：P4 可自动唤起并携带偏见 / P5 速度提升→更快产生满意效果；反证=熵增失控/自我确认/噪音化。',
  '理论：specs §0.7 记录器→校准器（预测加工）。完整定义：doc（SKILL.md）。',
  '',
].join('\n')

interface AutoConfig {
  enabled?: boolean
  intervalHours?: number
  biasProvider?: string
  /** 轨迹焦点（topPrompt，v1.26.17）：CCC 定义 autotrajectory 时自己填写——每次唤起最先注入（稳定锚防漂移） */
  topPrompt?: string
  session?: string
  avoidWakeHours?: { start?: number; end?: number }
}

// ── 基础设施 ──

function findRoot(): string | null {
  const fromEnv = process.env.SERENITY_ROOT
  if (fromEnv && existsSync(join(fromEnv, '.serenity'))) return fromEnv
  let cur = resolve(process.cwd())
  while (true) {
    if (existsSync(join(cur, '.serenity'))) return cur
    const parent = dirname(cur)
    if (parent === cur) return null
    cur = parent
  }
}

function readUtf8(p: string): string {
  return readFileSync(p, 'utf-8').replace(/^\uFEFF/, '')
}

function loadConfig(root: string): AutoConfig | null {
  for (const rel of CONFIG_PATHS) {
    const p = join(root, rel)
    if (!existsSync(p)) continue
    try {
      const cfg = JSON.parse(readUtf8(p)) as { autotrajectory?: AutoConfig }
      return cfg.autotrajectory ?? null
    } catch {
      return null
    }
  }
  return null
}

/** 偏见提供者脚本绝对路径（根内强制——逃逸拒绝） */
function biasProviderPath(root: string, providerRel: string): string {
  const rootAbs = resolve(root)
  const abs = resolve(root, providerRel)
  if (abs !== rootAbs && !abs.startsWith(rootAbs + '/')) {
    throw new Error(`biasProvider 路径逃逸（须在 CCC 根内）: ${providerRel}`)
  }
  return abs
}

/** 运行偏见提供者脚本（bun 优先，node 兜底），返回偏见内容或错误信息 */
function runBiasProvider(root: string, providerRel: string): { text: string | null; error: string | null } {
  let scriptAbs: string
  try {
    scriptAbs = biasProviderPath(root, providerRel)
  } catch (e) {
    return { text: null, error: String((e as Error).message) }
  }
  if (!existsSync(scriptAbs)) {
    return { text: null, error: `请在 CCC 根目录实现偏见内容提供者脚本: ${providerRel}（acc_msm exec autotrajectory-exp init 可生成模板）` }
  }
  for (const cmd of ['bun', process.execPath]) {
    try {
      const r = spawnSync(cmd, [scriptAbs], { encoding: 'utf-8', timeout: 600_000, stdio: ['ignore', 'pipe', 'pipe'] })
      if (r.status === 0) {
        const text = (r.stdout ?? '').trim()
        return { text: text || null, error: null }
      }
      if ((r.error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT') continue
      return { text: null, error: `偏见内容提供者脚本执行失败（exit ${r.status ?? '?'}）: ${r.stderr?.trim() || r.stdout?.trim() || ''}` }
    } catch {
      continue
    }
  }
  return { text: null, error: '偏见内容提供者脚本无法运行（bun 与 node 均不可用）' }
}

/** 目标 SESSION.md：**session 必填**（S###/目录名匹配）——自动唤起不默认任何会话（CCC 日常多轨迹并行）；未配置/未命中 → null */
function resolveTargetMd(root: string, cfg: AutoConfig): string | null {
  if (!cfg?.session) return null
  const sessionsDir = join(root, 'AGENT_SESSIONS')
  if (!existsSync(sessionsDir)) return null
  const dirs = readdirSync(sessionsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => join(sessionsDir, d.name))
  for (const d of dirs) {
    const md = join(d, 'SESSION.md')
    if (existsSync(md) && basename(d).includes(cfg.session)) return md
  }
  return null
}

function beijingHour(nowMs: number): number {
  return Math.floor(((nowMs + 8 * 3600_000) % 86400_000) / 3600_000)
}

function inAllowedWindow(nowMs: number, avoid?: { start?: number; end?: number }): boolean {
  const start = avoid?.start ?? 8
  const end = avoid?.end ?? 18
  const h = beijingHour(nowMs)
  if (start <= end) return h < start || h >= end
  return h >= end && h < start
}

// ── 子命令实现 ──

function doc(root: string): string {
  const p = join(dirname(process.argv[1] ?? ''), '..', 'SKILL.md')
  if (existsSync(p)) return readUtf8(p)
  return `SKILL.md 未找到（${p}）——实验定义见 serenity-acc-specs docs/self-sustaining-trajectory-hypothesis.md §7.1`
}

function check(root: string): string {
  const cfg = loadConfig(root)
  const lines: string[] = [`[autotrajectory-exp] 实验就绪度检查（CCC: ${basename(root)}）`, '']
  const fail: string[] = []

  if (!cfg) {
    lines.push('✗ 未配置 autotrajectory（.opencode/serenity.json 缺段）——acc_msm exec autotrajectory-exp init 一键初始化')
    fail.push('config')
  } else if (!cfg.enabled) {
    lines.push('✗ autotrajectory.enabled = false（未开启）')
    fail.push('enabled')
  } else {
    lines.push(`✓ enabled = true`)
    lines.push(`  intervalHours = ${cfg.intervalHours ?? 12}`)
    lines.push(`  biasProvider = ${cfg.biasProvider?.trim() || DEFAULT_BIAS_PROVIDER}`)
    if (cfg.topPrompt?.trim()) {
      lines.push(`✓ topPrompt（轨迹焦点）已定义: ${cfg.topPrompt.trim().slice(0, 60)}${cfg.topPrompt.trim().length > 60 ? '…' : ''}（每次唤起最先注入，锚定防漂移）`)
    } else {
      lines.push(`⚠ topPrompt（轨迹焦点）未定义——建议 CCC 定义 autotrajectory 时填写本轨迹核心焦点（实验观察：无焦点锚定，多轮唤起轨迹易漂移腐化）`)
    }
    if (cfg.session) lines.push(`  session = ${cfg.session}`)
    const avoid = cfg.avoidWakeHours
    lines.push(`  唤起窗口避开北京 ${avoid?.start ?? 8}~${avoid?.end ?? 18} 点（用量峰谷省钱）`)
  }

  const provider = cfg?.biasProvider?.trim() || DEFAULT_BIAS_PROVIDER
  if (cfg?.enabled) {
    const bias = runBiasProvider(root, provider)
    if (bias.error) {
      lines.push(`✗ 偏见内容提供者未就绪: ${bias.error}`)
      fail.push('biasProvider')
    } else {
      lines.push(`✓ 偏见内容提供者可运行（输出示例: ${bias.text ?? '（空输出）'}）`)
    }
  }

  const md = resolveTargetMd(root, cfg ?? {})
  if (!cfg?.session) {
    lines.push('✗ 未配置 session（必填——自动唤起不默认任何会话，CCC 日常多轨迹并行）')
    fail.push('session')
  } else if (md) {
    const flag = basename(dirname(md)).endsWith(AUTO_SUFFIX)
    lines.push(`${flag ? '✓' : '✗'} 目标会话目录${flag ? '带' : '未带'} --auto 标志：${basename(dirname(md))}`)
    if (!flag) {
      lines.push(`  → 目录名需以 --auto 结尾（AGENT_SESSIONS/<date>--<desc>--auto/）`)
      fail.push('autoFlag')
    }
    const content = readUtf8(md)
    if (content.includes(MOTIVATION_MARKER)) {
      lines.push(`✓ SESSION.md 含「下一轮动机」段（自生偏见）`)
    } else {
      lines.push(`· SESSION.md 无「下一轮动机」段（可选——纯偏见内容亦可）`)
    }
  } else {
    lines.push(`✗ 目标会话未命中：${cfg.session}（AGENT_SESSIONS 无匹配目录）`)
    fail.push('session')
  }

  lines.push('')
  lines.push(fail.length === 0 ? '✅ 实验就绪——等待时钟唤起（前台可见）' : `⚠️ 未就绪：${fail.join(', ')}`)
  return lines.join('\n')
}

function status(root: string): string {
  const cfg = loadConfig(root)
  const now = Date.now()
  const lines: string[] = [`[autotrajectory-exp] 实验状态（CCC: ${basename(root)}，北京 ${beijingHour(now)} 点）`, '']
  if (!cfg?.enabled) {
    lines.push('autotrajectory 未启用（enabled=false 或未配置）——零资源占用')
    return lines.join('\n')
  }
  lines.push(`配置: intervalHours=${cfg.intervalHours ?? 12} | biasProvider=${cfg.biasProvider?.trim() || DEFAULT_BIAS_PROVIDER}${cfg.session ? ` | session=${cfg.session}` : ''}${cfg.topPrompt?.trim() ? ' | topPrompt ✓' : ''}`)
  const md = resolveTargetMd(root, cfg)
  if (!md) {
    lines.push('目标会话：未找到')
    return lines.join('\n')
  }
  const mtime = statSync(md).mtimeMs
  const idleHours = (now - mtime) / 3600_000
  const interval = Math.max(1, cfg.intervalHours ?? 12)
  lines.push(`目标会话：${basename(dirname(md))}${basename(dirname(md)).endsWith(AUTO_SUFFIX) ? '（--auto ✓）' : '（无 --auto 标志）'}`)
  lines.push(`上次轨迹活动：${idleHours.toFixed(1)} 小时前（阈值 ${interval}h）`)
  lines.push(`唤起窗口：${inAllowedWindow(now, cfg.avoidWakeHours) ? '✅ 允许唤起' : '⏸ 高峰避开中（北京 8~18）'}`)
  const wakeable = inAllowedWindow(now, cfg.avoidWakeHours) && idleHours >= interval
  lines.push(`是否可唤起：${wakeable ? '✅ 是（等待下一个 10min tick）' : idleHours < interval ? `否——距上次活动不足 ${interval}h` : '否——高峰避开中'}`)
  return lines.join('\n')
}

function guide(): string {
  return [
    '[autotrajectory-exp] 实验步骤指引',
    '',
    '① 初始化（一键）：acc_msm exec autotrajectory-exp init',
    '   ——写配置（.opencode/serenity.json autotrajectory 段）+ 生成偏见提供者脚本模板（CCC 根 autotrajectory-bias.ts）',
    '② **定义轨迹焦点（topPrompt）**：编辑配置中的 topPrompt——**CCC 自己填写**本轨迹的核心',
    '   目标/纪律/质量要求（示例："持续深化某领域认知，产出可重建的结论与决策记录"）。',
    '   它会在每次唤起时最先注入（[轨迹焦点] 段），作为稳定焦点锚定 trajectory 防漂移——',
    '   **实验观察：无焦点锚定时多轮唤起轨迹腐化严重（焦点丢失）**。勿留空。',
    '③ 实现偏见内容提供者：编辑 autotrajectory-bias.ts，stdout 输出偏见内容（反事实方向/探索动机，',
    '   用本 CCC 自己的信息来源保证"足够随机"）；acc_msm exec autotrajectory-exp random 验证',
    '④ 标记目标会话：目录名加 --auto 后缀 AGENT_SESSIONS/<date>--<desc>--auto/',
    '   （可选）该 SESSION.md 写「下一轮动机」段作自生偏见',
    '⑤ 验证就绪：acc_msm exec autotrajectory-exp（一站式报告应为 ✅；topPrompt 未定义会 ⚠ 提示）',
    '⑥ 观察：无人类活动满 intervalHours 且北京非高峰 → 前台会话自动出现 [自主轨迹唤起]',
    '   产出落 SESSION.md「自主探索日志」+ 预写「下一轮动机」',
    '',
    '分工：焦点（topPrompt）= 稳定锚，每轮不变；偏见（biasProvider）= 随机探索方向，每轮不同——两者都由 CCC 定义。',
    '完整定义见 SKILL.md（acc_msm exec autotrajectory-exp doc）',
  ].join('\n')
}

/** 初始化：合并写配置（不覆盖其他段）+ 生成偏见提供者脚本模板（已存在则跳过） */
function init(root: string): string {
  const out: string[] = ['[autotrajectory-exp] 初始化实验', '']

  // ① 写配置
  let cfgPath = join(root, CONFIG_PATHS[0]!)
  if (!existsSync(cfgPath)) {
    const alt = join(root, CONFIG_PATHS[1]!)
    cfgPath = existsSync(alt) ? alt : cfgPath
  }
  mkdirSync(dirname(cfgPath), { recursive: true })
  let merged: Record<string, unknown> = {}
  if (existsSync(cfgPath)) {
    try {
      merged = JSON.parse(readUtf8(cfgPath)) as Record<string, unknown>
    } catch {
      /* 损坏则重建 */
    }
  }
  const at = (merged.autotrajectory as Record<string, unknown> | undefined) ?? {}
  merged.autotrajectory = {
    enabled: true,
    intervalHours: 12,
    biasProvider: DEFAULT_BIAS_PROVIDER,
    // 轨迹焦点（topPrompt）：**CCC 自己定义**本轨迹的核心目标/纪律/质量要求——每次唤起最先
    // 注入，作为稳定焦点锚定 trajectory，防止多轮自主唤起中焦点丢失（腐化）。请按本 CCC
    // 的轨迹目标改写，不要留空（留空 = 唤起无焦点锚定，轨迹易漂移）。
    topPrompt: '本轨迹的核心焦点：<CCC 填写——例如：持续深化某领域认知，产出可重建的结论与决策记录>',
    ...at,
  }
  writeFileSync(cfgPath, `${JSON.stringify(merged, null, 2)}\n`)
  out.push(`✓ 配置写入: ${cfgPath}`)
  out.push(`  autotrajectory = ${JSON.stringify(merged.autotrajectory)}`)
  out.push(`  ⚠ 请编辑 topPrompt 为**本 CCC 的轨迹焦点**（现为占位——每次唤起最先注入，防轨迹漂移，勿留空）`)

  // ② 生成偏见提供者脚本模板
  const scriptAbs = biasProviderPath(root, DEFAULT_BIAS_PROVIDER)
  if (existsSync(scriptAbs)) {
    out.push(`· 偏见提供者脚本已存在（保留）: ${DEFAULT_BIAS_PROVIDER}`)
  } else {
    writeFileSync(scriptAbs, BIAS_TEMPLATE)
    out.push(`✓ 已生成偏见提供者脚本模板: ${DEFAULT_BIAS_PROVIDER}（编辑它，stdout 输出偏见内容）`)
  }

  out.push('', '下一步：② 编辑配置 topPrompt（轨迹焦点——CCC 自己填写本轨迹核心目标，勿留空）→ ③ 标记目标会话 --auto 后缀 → ⑤ acc_msm exec autotrajectory-exp 验证就绪')
  return out.join('\n')
}

/** random：运行偏见提供者脚本，输出当前偏见内容（验证） */
function random(root: string): string {
  const cfg = loadConfig(root)
  const provider = cfg?.biasProvider?.trim() || DEFAULT_BIAS_PROVIDER
  const bias = runBiasProvider(root, provider)
  if (bias.error) return `[autotrajectory-exp] ✗ ${bias.error}`
  return `[autotrajectory-exp] 当前偏见内容（${provider}）:\n${bias.text ?? '（空输出）'}`
}

/** 一站式全报告：背景 + 就绪检查 + 状态 + 下一步 + 指引（CCC agent 看一次即懂并知道下一步） */
function all(root: string): string {
  const cfg = loadConfig(root)
  const ready = check(root)
  const stat = status(root)
  const next: string[] = ['═══ 下一步 ═══']
  if (!cfg) {
    next.push('→ 本 CCC 尚未配置 autotrajectory。开始实验：acc_msm exec autotrajectory-exp init 一键初始化。')
  } else if (!cfg.enabled) {
    next.push('→ autotrajectory.enabled 为 false——置 true 开启实验（或 init 重新初始化）。')
  } else if (ready.includes('✗')) {
    next.push('→ 存在未就绪项（见上）。补齐后重跑本命令确认 ✅。')
  } else {
    next.push('→ 已就绪 ✅。保持会话空闲满 intervalHours 且北京非高峰 → 自动唤起（前台可见）。')
    next.push('→ 之后可随时 acc_msm exec autotrajectory-exp status 查看距下次唤起的进度。')
  }
  return [BACKGROUND, ready, '', stat, '', next.join('\n'), '', guide()].join('\n')
}

/** 唤起条件链诊断（单 CCC）——逐条件当前值 + 阻断点 + 修复建议 */
function diagCcc(root: string): string {
  const now = Date.now()
  const lines: string[] = [`═══ 自主轨迹唤起诊断：${basename(root)}（${root}）═══`]
  const cfg = loadConfig(root)
  const blocks: string[] = []
  const suggest: string[] = []

  // ① enabled（定时器是否启动）
  if (!cfg) {
    blocks.push('✗ autotrajectory 未配置（定时器不启动）')
    suggest.push('配置：.opencode/serenity.json 加 autotrajectory 段（autotrajectory-exp init 可生成）')
  } else if (!cfg.enabled) {
    blocks.push('✗ enabled = false（定时器不启动）')
    suggest.push('置 enabled: true')
  } else {
    blocks.push('✓ enabled = true')
  }
  if (cfg) {
    blocks.push(`  配置: intervalHours=${cfg.intervalHours ?? 12} | biasProvider=${cfg.biasProvider?.trim() || DEFAULT_BIAS_PROVIDER}${cfg.session ? ` | session=${cfg.session}` : ' | session=未配置'}`)
    const avoid = cfg.avoidWakeHours
    blocks.push(`  窗口避开北京 ${avoid?.start ?? 8}~${avoid?.end ?? 18} 点`)
  }

  // ② session（必填——不默认任何会话）
  const md = resolveTargetMd(root, cfg ?? {})
  if (!cfg?.session) {
    blocks.push('✗ session 未配置（必填——自动唤起不默认任何会话）')
    suggest.push('配置 session: "S###"（目标会话 S###/目录名）')
  } else if (!md) {
    blocks.push(`✗ session=${cfg.session} 未命中（AGENT_SESSIONS 无匹配目录）`)
    suggest.push('确认目标会话存在（目录名含该关键字）')
  } else {
    blocks.push(`✓ session=${cfg.session} 命中（${basename(dirname(md))}）`)
  }

  // ③ --auto 会话标志
  if (md) {
    const flag = basename(dirname(md)).endsWith(AUTO_SUFFIX)
    if (flag) {
      blocks.push('✓ 会话目录带 --auto 标志')
    } else {
      blocks.push(`✗ 会话目录无 --auto 标志（${basename(dirname(md))}）`)
      suggest.push('目录名加 --auto 后缀：AGENT_SESSIONS/<date>--<desc>--auto/')
    }
  }

  // ④ mtime 间隔（无人类活动时长）
  if (md) {
    const mtime = statSync(md).mtimeMs
    const idle = (now - mtime) / 3600_000
    const interval = Math.max(1, cfg?.intervalHours ?? 12)
    if (idle >= interval) blocks.push(`✓ 距上次轨迹活动 ${idle.toFixed(1)}h ≥ 阈值 ${interval}h`)
    else blocks.push(`⏸ 距上次轨迹活动 ${idle.toFixed(1)}h < 阈值 ${interval}h（等待中——不满足不唤起）`)
  }

  // ⑤ 北京时间唤起窗口
  const h = beijingHour(now)
  const inWin = inAllowedWindow(now, cfg?.avoidWakeHours)
  blocks.push(`${inWin ? '✓' : '⏸'} 当前北京 ${h} 点——${inWin ? '在唤起窗口内' : '高峰避开中（缺省 8~18，用量峰谷省钱）'}`)

  // ⑥ 偏见内容提供者脚本
  if (cfg?.enabled) {
    const provider = cfg.biasProvider?.trim() || DEFAULT_BIAS_PROVIDER
    const bias = runBiasProvider(root, provider)
    if (bias.error) {
      blocks.push(`✗ 偏见脚本: ${bias.error}`)
      suggest.push('实现偏见脚本（autotrajectory-exp init 生成模板后编辑）')
    } else {
      blocks.push(`✓ 偏见脚本可运行（输出: ${bias.text ?? '（空）'}）`)
    }
  }

  lines.push(...blocks.map((b) => `  ${b}`))
  lines.push('')
  const bad = blocks.filter((b) => b.startsWith('✗'))
  if (bad.length === 0) {
    lines.push('✅ 唤起条件全部满足——等待下一个 10min tick 自动唤起（前台可见）')
  } else {
    lines.push(`⚠️ 阻断点 ${bad.length} 项（全部满足才唤起）：`)
    for (const s of suggest) lines.push(`  → ${s}`)
  }
  return lines.join('\n')
}

/** diag：--ccc <path> 指定目标 CCC；无参扫描常见 CCC 根（配置了 autotrajectory 的优先） */
function diag(): string {
  const argIdx = process.argv.indexOf('--ccc')
  if (argIdx >= 0 && process.argv[argIdx + 1]) {
    return diagCcc(resolve(process.argv[argIdx + 1]!))
  }
  const roots = new Set<string>()
  const envRoot = process.env.SERENITY_ROOT
  if (envRoot && existsSync(join(envRoot, '.serenity'))) roots.add(envRoot)
  // 递归扫描 /home/yh 两层（覆盖 /home/yh/home/*、/home/yh/our-home/* 及任意实验 CCC 位置）
  for (const base of ['/home/yh']) {
    collectCccs(base, 0, roots, 2)
  }
  const list = [...roots]
  if (list.length === 0) return '[autotrajectory-exp diag] 未发现 CCC（用 --ccc <path> 指定目标）'
  const ordered = [...list.filter((r) => loadConfig(r)?.enabled), ...list.filter((r) => !loadConfig(r)?.enabled)]
  return ordered.map(diagCcc).join('\n\n')
}

/** 递归收集 .serenity 标记目录（跳过隐藏目录；maxDepth 层内） */
function collectCccs(dir: string, depth: number, out: Set<string>, maxDepth: number): void {
  if (depth > maxDepth || !existsSync(dir)) return
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    if (!d.isDirectory() || d.name.startsWith('.')) continue
    const r = join(dir, d.name)
    if (existsSync(join(r, '.serenity'))) out.add(r)
    collectCccs(r, depth + 1, out, maxDepth)
  }
}

function main(): void {
  const cmd = process.argv[2] ?? 'all'
  const root = findRoot()
  if (!root) {
    console.error('[autotrajectory-exp] ✗ 未找到 CCC 根（无 .serenity；acc_msm exec 会自动注入 SERENITY_ROOT）')
    process.exit(1)
  }
  switch (cmd) {
    case 'all':
      console.log(all(root))
      break
    case 'init':
      console.log(init(root))
      break
    case 'random':
      console.log(random(root))
      break
    case 'diag':
      console.log(diag())
      break
    case 'doc':
      console.log(doc(root))
      break
    case 'check':
      console.log(check(root))
      break
    case 'status':
      console.log(status(root))
      break
    case 'guide':
      console.log(guide())
      break
    default:
      console.error(`[autotrajectory-exp] 未知子命令: ${cmd}（可用: 无参一站式 / init / random / diag / doc / check / status / guide）`)
      process.exit(2)
  }
}

if (import.meta.main) {
  main()
}
