import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { hashPin, getFlag, calculatePoints, outcomeBonus, getRoundLabel } from '../utils/scoring'
import { usePlayer } from '../context/PlayerContext'
import { augmentWithDerivedTeams } from '../utils/bracket'

export default function Admin() {
  const { player } = usePlayer()
  const [tab, setTab] = useState('scores')
  const [matches, setMatches] = useState([])
  const [players, setPlayers] = useState([])
  const [predMap, setPredMap] = useState({})
  const [scores, setScores] = useState({})
  const [newPlayer, setNewPlayer] = useState({ name: '', pin: '' })
  const [saving, setSaving] = useState({})
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [expandedMatch, setExpandedMatch] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('matches').select('*').order('kickoff_at').then(({ data }) => {
      if (!data) return
      setMatches(augmentWithDerivedTeams(data))
      const s = {}
      data.forEach(m => {
        const uiOutcome = m.outcome === 'pen'
          ? (m.pen_winner === 1 ? 'pen1' : 'pen2')
          : (m.outcome || null)
        s[m.id] = { s1: m.score1 ?? '', s2: m.score2 ?? '', outcome: uiOutcome }
      })
      setScores(s)
    })
    supabase.from('players').select('*').order('name').then(({ data }) => {
      if (data) setPlayers(data)
    })
    supabase.from('predictions').select('player_id, match_id').then(({ data }) => {
      if (!data) return
      const map = {}
      data.forEach(p => {
        if (!map[p.match_id]) map[p.match_id] = new Set()
        map[p.match_id].add(p.player_id)
      })
      setPredMap(map)
    })
  }, [])

  const saveScore = async (matchId) => {
    const { s1, s2, outcome } = scores[matchId]
    if (s1 === '' || s2 === '') return
    const match = matches.find(m => m.id === matchId)
    const isKnockout = match?.stage && match.stage !== 'group'
    if (isKnockout && !outcome) { flash('⚠ Select how the match ended'); return }
    setSaving(v => ({ ...v, [matchId]: true }))
    const matchOutcome = outcome === 'pen1' || outcome === 'pen2' ? 'pen' : (outcome || null)
    const penWinner = outcome === 'pen1' ? 1 : outcome === 'pen2' ? 2 : null
    await supabase.from('matches').update({ score1: +s1, score2: +s2, outcome: matchOutcome, pen_winner: penWinner }).eq('id', matchId)
    const { data: preds } = await supabase.from('predictions').select('*').eq('match_id', matchId)
    for (const pred of (preds || [])) {
      const scorePts = calculatePoints(pred.pred1, pred.pred2, +s1, +s2, match?.stage, penWinner) ?? 0
      const bonus = outcomeBonus(pred.outcome_pred, matchOutcome, penWinner)
      await supabase.from('predictions').update({ points: scorePts + bonus }).eq('id', pred.id)
    }
    setSaving(v => ({ ...v, [matchId]: false }))
    flash('Score saved ✓')
  }

  const addPlayer = async (e) => {
    e.preventDefault()
    if (!newPlayer.name.trim() || !newPlayer.pin.trim()) return
    setAddingPlayer(true)
    const pin_hash = await hashPin(newPlayer.pin)
    const { error } = await supabase.from('players').insert({ name: newPlayer.name.trim(), pin_hash })
    if (error) {
      flash('Error: ' + (error.message || 'Could not add player'))
    } else {
      flash(`${newPlayer.name} added ✓`)
      setNewPlayer({ name: '', pin: '' })
      const { data } = await supabase.from('players').select('*').order('name')
      if (data) setPlayers(data)
    }
    setAddingPlayer(false)
  }

  const flash = (text) => {
    setMsg(text)
    setTimeout(() => setMsg(''), 3000)
  }

  const now = new Date()
  const isKnockout = (m) => m.stage !== 'group'

  return (
    <div className="page-shell">
      <div className="top-bar admin-bar">
        <h1>Admin</h1>
        <span className="admin-badge-chip">⚙️ {player.name}</span>
      </div>

      {msg && <div className="flash-msg">{msg}</div>}

      <div className="tab-bar">
        <button className={`tab-btn${tab === 'scores' ? ' active' : ''}`} onClick={() => setTab('scores')}>Scores</button>
        <button className={`tab-btn${tab === 'players' ? ' active' : ''}`} onClick={() => setTab('players')}>Players</button>
      </div>

      {tab === 'scores' && (() => {
        const nonAdminPlayers = players.filter(p => !p.is_admin)
        const needsScore = matches.filter(m => {
          if (new Date(m.kickoff_at) > now) return false
          if (m.score1 === null) return true
          // Knockout match scored but outcome not set yet
          const isKo = m.stage && m.stage !== 'group'
          if (isKo && !m.outcome) return true
          return false
        })

        return (
          <div className="admin-matches">
            {needsScore.length === 0 ? (
              <div className="empty-state">All caught up — no matches waiting for scores</div>
            ) : needsScore.map(m => {
              const ko = isKnockout(m)
              const label = ko ? getRoundLabel(m.stage) : `Group ${m.group_name}`
              const submittedIds = predMap[m.id] || new Set()
              const submittedCount = nonAdminPlayers.filter(p => submittedIds.has(p.id)).length
              const isExpanded = expandedMatch === m.id

              return (
                <div key={m.id} className="admin-match">
                  <div className="admin-match-top">
                    <span className={`admin-group-pill${ko ? ' knockout' : ''}`}>{label}</span>
                    <button
                      className={`pred-count-btn${submittedCount === nonAdminPlayers.length ? ' all-in' : ''}`}
                      onClick={() => setExpandedMatch(isExpanded ? null : m.id)}
                    >
                      {submittedCount}/{nonAdminPlayers.length} predicted
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="pred-status-list">
                      {nonAdminPlayers.map(p => (
                        <span key={p.id} className={`pred-status-chip ${submittedIds.has(p.id) ? 'done' : 'missing'}`}>
                          {submittedIds.has(p.id) ? '✓' : '✗'} {p.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="admin-match-body">
                    <div className="admin-teams">
                      <span>{getFlag(m.team1)} {m.team1}</span>
                      <span className="admin-vs">vs</span>
                      <span>{m.team2} {getFlag(m.team2)}</span>
                    </div>
                    <div className="admin-score-row">
                      <input
                        type="number" min="0" max="20" className="goal-input"
                        value={scores[m.id]?.s1 ?? ''} placeholder="–"
                        onChange={e => setScores(s => ({ ...s, [m.id]: { ...s[m.id], s1: e.target.value } }))}
                      />
                      <span className="input-dash">–</span>
                      <input
                        type="number" min="0" max="20" className="goal-input"
                        value={scores[m.id]?.s2 ?? ''} placeholder="–"
                        onChange={e => setScores(s => ({ ...s, [m.id]: { ...s[m.id], s2: e.target.value } }))}
                      />
                      <button
                        className="btn-save"
                        onClick={() => saveScore(m.id)}
                        disabled={saving[m.id] || scores[m.id]?.s1 === '' || scores[m.id]?.s2 === '' || (isKnockout(m) && !scores[m.id]?.outcome)}
                      >
                        {saving[m.id] ? '…' : 'Save'}
                      </button>
                    </div>
                    {ko && scores[m.id]?.s1 !== '' && scores[m.id]?.s2 !== '' && (
                      <div className="outcome-picker">
                        <span className="outcome-picker-label">How did it end?</span>
                        <div className="outcome-btns">
                          {[
                            { key: 'normal', label: '90 min' },
                            { key: 'aet',    label: 'Extra time' },
                            { key: 'pen1',   label: `${m.team1 || 'Team 1'} (pen)` },
                            { key: 'pen2',   label: `${m.team2 || 'Team 2'} (pen)` },
                          ].map(opt => (
                            <button
                              key={opt.key}
                              className={`outcome-btn${scores[m.id]?.outcome === opt.key ? ' selected' : ''}`}
                              onClick={() => setScores(s => ({ ...s, [m.id]: { ...s[m.id], outcome: opt.key } }))}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {tab === 'players' && (
        <div className="admin-players-tab">
          <form className="add-player-form" onSubmit={addPlayer}>
            <h3>Add Player</h3>
            <input
              type="text" placeholder="Player name"
              value={newPlayer.name}
              onChange={e => setNewPlayer(p => ({ ...p, name: e.target.value }))}
              required
            />
            <input
              type="text" inputMode="numeric" placeholder="PIN (4–6 digits)" maxLength={6}
              value={newPlayer.pin}
              onChange={e => setNewPlayer(p => ({ ...p, pin: e.target.value.replace(/\D/g, '') }))}
              required
            />
            <button type="submit" className="btn-primary" disabled={addingPlayer}>
              {addingPlayer ? 'Adding…' : 'Add Player'}
            </button>
          </form>

          <div className="players-list">
            {players.filter(p => !p.is_admin).map(p => (
              <div key={p.id} className="player-adj-card">
                <span className="player-row-name">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
