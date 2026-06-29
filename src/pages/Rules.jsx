import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const ROUNDS = [
  { label: 'Group Stage',   resultPts: 3,  maxPts: 5,  note: '+1 each correct score · max 5' },
  { label: 'Round of 32',   resultPts: 4,  maxPts: 7,  note: '+3 exact score · +1 one score right' },
  { label: 'Round of 16',   resultPts: 5,  maxPts: 8,  note: '+3 exact score · +1 one score right' },
  { label: 'Quarter-Final', resultPts: 6,  maxPts: 9,  note: '+3 exact score · +1 one score right' },
  { label: 'Semi-Final',    resultPts: 7,  maxPts: 10, note: '+3 exact score · +1 one score right' },
  { label: 'Final',         resultPts: 10, maxPts: 13, note: '+3 exact score · +1 one score right' },
]

const OUTCOME_OPTS = [
  { key: 'normal', label: '90 min',       reward: '+1', color: 'var(--green)',  risk: 'Low risk' },
  { key: 'aet',    label: 'Extra time',   reward: '+2', color: 'var(--orange)', risk: 'Medium risk' },
  { key: 'pen',    label: 'Specific team\non penalties', reward: '+3', color: 'var(--red)', risk: 'High risk' },
]

const GS_BONUS = { 1: 10, 2: 7, 3: 5 }
const GS_MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function Rules() {
  const [gsWinners, setGsWinners] = useState([])

  useEffect(() => {
    supabase
      .from('players').select('name, gs_rank')
      .not('gs_rank', 'is', null).order('gs_rank')
      .then(({ data }) => { if (data) setGsWinners(data) })
  }, [])

  return (
    <div className="page-shell">
      <div className="top-bar">
        <h1>Rules</h1>
        <span className="top-bar-sub">How to Play</span>
      </div>

      <div className="rules-wrap">

        {/* Score prediction */}
        <section className="rules-section">
          <h2 className="rules-heading">Score Prediction</h2>
          <p className="rules-text">Predict the exact score of every match before kickoff. Points increase each round.</p>
          <div className="rules-rounds-table">
            <div className="rr-header">
              <span>Round</span>
              <span>Correct Result</span>
              <span>Max Pts</span>
            </div>
            {ROUNDS.map(r => (
              <div key={r.label} className={`rr-row${r.label === 'Final' ? ' rr-final' : ''}`}>
                <span className="rr-round">{r.label}</span>
                <span className="rr-result">{r.resultPts} pts</span>
                <span className="rr-max">{r.maxPts} pts</span>
                <span className="rr-note">{r.note}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Example */}
        <section className="rules-section">
          <h2 className="rules-heading">Example (Group Stage)</h2>
          <div className="rules-example">
            <p>Real score: <strong>Brazil 2 – 1 France</strong></p>
            <p>Your guess: <strong>Brazil 2 – 0 France</strong></p>
            <ul>
              <li>✅ Correct result (Brazil win) → <strong>3 pts</strong></li>
              <li>✅ Brazil score correct → <strong>+1 pt</strong></li>
              <li>❌ France score wrong → <strong>+0 pts</strong></li>
              <li><strong>Total: 4 pts</strong></li>
            </ul>
          </div>
        </section>

        {/* Outcome Bonus */}
        <section className="rules-section">
          <h2 className="rules-heading">Outcome Bonus (Knockout only)</h2>
          <p className="rules-text">
            For every knockout match, pick <strong>how it ends</strong> — independently of your score prediction.
            Higher risk picks earn more points if correct.
          </p>
          <div className="rules-outcome-grid">
            {OUTCOME_OPTS.map(o => (
              <div key={o.key} className="rules-outcome-card" style={{ borderColor: o.color + '55' }}>
                <span className="roc-label">{o.label}</span>
                <span className="roc-reward" style={{ color: o.color }}>{o.reward}</span>
                <span className="roc-risk">{o.risk}</span>
              </div>
            ))}
          </div>
          <p className="rules-text" style={{ marginTop: 10 }}>
            Wrong guess = <strong>0 pts</strong>. This does not affect your score prediction points.
          </p>
        </section>

        {/* GS Bonus */}
        <section className="rules-section">
          <h2 className="rules-heading">Group Stage Bonus</h2>
          <p className="rules-text">Top 3 finishers after the group stage carried bonus points into the knockout stage.</p>
          <div className="rules-gs-bonus">
            {gsWinners.length > 0 ? gsWinners.map(p => (
              <div key={p.gs_rank} className={`gs-bonus-row gs-bonus-${p.gs_rank}`}>
                <span className="gs-bonus-medal">{GS_MEDAL[p.gs_rank]}</span>
                <span className="gs-bonus-name">{p.name}</span>
                <span className="gs-bonus-pts">+{GS_BONUS[p.gs_rank]} pts</span>
              </div>
            )) : [1,2,3].map(rank => (
              <div key={rank} className={`gs-bonus-row gs-bonus-${rank}`}>
                <span className="gs-bonus-medal">{GS_MEDAL[rank]}</span>
                <span className="gs-bonus-name gs-bonus-name-dim">GS #{rank} Winner</span>
                <span className="gs-bonus-pts">+{GS_BONUS[rank]} pts</span>
              </div>
            ))}
          </div>
        </section>

        {/* Deadline */}
        <section className="rules-section">
          <h2 className="rules-heading">Prediction Deadline</h2>
          <p className="rules-text">Everything locks the moment a match kicks off — score prediction and outcome pick. No late entries, no exceptions. Miss a match = <strong>0 pts</strong>.</p>
        </section>

        {/* Prize */}
        <section className="rules-section">
          <h2 className="rules-heading">Prize</h2>
          <p className="rules-text">The player with the <strong>most points at the end of the tournament</strong> wins a <strong>Lunch or Dinner voucher</strong>. 🍽️</p>
        </section>

      </div>
    </div>
  )
}
