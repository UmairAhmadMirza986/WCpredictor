import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { usePlayer } from '../context/PlayerContext'
import MatchCard from '../components/MatchCard'
import { formatDate } from '../utils/scoring'
import { augmentWithDerivedTeams } from '../utils/bracket'

export default function Matches() {
  const [matches, setMatches] = useState([])
  const [predictions, setPredictions] = useState({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('upcoming')
  const didAutoSwitch = useRef(false)
  const { player } = usePlayer()

  const fetchData = useCallback(async () => {
    const [{ data: matchData }, { data: predData }] = await Promise.all([
      supabase.from('matches').select('*').order('kickoff_at'),
      supabase.from('predictions').select('*').eq('player_id', player.id)
    ])
    if (matchData) setMatches(augmentWithDerivedTeams(matchData))
    if (predData) {
      const map = {}
      predData.forEach(p => { map[p.match_id] = p })
      setPredictions(map)
    }
    setLoading(false)
  }, [player.id])

  useEffect(() => { fetchData() }, [fetchData])

  // Auto-lock: set a timer for the next kickoff, re-fetch when it fires
  useEffect(() => {
    if (matches.length === 0) return
    const now = Date.now()
    const next = matches
      .map(m => new Date(m.kickoff_at).getTime())
      .filter(t => t > now)
      .sort((a, b) => a - b)[0]
    if (!next) return
    const timer = setTimeout(fetchData, next - now)
    return () => clearTimeout(timer)
  }, [matches, fetchData])

  const now = new Date()
  const upcoming = matches.filter(m => new Date(m.kickoff_at) > now)
  const live    = matches.filter(m => new Date(m.kickoff_at) <= now && (m.score1 === null || m.score2 === null))
  const results = matches.filter(m => m.score1 !== null && m.score2 !== null)

  // First load: jump to Live tab if there are live matches
  useEffect(() => {
    if (!loading && !didAutoSwitch.current) {
      didAutoSwitch.current = true
      if (live.length > 0) setTab('live')
    }
  }, [loading, live.length])

  const shown = tab === 'upcoming' ? upcoming : tab === 'live' ? live : results

  const toPktDate = (kickoffAt) =>
    new Date(kickoffAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' })

  const grouped = shown.reduce((acc, m) => {
    const key = toPktDate(m.kickoff_at)
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  // Results: most recent date first, and within each day most recent kickoff first
  const sortedEntries = Object.entries(grouped)
    .sort(([a], [b]) => tab === 'results' ? b.localeCompare(a) : a.localeCompare(b))
    .map(([date, dayMatches]) => [
      date,
      tab === 'results'
        ? [...dayMatches].sort((a, b) => new Date(b.kickoff_at) - new Date(a.kickoff_at))
        : dayMatches
    ])

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
        <div className="top-bar-right">
          {player.is_admin && (
            <button className="btn-refresh" onClick={fetchData} title="Refresh">↻</button>
          )}
          <span className="player-chip">👤 {player.name}</span>
        </div>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn${tab === 'upcoming' ? ' active' : ''}`} onClick={() => setTab('upcoming')}>
          Upcoming <span className="tab-count">{upcoming.length}</span>
        </button>
        <button className={`tab-btn${tab === 'live' ? ' active' : ''}`} onClick={() => setTab('live')}>
          Live {live.length > 0 && <span className="tab-count live-count">{live.length}</span>}
        </button>
        <button className={`tab-btn${tab === 'results' ? ' active' : ''}`} onClick={() => setTab('results')}>
          Results <span className="tab-count">{results.length}</span>
        </button>
      </div>

      <div className="matches-list">
        {sortedEntries.length === 0 ? (
          <div className="empty-state">
            {tab === 'upcoming' ? 'No upcoming matches' : tab === 'live' ? 'No matches in progress' : 'No results yet'}
          </div>
        ) : (
          sortedEntries.map(([date, dayMatches]) => (
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
