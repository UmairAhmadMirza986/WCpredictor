import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { calculatePoints, getFlag, getRoundLabel } from '../utils/scoring'

export default function MatchCard({ match, prediction, onSaved, playerId }) {
  const now = new Date()
  const isLocked = new Date(match.kickoff_at) <= now
  const hasScore = match.score1 !== null && match.score2 !== null

  const points = prediction && hasScore
    ? calculatePoints(prediction.pred1, prediction.pred2, match.score1, match.score2)
    : null

  const [p1, setP1] = useState(prediction?.pred1 ?? '')
  const [p2, setP2] = useState(prediction?.pred2 ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    if (p1 === '' || p2 === '') return
    setSaving(true)
    const row = { player_id: playerId, match_id: match.id, pred1: +p1, pred2: +p2 }
    if (prediction) {
      await supabase.from('predictions').update(row).eq('id', prediction.id)
    } else {
      await supabase.from('predictions').insert(row)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onSaved()
  }

  const ptClass = points === null ? '' : points === 5 ? 'perfect' : points >= 3 ? 'good' : points >= 1 ? 'partial' : 'miss'
  const ptLabel = points === null ? '' : points === 5 ? '⭐ 5 pts' : points === 4 ? '4 pts' : points === 3 ? '3 pts' : points === 1 ? '1 pt' : '0 pts'

  return (
    <div className={`match-card ${ptClass}`}>
      <div className="match-meta">
        <span className={`group-pill${match.group_name ? '' : ' knockout'}`}>
          {match.group_name ? `Group ${match.group_name}` : getRoundLabel(match.stage)}
        </span>
        <span className="match-time-label">
          {new Date(match.kickoff_at).toLocaleString('en-US', {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
            timeZone: 'Asia/Karachi'
          })} PKT
        </span>
      </div>

      <div className="match-body">
        <div className="team-col left">
          <span className="flag-lg">{getFlag(match.team1)}</span>
          <span className="team-nm">{match.team1}</span>
        </div>

        <div className="score-col">
          {hasScore ? (
            <div className="actual-score">
              <span>{match.score1}</span>
              <span className="score-dash">–</span>
              <span>{match.score2}</span>
            </div>
          ) : (
            <span className="vs-badge">VS</span>
          )}
        </div>

        <div className="team-col right">
          <span className="flag-lg">{getFlag(match.team2)}</span>
          <span className="team-nm">{match.team2}</span>
        </div>
      </div>

      <div className="pred-row">
        {isLocked ? (
          prediction ? (
            <div className="pred-locked">
              <span className="pred-locked-score">
                Your pick: <strong>{prediction.pred1} – {prediction.pred2}</strong>
              </span>
              {points !== null && (
                <span className={`pts-chip ${ptClass}`}>{ptLabel}</span>
              )}
            </div>
          ) : (
            <span className="no-pred">No prediction submitted</span>
          )
        ) : (
          <div className="pred-input-row">
            <span className="pred-input-label">{prediction ? 'Edit:' : 'Predict:'}</span>
            <div className="pred-inputs">
              <input
                type="number" min="0" max="20"
                value={p1}
                onChange={e => { setP1(e.target.value); setSaved(false) }}
                className="goal-input"
                placeholder="0"
              />
              <span className="input-dash">–</span>
              <input
                type="number" min="0" max="20"
                value={p2}
                onChange={e => { setP2(e.target.value); setSaved(false) }}
                className="goal-input"
                placeholder="0"
              />
              <button
                className={`btn-save ${saved ? 'saved' : ''}`}
                onClick={save}
                disabled={saving || p1 === '' || p2 === ''}
              >
                {saving ? '…' : saved ? '✓' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
