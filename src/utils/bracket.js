const PREV_STAGE = { r16: 'r32', qf: 'r16', sf: 'qf', final: 'sf' }

function matchAt(stage, slotIdx, mbs) {
  return (mbs[stage] || [])[slotIdx] || null
}

export function effT1(stage, slotIdx, mbs) {
  const m = matchAt(stage, slotIdx, mbs)
  if (m?.team1) return m.team1
  const prev = PREV_STAGE[stage]
  if (!prev) return null
  return winnerOf(prev, slotIdx * 2, mbs)
}

export function effT2(stage, slotIdx, mbs) {
  const m = matchAt(stage, slotIdx, mbs)
  if (m?.team2) return m.team2
  const prev = PREV_STAGE[stage]
  if (!prev) return null
  return winnerOf(prev, slotIdx * 2 + 1, mbs)
}

export function winnerOf(stage, slotIdx, mbs) {
  const m = matchAt(stage, slotIdx, mbs)
  if (!m || m.score1 === null || m.score2 === null) return null
  const t1 = effT1(stage, slotIdx, mbs)
  const t2 = effT2(stage, slotIdx, mbs)
  if (m.pen_winner) return m.pen_winner === 1 ? t1 : t2
  if (m.score1 > m.score2) return t1
  if (m.score2 > m.score1) return t2
  return null
}

export function matchAt2(stage, slotIdx, mbs) {
  return matchAt(stage, slotIdx, mbs)
}

// Build mbs from a flat list of knockout matches already sorted by bracket_slot/kickoff_at
export function buildMbs(knockoutMatches) {
  const mbs = {}
  knockoutMatches.forEach(m => {
    if (!mbs[m.stage]) mbs[m.stage] = []
    mbs[m.stage].push(m)
  })
  return mbs
}

// Sort knockout matches correctly for bracket derivation
export function sortKnockout(matches) {
  return [...matches].sort((a, b) => {
    const sa = a.bracket_slot ?? 999
    const sb = b.bracket_slot ?? 999
    if (sa !== sb) return sa - sb
    return new Date(a.kickoff_at) - new Date(b.kickoff_at)
  })
}

// Augment a list of all matches with derived team names for knockout rounds
export function augmentWithDerivedTeams(allMatches) {
  const knockoutSorted = sortKnockout(allMatches.filter(m => !m.group_name))
  const mbs = buildMbs(knockoutSorted)

  return allMatches.map(m => {
    if (m.group_name || (m.team1 && m.team2)) return m
    const stageList = mbs[m.stage] || []
    const slotIdx = stageList.findIndex(s => s.id === m.id)
    if (slotIdx === -1) return m
    return {
      ...m,
      team1: effT1(m.stage, slotIdx, mbs) || '',
      team2: effT2(m.stage, slotIdx, mbs) || '',
    }
  })
}
