import { drivesOn, isAbsolute, posix } from './tree'

export type GitAction = {
  kind: string
  verb: string
  running: string
  done: string
  tone: string
  icon: { nerd: string; plain: string }
  init?: boolean
}

const ICON = {
  commit: { nerd: '\u{f417}', plain: '●' },
  push: { nerd: '\u{f0552}', plain: '↑' },
  pull: { nerd: '\u{f0553}', plain: '↓' },
  branch: { nerd: '\u{f418}', plain: '⑂' },
  merge: { nerd: '\u{f419}', plain: '⑃' },
  pr: { nerd: '\u{f407}', plain: '⇄' },
  github: { nerd: '\u{f408}', plain: '◎' },
  stash: { nerd: '\u{f01bc}', plain: '≡' },
  undo: { nerd: '\u{f054c}', plain: '↶' },
  tag: { nerd: '\u{f412}', plain: '⌖' },
  git: { nerd: '\u{e702}', plain: '±' },
}

// Shimmer ramps, base to peak; every stop ≥4.5:1 on the host background and the hover row.
// `dim` is the collapsed-ancestor ramp. Light ramps darken toward the peak instead of brightening.
type Tone = { bright: string[]; dim: string[]; solid: string }
export const TONES: Record<string, Tone> = {
  orange: { bright: ['#f97c25', '#fb923c', '#fdba74', '#ffedd5'], dim: ['#cf9268', '#d6a37f', '#deb496', '#e5c4ae'], solid: '#f97920' },
  green: { bright: ['#22c55e', '#4ade80', '#86efac', '#dcfce7'], dim: ['#4eb173', '#63ba84', '#78c495', '#8ecda5'], solid: '#4ade80' },
  teal: { bright: ['#14b8a6', '#2dd4bf', '#5eead4', '#ccfbf1'], dim: ['#45b0a5', '#57bdb2', '#6dc6bc', '#83cec6'], solid: '#2dd4bf' },
  blue: { bright: ['#69a0f8', '#7fb3fb', '#93c5fd', '#dbeafe'], dim: ['#81a0d5', '#98b1dd', '#afc3e4', '#c6d4ec'], solid: '#60a5fa' },
  purple: { bright: ['#c186f9', '#cc9cfc', '#d8b4fe', '#f3e8ff'], dim: ['#b690da', '#c5a7e2', '#d4bee9', '#e3d5f1'], solid: '#c084fc' },
  cyan: { bright: ['#06b6d4', '#22d3ee', '#67e8f9', '#cffafe'], dim: ['#3dadbf', '#53b8c8', '#6ac1cf', '#81cbd7'], solid: '#22d3ee' },
  red: { bright: ['#f47a7a', '#f88f8f', '#fca5a5', '#fee2e2'], dim: ['#d58b8b', '#dda1a1', '#e5b8b8', '#edcece'], solid: '#f87575' },
}

export const LIGHT_TONES: Record<string, Tone> = {
  orange: { bright: ['#ac4904', '#8e3c03', '#703003', '#522302'], dim: ['#915a34', '#7e4e2d', '#6b4327', '#593720'], solid: '#ac4904' },
  green: { bright: ['#157538', '#105b2c', '#0c411f', '#072713'], dim: ['#37724d', '#2f6141', '#265036', '#1e3e2a'], solid: '#157538' },
  teal: { bright: ['#0c7368', '#09574f', '#063c36', '#03201d'], dim: ['#30716a', '#285f59', '#214d48', '#193b38'], solid: '#0c7368' },
  blue: { bright: ['#0a5de3', '#0951c6', '#0745a8', '#06398b'], dim: ['#3e67a7', '#375c94', '#305082', '#29456f'], solid: '#0a5de3' },
  purple: { bright: ['#820bf4', '#720ad7', '#6308b9', '#53079c'], dim: ['#8145ba', '#743ea7', '#673795', '#5a3082'], solid: '#820bf4' },
  cyan: { bright: ['#047183', '#035765', '#023e48', '#01242a'], dim: ['#2c707c', '#255f69', '#1f4e56', '#183d44'], solid: '#047183' },
  red: { bright: ['#cc1111', '#b00f0f', '#940c0c', '#770a0a'], dim: ['#aa4646', '#983f3f', '#863737', '#743030'], solid: '#cc1111' },
}

const GIT_VERBS: Record<string, Omit<GitAction, 'kind'>> = {
  commit: { verb: 'commit', running: 'committing', done: 'committed', tone: 'green', icon: ICON.commit },
  push: { verb: 'push', running: 'pushing', done: 'pushed', tone: 'teal', icon: ICON.push },
  pull: { verb: 'pull', running: 'pulling', done: 'pulled', tone: 'blue', icon: ICON.pull },
  fetch: { verb: 'fetch', running: 'fetching', done: 'fetched', tone: 'blue', icon: ICON.pull },
  checkout: { verb: 'checkout', running: 'checking out', done: 'checked out', tone: 'blue', icon: ICON.branch },
  switch: { verb: 'switch', running: 'switching', done: 'switched', tone: 'blue', icon: ICON.branch },
  branch: { verb: 'branch', running: 'branching', done: 'branched', tone: 'blue', icon: ICON.branch },
  merge: { verb: 'merge', running: 'merging', done: 'merged', tone: 'purple', icon: ICON.merge },
  rebase: { verb: 'rebase', running: 'rebasing', done: 'rebased', tone: 'purple', icon: ICON.merge },
  'cherry-pick': { verb: 'cherry-pick', running: 'cherry-picking', done: 'cherry-picked', tone: 'purple', icon: ICON.merge },
  stash: { verb: 'stash', running: 'stashing', done: 'stashed', tone: 'orange', icon: ICON.stash },
  reset: { verb: 'reset', running: 'resetting', done: 'reset', tone: 'red', icon: ICON.undo },
  restore: { verb: 'restore', running: 'restoring', done: 'restored', tone: 'red', icon: ICON.undo },
  revert: { verb: 'revert', running: 'reverting', done: 'reverted', tone: 'red', icon: ICON.undo },
  add: { verb: 'add', running: 'staging', done: 'staged', tone: 'green', icon: ICON.git },
  rm: { verb: 'rm', running: 'removing', done: 'removed', tone: 'red', icon: ICON.git },
  mv: { verb: 'mv', running: 'moving', done: 'moved', tone: 'orange', icon: ICON.git },
  tag: { verb: 'tag', running: 'tagging', done: 'tagged', tone: 'purple', icon: ICON.tag },
  init: { verb: 'init', running: 'initialising', done: 'initialised', tone: 'green', icon: ICON.git, init: true },
  clone: { verb: 'clone', running: 'cloning', done: 'cloned', tone: 'blue', icon: ICON.pull, init: true },
}

const GH_VERBS: Record<string, Omit<GitAction, 'kind'>> = {
  'pr create': { verb: 'pr create', running: 'opening PR', done: 'opened PR', tone: 'purple', icon: ICON.pr },
  'pr merge': { verb: 'pr merge', running: 'merging PR', done: 'merged PR', tone: 'purple', icon: ICON.merge },
  'pr checkout': { verb: 'pr checkout', running: 'checking out PR', done: 'checked out PR', tone: 'blue', icon: ICON.pr },
  'pr comment': { verb: 'pr comment', running: 'commenting on PR', done: 'commented on PR', tone: 'purple', icon: ICON.pr },
  'pr review': { verb: 'pr review', running: 'reviewing PR', done: 'reviewed PR', tone: 'purple', icon: ICON.pr },
  'repo clone': { verb: 'repo clone', running: 'cloning', done: 'cloned', tone: 'blue', icon: ICON.github, init: true },
  'release create': { verb: 'release create', running: 'releasing', done: 'released', tone: 'purple', icon: ICON.tag },
  'issue create': { verb: 'issue create', running: 'opening issue', done: 'opened issue', tone: 'purple', icon: ICON.github },
}

const READ_ONLY_GIT = new Set(['status', 'log', 'diff', 'show', 'blame', 'rev-parse', 'ls-files', 'grep', 'describe', 'config', 'remote', 'reflog', 'shortlog', 'help', 'version', 'check-ignore'])

function segments(command: string, seps: string[] = []): string[][] {
  const out: string[][] = []
  let cur: string[] = []
  let tok = ''
  let quote = ''
  let has = false
  const endTok = () => {
    if (has) cur.push(tok)
    tok = ''
    has = false
  }
  const endSeg = () => {
    endTok()
    if (cur.length) out.push(cur)
    cur = []
  }
  for (let i = 0; i < command.length; i++) {
    const ch = command[i] ?? ''
    if (quote) {
      if (ch === quote) quote = ''
      else if (ch === '\\' && quote === '"' && i + 1 < command.length) tok += command[++i]
      else tok += ch
    } else if (ch === '"' || ch === "'") {
      quote = ch
      has = true
    } else if (ch === '\\' && i + 1 < command.length) {
      tok += command[++i]
      has = true
    } else if (ch === '#' && !has) {
      while (i + 1 < command.length && command[i + 1] !== '\n') i++
    } else if (ch === ' ' || ch === '\t') endTok()
    else if (ch === '\n' || ch === ';') {
      seps.push(';')
      endSeg()
    } else if (ch === '&' && (command[i - 1] === '>' || command[i + 1] === '>')) {
      tok += ch
      has = true
    } else if (ch === '&' || ch === '|') {
      const twice = command[i + 1] === ch
      if (twice) i++
      seps.push(twice ? ch + ch : ch)
      endSeg()
    } else {
      tok += ch
      has = true
    }
  }
  endSeg()
  if (!quote) return out
  seps.push(';')
  return command
    .split(/&&|\|\||;|\||\n/)
    .map(s => s.trim().split(/\s+/).filter(Boolean))
    .filter(s => s.length > 0)
}

function stripGlobals(tokens: string[]): string[] {
  const out = [...tokens]
  if (out[0] === 'env') out.shift()
  while (out.length && /^[A-Z_][A-Z0-9_]*=/.test(out[0] ?? '')) out.shift()
  return out
}

function gitVerb(tokens: string[]): number {
  let i = 1
  while (i < tokens.length && (tokens[i] ?? '').startsWith('-')) {
    if (tokens[i] === '-C' || tokens[i] === '-c') i++
    i++
  }
  return i
}

function gitReadOnly(verb: string, rest: string[]): boolean {
  if (!verb || READ_ONLY_GIT.has(verb)) return true
  if (verb === 'stash') return ['list', 'show'].includes(rest[0] ?? '')
  if (verb === 'branch') return rest.every(t => t.startsWith('-'))
  if (verb === 'tag') return rest.length === 0 || rest.some(t => /^(-l|--list|-n\d*|--contains|--points-at|--merged|--no-merged|-v|--verify)$/.test(t))
  return false
}

export function chainOf(command: string): { size: number; and: boolean } {
  const seps: string[] = []
  const size = segments(command, seps).length
  return { size, and: seps.every(s => s === '&&') }
}

export function gitActions(command: string): GitAction[] {
  const out: GitAction[] = []
  for (const raw of segments(command)) {
    const tokens = stripGlobals(raw)
    const head = tokens[0]?.split('/').pop()
    if (head === 'git') {
      const i = gitVerb(tokens)
      const verb = tokens[i] ?? ''
      const rest = tokens.slice(i + 1)
      if (gitReadOnly(verb, rest)) continue
      const spec = verb === 'checkout' && rest.includes('--') ? GIT_VERBS.restore : GIT_VERBS[verb]
      if (spec) out.push({ kind: `git ${verb}`, ...spec })
    } else if (head === 'gh') {
      const pair = `${tokens[1] ?? ''} ${tokens[2] ?? ''}`
      const spec = GH_VERBS[pair]
      if (spec) out.push({ kind: `gh ${pair}`, ...spec })
    }
  }
  return out
}

export const BRANCH_ICON = ICON.branch

const READERS = new Set(['rg', 'grep', 'egrep', 'fgrep', 'find', 'fd', 'fdfind', 'cat', 'head', 'tail', 'bat', 'less', 'more', 'ls', 'eza', 'tree', 'wc', 'sed', 'awk', 'jq'])
const PATTERN_FIRST = new Set(['rg', 'grep', 'egrep', 'fgrep', 'sed', 'awk', 'jq'])
const OUTPUT_PATHS = new Set(['rg', 'grep', 'egrep', 'fgrep', 'find', 'fd', 'fdfind'])

function tidy(path: string): string {
  const s = path.replace(/\/+$/, '')
  return s === '' ? '/' : /^[A-Za-z]:$/.test(s) && isAbsolute(`${s}/`) ? `${s}/` : s
}

export function resolve(cwd: string, p: string, home = ''): string {
  let path = posix(p)
  if (home && (path === '~' || path.startsWith('~/'))) path = home + path.slice(1)
  const drive = isAbsolute(path) && !path.startsWith('/') ? path.slice(0, 2) : ''
  const parts = isAbsolute(path) ? [drive] : posix(cwd).replace(/\/+$/, '').split('/')
  for (const seg of path.slice(drive.length).split('/')) {
    if (!seg || seg === '.') continue
    if (seg === '..') {
      if (parts.length > 1) parts.pop()
    } else parts.push(seg)
  }
  return tidy(parts.join('/'))
}

const WRITE_FLAGS = /^-(delete|exec|execdir|ok|okdir|fprint\w*|fls|x|X|-exec|-exec-batch)$/

export function readOnly(command: string): boolean {
  const bare = ` ${command}`.replace(/\d*>&\d/g, ' ').replace(/(\d*|&)>>?\s*\/dev\/null/g, ' ')
  if (/[^>]>[^>&]|>>/.test(bare)) return false
  return segments(command).every(raw => {
    const tokens = stripGlobals(raw)
    const head = tokens[0]?.split('/').pop() ?? ''
    if (head === 'cd' || head === 'echo' || head === 'printf' || head === 'true' || head === 'pwd') return true
    if (head === 'git') {
      const i = gitVerb(tokens)
      return gitReadOnly(tokens[i] ?? '', tokens.slice(i + 1))
    }
    if (head === 'sed') return !tokens.some(t => /^-i/.test(t))
    if (head === 'find' || head === 'fd' || head === 'fdfind') return !tokens.some(t => WRITE_FLAGS.test(t))
    return READERS.has(head)
  })
}

export function readTargets(command: string, sessionCwd: string, stdout: string, home = ''): string[] {
  let cwd = sessionCwd
  const out = new Set<string>()
  let listsPaths = false
  for (const raw of segments(command)) {
    const tokens = stripGlobals(raw).map(t => posix(t.replace(/^["']|["']$/g, '')))
    const head = tokens[0]?.split('/').pop() ?? ''
    if (head === 'cd' && tokens[1]) {
      cwd = resolve(cwd, tokens[1], home)
      continue
    }
    if (!READERS.has(head)) continue
    if (head === 'sed' && tokens.some(t => /^-i/.test(t))) continue
    if (OUTPUT_PATHS.has(head)) listsPaths = true
    const args = tokens.slice(1)
    let skipPattern = PATTERN_FIRST.has(head) && !args.some(t => t === '-e' || t === '-f' || t === '--files')
    for (let i = 0; i < args.length; i++) {
      const a = args[i] ?? ''
      if (a.startsWith('-')) {
        if (/^-(e|f|g|t|T|m|A|B|C|-glob|-type|-max-count|name|iname|maxdepth|mindepth)$/.test(a)) i++
        continue
      }
      if (skipPattern) {
        skipPattern = false
        continue
      }
      if (/[*?<>|]/.test(a)) continue
      out.add(resolve(cwd, a, home))
    }
  }
  if (listsPaths) {
    for (const line of stdout.split('\n').slice(0, 400)) {
      const path = posix(line).match(drivesOn() ? /^((?:[A-Za-z]:)?[^:\0]+?)(?::\d+[:-]|$|:)/ : /^([^:\0]+?)(?::\d+[:-]|$|:)/)?.[1]?.trim()
      if (path && !path.includes(' ')) out.add(resolve(cwd, path, home))
    }
  }
  return [...out].slice(0, 60)
}
