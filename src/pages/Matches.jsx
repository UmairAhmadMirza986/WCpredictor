import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { usePlayer } from '../context/PlayerContext'
import MatchCard from '../components/MatchCard'
import { formatDate } from '../utils/scoring'

export default function Matches() {
  const [matches, setMatches] = useState([])
  const [predictions, setPredictions] = useState({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('upcoming')
  const { player } = usePlayer()

  const fetchData = useCallback(async () => {
    const [{ data: matchData }, { data: predData }] = await Promise.all([
      supabase.from('matches').select('*').order('kickoff_at'),
      supabase.from('predictions').select('*').eq('player_id', player.id)
    ])
    if (matchData) setMatches(matchData)
    if (predData) {
      const map = {}
      predData.forEach(p => { map[p.match_id] = p })
      setPredictions(map)
    }
    setLoading(false)
  }, [player.id])

  useEffect(() => { fetchData() }, [fetchData])

  const now = new Date()
  const upcoming = matches.filter(m => new Date(m.kickoff_at) > now)
  const past = matches.filter(m => new Date(m.kickoff_at) <= now)
  const shown = tab === 'upcoming' ? upcoming : past

  const toPktDate = (kickoffAt) =>
    new Date(kickoffAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' })

  const grouped = shown.reduce((acc, m) => {
    const key = toPktDate(m.kickoff_at)
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="page-shell">
        <div className="top-bar"><h1>Matches</h1></div>
        <div className="loading-state">Loading…</div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div className="top-bar">
        <h1>Matches</h1>
        <span className="player-chip">👤 {player.name}</span>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn${tab === 'upcoming' ? ' active' : ''}`} onClick={() => setTab('upcoming')}>
          Upcoming <span className="tab-count">{upcoming.length}</span>
        </button>
        <button className={`tab-btn${tab === 'past' ? ' active' : ''}`} onClick={() => setTab('past')}>
          Results <span className="tab-count">{past.length}</span>
        </button>
      </div>

      <div className="matches-list">
        {Object.keys(grouped).length === 0 ? (
          <div className="empty-state">No matches to show</div>
        ) : (
          Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, dayMatches]) => (
            <div key={date} className="day-group">
              <div className="day-label">{formatDate(date)}</div>
              {dayMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predictions[match.id]}
                  playerId={player.id}
                  onSaved={fetchData}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
