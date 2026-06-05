import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { usePlayer } from '../context/PlayerContext'
import { calculatePoints } from '../utils/scoring'

export default function Leaderboard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const { player } = usePlayer()

  useEffect(() => {
    async function load() {
      const [{ data: players }, { data: matches }, { data: preds }] = await Promise.all([
        supabase.from('players').select('id, name, is_admin').eq('is_admin', false),
        supabase.from('matches').select('id, score1, score2'),
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
        let pts = 0, played = 0, exact = 0, correct = 0
        ;(predsByPlayer[p.id] || []).forEach(pred => {
          const m = matchMap[pred.match_id]
          if (!m || m.score1 === null) return
          const points = calculatePoints(pred.pred1, pred.pred2, m.score1, m.score2)
          if (points !== null) {
            pts += points
            played++
            if (points === 5) exact++
            if (points >= 3) correct++
          }
        })
        return { ...p, pts, played, exact, correct }
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
        <div className="top-bar"><h1>Standings</h1></div>
        <div className="loading-state">Loading…</div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div className="top-bar">
        <h1>Standings</h1>
      </div>

      <div className="leaderboard-wrap">
        {rows.length === 0 ? (
          <div className="empty-state">No results yet — predictions are open!</div>
        ) : (
          rows.map((p, i) => (
            <div key={p.id} className={`lb-row${p.id === player.id ? ' me' : ''}`}>
              <div className="lb-rank">
                {rankIcon(i) ?? <span className="rank-num">{i + 1}</span>}
              </div>
              <div className="lb-info">
                <span className="lb-name">{p.name}{p.id === player.id ? ' (you)' : ''}</span>
                <span className="lb-sub">
                  {p.played} played · {p.correct} correct · {p.exact} ⭐
                </span>
              </div>
              <div className="lb-pts">
                <span className="lb-num">{p.pts}</span>
                <span className="lb-unit">pts</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
