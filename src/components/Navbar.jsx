import { NavLink, useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'

export default function Navbar() {
  const { player, logout } = usePlayer()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <NavLink to="/matches" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
        <span className="nav-icon">⚽</span>
        <span className="nav-label">Matches</span>
      </NavLink>
      <NavLink to="/leaderboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
        <span className="nav-icon">🏆</span>
        <span className="nav-label">Standings</span>
      </NavLink>
      {player?.is_admin && (
        <NavLink to="/admin" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Admin</span>
        </NavLink>
      )}
      <button onClick={handleLogout} className="nav-item nav-btn">
        <span className="nav-icon">👤</span>
        <span className="nav-label">{player?.name?.split(' ')[0]}</span>
      </button>
    </nav>
  )
}
