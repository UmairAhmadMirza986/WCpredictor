import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { usePlayer } from '../context/PlayerContext'
import { calculatePoints, outcomeBonus, getMaxPoints, getResultPoints } from '../utils/scoring'

const GS_BONUS = { 1: 10, 2: 7, 3: 5 }
const GS_LABEL = { 1: 'GS #1', 2: 'GS #2', 3: 'GS #3' }

export default function Leaderboard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const { player } = usePlayer()

  useEffect(() => {
    async function load() {
      const [{ data: players }, { data: matches }, { data: preds }] = await Promise.all([
        supabase.from('players').select('id, name, is_admin, gs_rank').eq('is_admin', false),
        supabase.from('matches').select('id, score1, score2, stage, group_name, pen_winner, outcome'),
        supabase.from('predictions').select('*'),
      ])

      const matchMap = {}
      ;(matches || []).forEach(m => { matchMap[m.id] = m })

      const predsByPlayer = {}
      ;(preds || []).forEach(p => {
        if (!predsByPlayer[p.player_id]) predsByPlayer[p.player_id] = []
        predsByPlayer[p.player_id].push(p)
      })

      const leaderboard = (players || []).map(p => {
        let pts = 0, played = 0, exact = 0, correct = 0, outcomeBonusTotal = 0
        let submitted = 0
        ;(predsByPlayer[p.id] || []).forEach(pred => {
          const m = matchMap[pred.match_id]
          if (!m || m.group_name !== null) return
          submitted++
          if (m.score1 === null) return
          const scorePts = calculatePoints(pred.pred1, pred.pred2, m.score1, m.score2, m.stage, m.pen_winner)
          if (scorePts !== null) {
            const bonus = outcomeBonus(pred.outcome_pred, m.outcome, m.pen_winner)
            pts += scorePts + bonus
            outcomeBonusTotal += bonus
            played++
            if (scorePts === getMaxPoints(m.stage)) exact++
            if (scorePts >= getResultPoints(m.stage)) correct++
          }
        })
        const gsBonus = GS_BONUS[p.gs_rank] || 0
        return { ...p, pts: pts + gsBonus, gsBonus, played, exact, correct, submitted, outcomeBonusTotal }
      })

      leaderboard.sort((a, b) => b.pts - a.pts || b.correct - a.correct)
      setRows(leaderboard)
      setLoading(false)
    }
    load()
  }, [])

  const rankIcon = (i) => ['🥇', '🥈', '🥉'][i] ?? null

  if (loading) {
    return (
      <div className="page-shell">
        <div className="top-bar">
          <h1>Standings</h1>
          <span className="top-bar-sub">Knockout Stage</span>
        </div>
        <div className="loading-state">Loading…</div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div className="top-bar">
        <h1>Standings</h1>
        <span className="top-bar-sub">Knockout Stage</span>
      </div>

      <div className="leaderboard-wrap">
        {rows.length === 0 ? (
          <div className="empty-state">No results yet — predictions are open!</div>
        ) : (
          rows.map((p, i) => {
            const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : ''
            const isMe = p.id === player.id
            return (
              <div key={p.id} className={`lb-row ${rankClass}${isMe ? ' me' : ''}`}>
                <div className="lb-rank">
                  {rankIcon(i) ?? <span className="rank-num">{i + 1}</span>}
                </div>
                <div className="lb-info">
                  <span className="lb-name">
                    {p.name}{isMe ? ' (you)' : ''}
                    {p.gs_rank && (
                      <span className={`gs-badge gs-badge-${p.gs_rank}`}>
                        {GS_LABEL[p.gs_rank]}
                      </span>
                    )}
                  </span>
                  <span className="lb-sub">
                    {p.submitted} predicted · {p.correct} correct · {p.exact} ⭐
                    {p.outcomeBonusTotal > 0 && <span className="lb-outcome-bonus"> · +{p.outcomeBonusTotal} bonus</span>}
                  </span>
                </div>
                <div className="lb-pts">
                  <span className="lb-num">{p.pts}</span>
                  <span className="lb-unit">pts</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
