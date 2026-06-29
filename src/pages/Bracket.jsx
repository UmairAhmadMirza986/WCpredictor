import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getFlag } from '../utils/scoring'
import { effT1, effT2, winnerOf, buildMbs, sortKnockout, matchAt2 as matchAt } from '../utils/bracket'

const CARD_H  = 56
const CARD_GAP = 8
const CONN_W  = 28

const STAGE_META = {
  r32:   { label: 'Round of 32',    short: 'R32',   slots: 16, dates: 'Jun 28 – Jul 4' },
  r16:   { label: 'Round of 16',    short: 'R16',   slots: 8,  dates: 'Jul 4 – Jul 7' },
  qf:    { label: 'Quarter-Finals', short: 'QF',    slots: 4,  dates: 'Jul 9 – Jul 11' },
  sf:    { label: 'Semi-Finals',    short: 'SF',     slots: 2,  dates: 'Jul 14 – Jul 15' },
  final: { label: 'Final',          short: 'Final',  slots: 1,  dates: 'Jul 19' },
}

const VIEWS = [
  { left: 'r32', right: 'r16' },
  { left: 'r16', right: 'qf' },
  { left: 'qf',  right: 'sf' },
  { left: 'sf',  right: 'final' },
]

// SVG bracket connector: 2 left cards → 1 right card
function BktConnector() {
  const groupH = CARD_H * 2 + CARD_GAP
  const topY   = CARD_H / 2
  const botY   = CARD_H + CARD_GAP + CARD_H / 2
  const midY   = groupH / 2
  const midX   = CONN_W / 2
  const c      = 'rgba(255,255,255,0.18)'
  return (
    <svg width={CONN_W} height={groupH} style={{ flexShrink: 0 }} overflow="visible">
      <line x1={0}    y1={topY} x2={midX}   y2={topY} stroke={c} strokeWidth={1.5} />
      <line x1={midX} y1={topY} x2={midX}   y2={botY} stroke={c} strokeWidth={1.5} />
      <line x1={0}    y1={botY} x2={midX}   y2={botY} stroke={c} strokeWidth={1.5} />
      <line x1={midX} y1={midY} x2={CONN_W} y2={midY} stroke={c} strokeWidth={1.5} />
    </svg>
  )
}

// t1/t2 = derived team names; match provides score once entered by admin
function BCard({ match, t1, t2 }) {
  const team1 = match?.team1 || t1
  const team2 = match?.team2 || t2

  if (!team1 && !team2) {
    return (
      <div className="bkt-card tbd">
        <div className="bkt-team"><span className="bkt-name dim">TBD</span></div>
        <div className="bkt-team"><span className="bkt-name dim">TBD</span></div>
      </div>
    )
  }

  const scored = match && match.score1 !== null && match.score2 !== null
  const winner = !scored ? null
    : match.pen_winner ? (match.pen_winner === 1 ? team1 : team2)
    : match.score1 > match.score2 ? team1
    : match.score2 > match.score1 ? team2
    : null

  return (
    <div className="bkt-card">
      <div className={`bkt-team${winner ? (winner === team1 ? ' win' : ' lose') : ''}`}>
        {team1 ? <span className="bkt-flag">{getFlag(team1)}</span> : null}
        <span className={`bkt-name${!team1 ? ' dim' : ''}`}>{team1 || 'TBD'}</span>
        {scored && <span className="bkt-score">{match.score1}</span>}
      </div>
      <div className={`bkt-team${winner ? (winner === team2 ? ' win' : ' lose') : ''}`}>
        {team2 ? <span className="bkt-flag">{getFlag(team2)}</span> : null}
        <span className={`bkt-name${!team2 ? ' dim' : ''}`}>{team2 || 'TBD'}</span>
        {scored && <span className="bkt-score">{match.score2}</span>}
      </div>
    </div>
  )
}

export default function Bracket() {
  const [mbs, setMbs] = useState({})   // matchesByStage
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState(0)

  useEffect(() => {
    supabase.from('matches').select('*').is('group_name', null)
      .then(({ data }) => {
        if (!data) { setLoading(false); return }
        setMbs(buildMbs(sortKnockout(data)))
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div className="page-shell">
      <div className="top-bar">
        <h1>Bracket</h1>
        <span className="top-bar-sub">Knockout Stage</span>
      </div>
      <div className="loading-state">Loading…</div>
    </div>
  )

  const { left: leftStage, right: rightStage } = VIEWS[view]
  const leftMeta  = STAGE_META[leftStage]
  const rightMeta = STAGE_META[rightStage]
  const numPairs  = leftMeta.slots / 2
  const groupH    = CARD_H * 2 + CARD_GAP

  const finalMatch    = rightStage === 'final' ? matchAt('final', 0, mbs) : null
  const isFinalScored = finalMatch !== null && finalMatch.score1 !== null && finalMatch.score2 !== null
  const champion      = isFinalScored ? winnerOf('final', 0, mbs) : null

  return (
    <div className="page-shell bracket-page">
      <div className="top-bar">
        <h1>Bracket</h1>
        <span className="top-bar-sub">Knockout Stage</span>
      </div>

      <div className="bkt-nav">
        <button className="bkt-nav-btn" onClick={() => setView(v => v - 1)} disabled={view === 0}>◀</button>
        <div className="bkt-nav-label">
          <span className="bkt-nav-stage">{leftMeta.short}</span>
          <span className="bkt-nav-arrow">→</span>
          <span className="bkt-nav-stage">{rightMeta.short}</span>
        </div>
        <button className="bkt-nav-btn" onClick={() => setView(v => v + 1)} disabled={view === VIEWS.length - 1}>▶</button>
      </div>

      <div className="bkt-col-headers">
        <div className="bkt-col-hdr">
          <div className="bkt-col-hdr-title">{leftMeta.label}</div>
          <div className="bkt-col-hdr-date">{leftMeta.dates}</div>
        </div>
        <div style={{ width: CONN_W }} />
        <div className="bkt-col-hdr">
          <div className="bkt-col-hdr-title">{rightMeta.label}</div>
          <div className="bkt-col-hdr-date">{rightMeta.dates}</div>
        </div>
      </div>

      <div className="bkt-body">
        {Array.from({ length: numPairs }, (_, i) => {
          const topSlot  = i * 2
          const botSlot  = i * 2 + 1
          const topMatch = matchAt(leftStage,  topSlot, mbs)
          const botMatch = matchAt(leftStage,  botSlot, mbs)
          const rightMatch = matchAt(rightStage, i, mbs)

          return (
            <div key={i} className="bkt-group">
              <div className="bkt-left">
                <BCard match={topMatch}
                  t1={effT1(leftStage, topSlot, mbs)}
                  t2={effT2(leftStage, topSlot, mbs)} />
                <BCard match={botMatch}
                  t1={effT1(leftStage, botSlot, mbs)}
                  t2={effT2(leftStage, botSlot, mbs)} />
              </div>

              <BktConnector />

              <div className="bkt-right" style={{ height: groupH }}>
                <BCard match={rightMatch}
                  t1={winnerOf(leftStage, topSlot, mbs)}
                  t2={winnerOf(leftStage, botSlot, mbs)} />
              </div>
            </div>
          )
        })}

        {champion && (
          <div className="bkt-champion-banner">
            <div className="bkt-champion-icon">🏆</div>
            <div className="bkt-champion-flag">{getFlag(champion)}</div>
            <div className="bkt-champion-name">{champion}</div>
            <div className="bkt-champion-label">World Champion 2026</div>
          </div>
        )}
      </div>
    </div>
  )
}
