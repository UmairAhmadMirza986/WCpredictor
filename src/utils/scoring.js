const STAGE_RESULT_PTS = {
  r32: 4, r16: 5, qf: 6, sf: 7, '3rd': 7, final: 10,
}

export function getResultPoints(stage) {
  return STAGE_RESULT_PTS[stage] ?? 3
}

export function getMaxPoints(stage) {
  return getResultPoints(stage) + (stage && stage !== 'group' ? 3 : 2)
}

export function calculatePoints(pred1, pred2, score1, score2, stage, penWinner = null) {
  if (score1 === null || score2 === null || score1 === undefined || score2 === undefined) {
    return null
  }
  let points = 0
  const predResult = Math.sign(pred1 - pred2)
  // Pen shootout doesn't change the match result — it's always a draw at FT/AET
  const actualResult = Math.sign(score1 - score2)
  if (predResult === actualResult) points += getResultPoints(stage)

  const isKnockout = stage && stage !== 'group'
  if (isKnockout) {
    if (pred1 === score1 && pred2 === score2) points += 3
    else if (pred1 === score1 || pred2 === score2) points += 1
  } else {
    if (pred1 === score1) points += 1
    if (pred2 === score2) points += 1
  }
  return points
}

export async function hashPin(pin) {
  const encoder = new TextEncoder()
  const data = encoder.encode(String(pin))
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export const TEAM_FLAGS = {
  'Mexico': '🇲🇽', 'South Africa': '🇿🇦', 'Korea Republic': '🇰🇷', 'Czechia': '🇨🇿',
  'Canada': '🇨🇦', 'Bosnia and Herzegovina': '🇧🇦', 'Qatar': '🇶🇦', 'Switzerland': '🇨🇭',
  'Brazil': '🇧🇷', 'Morocco': '🇲🇦', 'Haiti': '🇭🇹', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'United States': '🇺🇸', 'Paraguay': '🇵🇾', 'Australia': '🇦🇺', 'Türkiye': '🇹🇷',
  'Germany': '🇩🇪', 'Curaçao': '🇨🇼', 'Côte d\'Ivoire': '🇨🇮', 'Ecuador': '🇪🇨',
  'Netherlands': '🇳🇱', 'Japan': '🇯🇵', 'Sweden': '🇸🇪', 'Tunisia': '🇹🇳',
  'Belgium': '🇧🇪', 'Egypt': '🇪🇬', 'IR Iran': '🇮🇷', 'New Zealand': '🇳🇿',
  'Spain': '🇪🇸', 'Cabo Verde': '🇨🇻', 'Saudi Arabia': '🇸🇦', 'Uruguay': '🇺🇾',
  'France': '🇫🇷', 'Senegal': '🇸🇳', 'Iraq': '🇮🇶', 'Norway': '🇳🇴',
  'Argentina': '🇦🇷', 'Algeria': '🇩🇿', 'Austria': '🇦🇹', 'Jordan': '🇯🇴',
  'Portugal': '🇵🇹', 'Congo DR': '🇨🇩', 'Uzbekistan': '🇺🇿', 'Colombia': '🇨🇴',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croatia': '🇭🇷', 'Ghana': '🇬🇭', 'Panama': '🇵🇦',
}

export function getFlag(team) {
  return TEAM_FLAGS[team] || '🏳️'
}

export function formatKickoff(kickoffAt) {
  const d = new Date(kickoffAt)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZoneName: 'short'
  })
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

// Risk-reward bonus: 90min=1pt, AET=2pts, Pen=3pts if correct
export function outcomeBonus(outcomePred, matchOutcome, penWinner) {
  if (!outcomePred || !matchOutcome) return 0
  if (matchOutcome === 'pen') {
    if (outcomePred === 'pen1' && penWinner === 1) return 3
    if (outcomePred === 'pen2' && penWinner === 2) return 3
    return 0
  }
  if (outcomePred === matchOutcome) return matchOutcome === 'aet' ? 2 : 1
  return 0
}

export function outcomeBonusMax(outcomePred) {
  if (outcomePred === 'normal') return 1
  if (outcomePred === 'aet')    return 2
  if (outcomePred === 'pen1' || outcomePred === 'pen2') return 3
  return null
}

export function getRoundLabel(stage) {
  const labels = {
    r32: 'Round of 32', r16: 'Round of 16',
    qf: 'Quarter-final', sf: 'Semi-final',
    '3rd': '3rd Place', final: 'Final',
  }
  return labels[stage] || stage
}
