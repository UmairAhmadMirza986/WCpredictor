import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { hashPin, getFlag, calculatePoints, getRoundLabel } from '../utils/scoring'
import { usePlayer } from '../context/PlayerContext'

export default function Admin() {
  const { player } = usePlayer()
  const [tab, setTab] = useState('scores')
  const [matches, setMatches] = useState([])
  const [players, setPlayers] = useState([])
  const [scores, setScores] = useState({})
  const [newPlayer, setNewPlayer] = useState({ name: '', pin: '' })
  const [saving, setSaving] = useState({})
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [addingMatch, setAddingMatch] = useState(false)
  const [msg, setMsg] = useState('')
  const [knockout, setKnockout] = useState({ round: 'r32', team1: '', team2: '', kickoff: '' })

  useEffect(() => {
    supabase.from('matches').select('*').order('kickoff_at').then(({ data }) => {
      if (!data) return
      setMatches(data)
      const s = {}
      data.forEach(m => { s[m.id] = { s1: m.score1 ?? '', s2: m.score2 ?? '' } })
      setScores(s)
    })
    supabase.from('players').select('*').order('name').then(({ data }) => {
      if (data) setPlayers(data)
    })
  }, [])

  const saveScore = async (matchId) => {
    const { s1, s2 } = scores[matchId]
    if (s1 === '' || s2 === '') return
    setSaving(v => ({ ...v, [matchId]: true }))
    await supabase.from('matches').update({ score1: +s1, score2: +s2 }).eq('id', matchId)
    const { data: preds } = await supabase.from('predictions').select('*').eq('match_id', matchId)
    if (preds) {
      for (const pred of preds) {
        const pts = calculatePoints(pred.pred1, pred.pred2, +s1, +s2)
        await supabase.from('predictions').update({ points: pts }).eq('id', pred.id)
      }
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

  const addKnockoutMatch = async (e) => {
    e.preventDefault()
    if (!knockout.team1.trim() || !knockout.team2.trim() || !knockout.kickoff) return
    setAddingMatch(true)
    const kickoff_at = new Date(knockout.kickoff).toISOString()
    const match_date = knockout.kickoff.slice(0, 10)
    const match_time = knockout.kickoff.slice(11, 16)
    const { error } = await supabase.from('matches').insert({
      team1: knockout.team1.trim(),
      team2: knockout.team2.trim(),
      kickoff_at,
      match_date,
      match_time,
      stage: knockout.round,
      group_name: null,
    })
    if (error) {
      flash('Error: ' + (error.message || 'Could not add match'))
    } else {
      flash(`${knockout.team1} vs ${knockout.team2} added ✓`)
      setKnockout({ round: 'r32', team1: '', team2: '', kickoff: '' })
      const { data } = await supabase.from('matches').select('*').order('kickoff_at')
      if (data) {
        setMatches(data)
        const s = {}
        data.forEach(m => { s[m.id] = { s1: m.score1 ?? '', s2: m.score2 ?? '' } })
        setScores(s)
      }
    }
    setAddingMatch(false)
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
        <button className={`tab-btn${tab === 'scores' ? ' active' : ''}`} onClick={() => setTab('scores')}>
          Scores
        </button>
        <button className={`tab-btn${tab === 'knockout' ? ' active' : ''}`} onClick={() => setTab('knockout')}>
          Knockout
        </button>
        <button className={`tab-btn${tab === 'players' ? ' active' : ''}`} onClick={() => setTab('players')}>
          Players
        </button>
      </div>

      {tab === 'scores' && (
        <div className="admin-matches">
          {matches.map(m => {
            const locked = new Date(m.kickoff_at) <= now
            const ko = isKnockout(m)
            const label = ko ? getRoundLabel(m.stage) : `Group ${m.group_name}`
            return (
              <div key={m.id} className={`admin-match${locked ? ' locked' : ''}`}>
                <div className="admin-match-top">
                  <span className={`admin-group-pill${ko ? ' knockout' : ''}`}>{label}</span>
                  {locked && <span className="locked-chip">Locked</span>}
                </div>
                <div className="admin-match-body">
                  <div className="admin-teams">
                    <span>{getFlag(m.team1)} {m.team1}</span>
                    <span className="admin-vs">vs</span>
                    <span>{m.team2} {getFlag(m.team2)}</span>
                  </div>
                  <div className="admin-score-row">
                    <input
                      type="number" min="0" max="20"
                      className="goal-input"
                      value={scores[m.id]?.s1 ?? ''}
                      placeholder="–"
                      onChange={e => setScores(s => ({ ...s, [m.id]: { ...s[m.id], s1: e.target.value } }))}
                    />
                    <span className="input-dash">–</span>
                    <input
                      type="number" min="0" max="20"
                      className="goal-input"
                      value={scores[m.id]?.s2 ?? ''}
                      placeholder="–"
                      onChange={e => setScores(s => ({ ...s, [m.id]: { ...s[m.id], s2: e.target.value } }))}
                    />
                    <button
                      className="btn-save"
                      onClick={() => saveScore(m.id)}
                      disabled={saving[m.id] || scores[m.id]?.s1 === '' || scores[m.id]?.s2 === ''}
                    >
                      {saving[m.id] ? '…' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'knockout' && (
        <div className="knockout-form-wrap">
          <form className="knockout-form" onSubmit={addKnockoutMatch}>
            <h3>Add Knockout Match</h3>
            <select
              value={knockout.round}
              onChange={e => setKnockout(k => ({ ...k, round: e.target.value }))}
            >
              <option value="r32">Round of 32</option>
              <option value="r16">Round of 16</option>
              <option value="qf">Quarter-final</option>
              <option value="sf">Semi-final</option>
              <option value="3rd">3rd Place</option>
              <option value="final">Final</option>
            </select>
            <div className="teams-row">
              <input
                type="text"
                placeholder="Team 1"
                value={knockout.team1}
                onChange={e => setKnockout(k => ({ ...k, team1: e.target.value }))}
                required
              />
              <span className="vs-text">vs</span>
              <input
                type="text"
                placeholder="Team 2"
                value={knockout.team2}
                onChange={e => setKnockout(k => ({ ...k, team2: e.target.value }))}
                required
              />
            </div>
            <input
              type="datetime-local"
              value={knockout.kickoff}
              onChange={e => setKnockout(k => ({ ...k, kickoff: e.target.value }))}
              required
            />
            <button type="submit" className="btn-primary" disabled={addingMatch}>
              {addingMatch ? 'Adding…' : 'Add Match'}
            </button>
          </form>
        </div>
      )}

      {tab === 'players' && (
        <div className="admin-players-tab">
          <form className="add-player-form" onSubmit={addPlayer}>
            <h3>Add Player</h3>
            <input
              type="text"
              placeholder="Player name"
              value={newPlayer.name}
              onChange={e => setNewPlayer(p => ({ ...p, name: e.target.value }))}
              required
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="PIN (4–6 digits)"
              maxLength={6}
              value={newPlayer.pin}
              onChange={e => setNewPlayer(p => ({ ...p, pin: e.target.value.replace(/\D/g, '') }))}
              required
            />
            <button type="submit" className="btn-primary" disabled={addingPlayer}>
              {addingPlayer ? 'Adding…' : 'Add Player'}
            </button>
          </form>

          <div className="players-list">
            {players.map(p => (
              <div key={p.id} className="player-row">
                <span className="player-row-name">{p.name}</span>
                {p.is_admin && <span className="admin-chip">Admin</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
