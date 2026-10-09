import type { ClientModule } from 'claude-code'

export type Seg = { t: string; c?: string; b?: boolean; s?: boolean; i?: boolean; sh?: string; dim?: boolean; one?: boolean; bg?: string }
export type RowSpec = { id: string; left: Seg[]; right: Seg[] }
export type RowsProps = {
  rows: RowSpec[]
  active: string
  activeBg: string
  hoverBg: string
  tones: Record<string, { bright: string[]; dim: string[] }>
  fg?: string
  still?: boolean
  pointer?: boolean
  bar?: { pos: number; size: number; thumb: string; track: string }
}
type Local = { hover: number; phase: number; drag: boolean; ref: { stop?: () => void; unpoint?: () => void } }

const TICK_MS = 90

function shimmer(i: number, phase: number, len: number, palette: string[]): string {
  const band = ((phase * 1.6) % (len + 8)) - 4
  const d = Math.abs(i - band)
  return palette[d < 0.8 ? 3 : d < 1.8 ? 2 : d < 2.8 ? 1 : 0] ?? palette[0] ?? '#f97316'
}

const Rows: ClientModule<RowsProps, Local> = (props, surface) => {
  const { Box, Text } = surface.elements
  let state = surface.state
  if (state === undefined) {
    state = { hover: -1, phase: 0, drag: false, ref: {} }
    surface.setState(state)
  }
  const lit = !props.still && props.rows.some(r => r.left.some(s => s.sh) || r.right.some(s => s.sh))
  if (lit && !state.ref.stop) {
    state.ref.stop = surface.every(TICK_MS, () => {
      const cur = surface.state
      if (cur) surface.setState({ ...cur, phase: cur.phase + 1 })
    })
  } else if (!lit && state.ref.stop) {
    state.ref.stop()
    state.ref.stop = undefined
  }
  if (props.pointer === false) {
    state.ref.unpoint?.()
    state.ref.unpoint = undefined
  } else state.ref.unpoint = surface.onPointer(e => {
    const cur = surface.state ?? state
    const span = Math.max(1, props.rows.length - 1)
    const onBar = Boolean(props.bar) && e.x >= surface.columns - 1
    if (props.bar && (cur.drag || (onBar && e.type === 'down' && (e.button ?? 'left') === 'left'))) {
      if (e.type === 'up' || e.type === 'leave') {
        surface.setState({ ...cur, drag: false })
        return
      }
      if (e.type === 'down' || e.type === 'move') {
        if (!cur.drag) surface.setState({ ...cur, drag: true, hover: -1 })
        surface.post({ scrollTo: Math.max(0, Math.min(1, e.y / span)) })
        return
      }
    }
    if (e.type === 'leave' || e.y < 0 || e.y >= props.rows.length) {
      if (cur.hover !== -1) surface.setState({ ...cur, hover: -1 })
      return
    }
    if (e.type === 'move' && !e.button && cur.hover !== e.y) surface.setState({ ...cur, hover: e.y })
    const row = props.rows[e.y]
    if (e.type === 'down' && e.button === 'right' && row?.id) {
      surface.post({ copy: row.id, shift: Boolean(e.shift) })
      return
    }
    if (e.type !== 'down' || (e.button ?? 'left') !== 'left' || !row) return
    if (row.id) surface.post({ press: row.id, ctrl: Boolean(e.ctrl), shift: Boolean(e.shift) })
  })
  surface.onKey(e => surface.post({ key: e.key, ctrl: Boolean(e.ctrl), shift: Boolean(e.shift) }))
  // The cursor row's background is the selection colour: its text is drawn in the foreground, never a tone.
  const draw = (active: boolean) => (s: Seg) => {
    const palette = s.sh && !active ? (s.dim ? props.tones[s.sh]?.dim : props.tones[s.sh]?.bright) : undefined
    if (!palette) {
      return (
        <Text color={active ? props.fg : s.c} backgroundColor={s.bg} bold={s.b} strikethrough={s.s} italic={s.i}>
          {s.t}
        </Text>
      )
    }
    if (s.one || props.still) {
      return (
        <Text color={props.still ? palette[0] : shimmer(-1, state.phase, s.t.length, palette)} bold={s.b}>
          {s.t}
        </Text>
      )
    }
    // One Text per run of same-coloured characters: the band spans a handful of runs, not one per character.
    const chars = [...s.t]
    const runs: { c: string; t: string }[] = []
    chars.forEach((ch, i) => {
      const c = shimmer(i, state.phase, chars.length, palette)
      const last = runs[runs.length - 1]
      if (last?.c === c) last.t += ch
      else runs.push({ c, t: ch })
    })
    return (
      <Text bold={s.b}>
        {runs.map(r => (
          <Text color={r.c}>{r.t}</Text>
        ))}
      </Text>
    )
  }
  return (
    <Box flexDirection="column">
      {props.rows.map((r, i) => {
        const active = Boolean(r.id) && r.id === props.active
        return (
        <Box
          flexDirection="row"
          height={1}
          overflow="hidden"
          backgroundColor={active ? props.activeBg : r.id && i === state.hover ? props.hoverBg : undefined}
        >
          <Box flexShrink={1} overflow="hidden">
            {r.left.map(draw(active))}
          </Box>
          <Box flexGrow={1} />
          {r.right.map(draw(active))}
          {props.bar && (
            <Text color={i >= props.bar.pos && i < props.bar.pos + props.bar.size ? props.bar.thumb : props.bar.track}>
              {i >= props.bar.pos && i < props.bar.pos + props.bar.size ? '┃' : '│'}
            </Text>
          )}
        </Box>
        )
      })}
    </Box>
  )
}

export default Rows
