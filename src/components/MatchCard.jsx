import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { usePlayer } from '../context/PlayerContext'
import { calculatePoints, outcomeBonus, outcomeBonusMax, getFlag, getRoundLabel, getMaxPoints, getResultPoints } from '../utils/scoring'

export default function MatchCard({ match, prediction, onSaved, playerId }) {
  const { player } = usePlayer()
  const isAdmin = player?.is_admin
  const now = new Date()
  const isLocked = new Date(match.kickoff_at) <= now
  const hasScore = match.score1 !== null && match.score2 !== null

  const scorePts = prediction && hasScore
    ? calculatePoints(prediction.pred1, prediction.pred2, match.score1, match.score2, match.stage, match.pen_winner)
    : null
  const bonusEarned = prediction && hasScore && match.outcome
    ? outcomeBonus(prediction.outcome_pred, match.outcome, match.pen_winner)
    : 0
  const points = scorePts !== null ? scorePts + bonusEarned : null
  const maxPts = getMaxPoints(match.stage)
  const resultPts = getResultPoints(match.stage)

  const [p1, setP1] = useState(prediction?.pred1 ?? '')
  const [p2, setP2] = useState(prediction?.pred2 ?? '')
  const [outcomePred, setOutcomePred] = useState(prediction?.outcome_pred ?? null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showPicks, setShowPicks] = useState(false)
  const [allPicks, setAllPicks] = useState([])
  const [loadingPicks, setLoadingPicks] = useState(false)

  const save = async () => {
    if (p1 === '' || p2 === '') return
    if (new Date(match.kickoff_at) <= new Date()) return  // re-check at save time, not render time
    setSaving(true)
    const row = { player_id: playerId, match_id: match.id, pred1: +p1, pred2: +p2, outcome_pred: outcomePred }
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

  const togglePicks = async () => {
    if (showPicks) { setShowPicks(false); return }
    if (allPicks.length > 0) { setShowPicks(true); return }
    setLoadingPicks(true)
    const [{ data: preds }, { data: players }] = await Promise.all([
      supabase.from('predictions').select('pred1, pred2, points, player_id, outcome_pred').eq('match_id', match.id),
      supabase.from('players').select('id, name').eq('is_admin', false).order('name'),
    ])
    const predMap = {}
    ;(preds || []).forEach(p => { predMap[p.player_id] = p })
    const merged = (players || []).map(p => ({
      name: p.name,
      submitted: !!predMap[p.id],
      pred1: predMap[p.id]?.pred1,
      pred2: predMap[p.id]?.pred2,
      points: predMap[p.id]?.points ?? null,
      outcome_pred: predMap[p.id]?.outcome_pred ?? null,
    }))
    setAllPicks(merged)
    setLoadingPicks(false)
    setShowPicks(true)
  }

  const ptClass = scorePts === null ? '' : scorePts >= maxPts ? 'perfect' : scorePts >= resultPts ? 'good' : scorePts >= 1 ? 'partial' : 'miss'
  const ptLabel = scorePts === null ? '' : `${scorePts >= maxPts ? '⭐ ' : ''}${scorePts} pt${scorePts !== 1 ? 's' : ''}`

  const pickPtClass = (pts) => {
    if (pts === null) return ''
    return pts >= maxPts ? 'perfect' : pts >= resultPts ? 'good' : pts >= 1 ? 'partial' : 'miss'
  }

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
              {match.pen_winner && <span className="pen-badge">pen.</span>}
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

      {!isAdmin && <div className="pred-row">
        {isLocked ? (
          prediction ? (
            <div className="pred-locked">
              <span className="pred-locked-score">
                Your pick: <strong>{prediction.pred1} – {prediction.pred2}</strong>
              </span>
              <div className="pred-pts-row">
                {scorePts !== null && (
                  <span className={`pts-chip ${ptClass}`}>{ptLabel}</span>
                )}
                {bonusEarned > 0 && scorePts !== null && (
                  <span className="pts-total-chip">+{bonusEarned} = {scorePts + bonusEarned} pts</span>
                )}
              </div>
            </div>
          ) : (
            <span className="no-pred">No prediction submitted — 0 pts</span>
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
            <div className="pred-status-bar">
              {prediction && +p1 === prediction.pred1 && +p2 === prediction.pred2
                ? <span className="pred-status saved">✓ Prediction saved: {prediction.pred1} – {prediction.pred2}</span>
                : p1 !== '' && p2 !== ''
                  ? <span className="pred-status unsaved">● Not saved yet — tap Save</span>
                  : <span className="pred-status none">No prediction yet</span>
              }
            </div>
          </div>
        )}
      </div>}

      {match.stage !== 'group' && !isAdmin && (() => {
        const opts = [
          { key: 'normal', label: '90 min',                          reward: '+1' },
          { key: 'aet',    label: 'Extra time',                      reward: '+2' },
          { key: 'pen1',   label: `${match.team1 || 'Team 1'} pen`,  reward: '+3' },
          { key: 'pen2',   label: `${match.team2 || 'Team 2'} pen`,  reward: '+3' },
        ]
        const hasOutcome = hasScore && match.outcome
        const bonus = hasOutcome ? outcomeBonus(outcomePred, match.outcome, match.pen_winner) : null
        const potentialBonus = outcomeBonusMax(outcomePred)

        const handlePick = async (key) => {
          if (isLocked) return
          setOutcomePred(key)
          if (prediction) {
            await supabase.from('predictions').update({ outcome_pred: key }).eq('id', prediction.id)
          }
        }

        return (
          <div className="outcome-pred-section">
            <div className="outcome-pred-header">
              <span className="outcome-pred-title">
                {potentialBonus ? `+${potentialBonus} bonus: How does it end?` : 'Bonus: How does it end?'}
              </span>
              {bonus !== null && outcomePred && (
                <span className={`outcome-bonus-chip ${bonus > 0 ? 'correct' : 'wrong'}`}>
                  {bonus > 0 ? `+${bonus} pts ✓` : '+0 pts'}
                </span>
              )}
            </div>
            <div className="outcome-pred-btns">
              {opts.map(opt => {
                const sel = outcomePred === opt.key
                const isCorrect = hasOutcome && (
                  match.outcome === 'pen'
                    ? (opt.key === 'pen1' && match.pen_winner === 1) || (opt.key === 'pen2' && match.pen_winner === 2)
                    : opt.key === match.outcome
                )
                return (
                  <button
                    key={opt.key}
                    data-key={opt.key}
                    disabled={isLocked}
                    onClick={() => handlePick(opt.key)}
                    className={`outcome-pred-btn${sel ? ' sel' : ''}${hasOutcome && sel && isCorrect ? ' correct' : ''}${hasOutcome && sel && !isCorrect ? ' wrong' : ''}${hasOutcome && !sel && isCorrect ? ' reveal' : ''}`}
                  >
                    <span className="opb-label">{opt.label}</span>
                    <span className="opb-reward">{opt.reward}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })()}

      {isLocked && (
        <div className="picks-section">
          <button className="btn-see-picks" onClick={togglePicks}>
            {loadingPicks ? 'Loading…' : showPicks ? '▲ Hide picks' : '👁 See all picks'}
          </button>
          {showPicks && (
            <div className="all-picks">
              {allPicks.length === 0 ? (
                <p className="no-picks-msg">No predictions submitted</p>
              ) : (
                allPicks.map((pk, i) => {
                  const outcomeLabel = { normal: '90 min', aet: 'AET', pen1: `${match.team1} pen`, pen2: `${match.team2} pen` }
                  const actualOutcome = match.outcome
                  const isOutcomeCorrect = pk.outcome_pred && actualOutcome && (
                    actualOutcome === 'pen'
                      ? (pk.outcome_pred === 'pen1' && match.pen_winner === 1) || (pk.outcome_pred === 'pen2' && match.pen_winner === 2)
                      : pk.outcome_pred === actualOutcome
                  )
                  const bonusEarned = hasScore && actualOutcome && pk.submitted && isOutcomeCorrect
                  const bonusMissed = hasScore && actualOutcome && pk.submitted && pk.outcome_pred && !isOutcomeCorrect

                  const pkBonus = bonusEarned ? outcomeBonus(pk.outcome_pred, actualOutcome, match.pen_winner) : 0
                  const pkScorePts = hasScore ? calculatePoints(pk.pred1, pk.pred2, match.score1, match.score2, match.stage, match.pen_winner) : null

                  return (
                    <div key={i} className="pick-row">
                      <span className="pick-name">{pk.name}</span>
                      {pk.submitted ? (
                        <div className="pick-right">
                          <span className="pick-score">{pk.pred1} – {pk.pred2}</span>
                          {pkScorePts !== null && (
                            <span className={`pts-chip ${pickPtClass(pkScorePts)}`}>
                              {pkScorePts >= maxPts ? '⭐ ' : ''}{pkScorePts}pt{pkScorePts !== 1 ? 's' : ''}
                            </span>
                          )}
                          {pkBonus > 0 && pkScorePts !== null && (
                            <span className="pts-total-chip">+{pkBonus} = {pkScorePts + pkBonus} pts</span>
                          )}
                        </div>
                      ) : (
                        <div className="pick-right">
                          <span className="pick-no-sub">Not submitted</span>
                          {hasScore && <span className="pts-chip miss">0pts</span>}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
