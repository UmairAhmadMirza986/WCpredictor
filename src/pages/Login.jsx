import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { hashPin } from '../utils/scoring'
import { usePlayer } from '../context/PlayerContext'

export default function Login() {
  const [players, setPlayers] = useState([])
  const [selectedName, setSelectedName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = usePlayer()
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('players').select('id, name').order('name').then(({ data }) => {
      if (data) setPlayers(data)
    })
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const pinHash = await hashPin(pin)
      const { data, error: dbError } = await supabase
        .from('players')
        .select('*')
        .eq('name', selectedName)
        .eq('pin_hash', pinHash)
        .single()
      if (dbError || !data) {
        setError('Wrong PIN. Try again.')
      } else {
        login(data)
        navigate(data.is_admin ? '/admin' : '/matches')
      }
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Decorative background "26" */}
      <div className="login-26-bg">26</div>

      <div className="login-hero">
        <div className="login-trophy">🏆</div>

        <div className="login-wordmark">
          <span className="login-fifa">FIFA</span>
          <span className="login-wc">WORLD CUP</span>
        </div>

        <div className="login-year">2026</div>

        <div className="login-hosts-strip">
          🇺🇸 USA &nbsp;·&nbsp; 🇨🇦 CANADA &nbsp;·&nbsp; 🇲🇽 MEXICO
        </div>

        <div className="login-game-badge">Prediction Game</div>
      </div>

      <div className="login-divider">
        <span className="login-divider-line" />
        <span className="login-divider-icon">◆</span>
        <span className="login-divider-line" />
      </div>

      <div className="login-form-wrap">
        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>Who are you?</label>
            <div className="select-wrap">
              <select
                value={selectedName}
                onChange={e => setSelectedName(e.target.value)}
                required
              >
                <option value="">Select your name</option>
                {players.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
              <span className="select-arrow">▾</span>
            </div>
          </div>

          <div className="form-group">
            <label>PIN</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="error-msg">⚠ {error}</p>}

          <button
            type="submit"
            disabled={loading || !selectedName || !pin}
            className="btn-login"
          >
            {loading ? 'Checking…' : 'Enter →'}
          </button>
        </form>
      </div>
    </div>
  )
}
