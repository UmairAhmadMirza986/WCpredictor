import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { hashPin } from '../utils/scoring'
import { usePlayer } from '../context/PlayerContext'

export default function Profile() {
  const { player, logout } = usePlayer()
  const navigate = useNavigate()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (next.length < 4) return setError('New PIN must be at least 4 digits')
    if (next !== confirm) return setError('PINs do not match')
    setLoading(true)
    try {
      const currentHash = await hashPin(current)
      const { data } = await supabase
        .from('players').select('id')
        .eq('id', player.id).eq('pin_hash', currentHash).single()
      if (!data) { setError('Current PIN is incorrect'); setLoading(false); return }
      const newHash = await hashPin(next)
      await supabase.from('players').update({ pin_hash: newHash }).eq('id', player.id)
      setSuccess('PIN changed successfully!')
      setCurrent(''); setNext(''); setConfirm('')
    } catch {
      setError('Something went wrong. Try again.')
    }
    setLoading(false)
  }

  return (
    <div className="page-shell">
      <div className="top-bar">
        <h1>Profile</h1>
        <span className="player-chip">👤 {player.name}</span>
      </div>

      <div className="profile-wrap">
        <form className="pin-form" onSubmit={handleChange}>
          <h3>Change PIN</h3>

          <div className="form-group">
            <label>Current PIN</label>
            <input
              type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6}
              value={current} placeholder="Current PIN" required
              onChange={e => setCurrent(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          <div className="form-group">
            <label>New PIN</label>
            <input
              type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6}
              value={next} placeholder="New PIN (4–6 digits)" required
              onChange={e => setNext(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          <div className="form-group">
            <label>Confirm New PIN</label>
            <input
              type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6}
              value={confirm} placeholder="Confirm new PIN" required
              onChange={e => setConfirm(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          {error   && <p className="error-msg">⚠ {error}</p>}
          {success && <p className="success-msg">✓ {success}</p>}

          <button
            type="submit" className="btn-primary"
            disabled={loading || !current || !next || !confirm}
          >
            {loading ? 'Saving…' : 'Change PIN'}
          </button>
        </form>

        <button className="btn-logout" onClick={() => { logout(); navigate('/') }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
