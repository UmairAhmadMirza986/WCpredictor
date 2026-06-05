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
        navigate('/matches')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-header">
        <div className="login-trophy">🏆</div>
        <div className="login-ball">⚽</div>
        <h1>FIFA WORLD CUP</h1>
        <h2>2026</h2>
        <p className="login-hosts">USA · Canada · Mexico</p>
        <p className="login-subtitle">Prediction Game</p>
      </div>

      <div className="login-form-wrap">
        <form className="login-form" onSubmit={handleLogin}>
          <h3 className="form-title">Sign In</h3>

          <div className="form-group">
            <label>Select your name</label>
            <div className="select-wrap">
              <select
                value={selectedName}
                onChange={e => setSelectedName(e.target.value)}
                required
              >
                <option value="">— Choose player —</option>
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
              placeholder="Enter your PIN"
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
            {loading ? 'Checking…' : 'Let\'s Play →'}
          </button>
        </form>
      </div>
    </div>
  )
}
