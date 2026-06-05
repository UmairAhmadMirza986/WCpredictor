import { NavLink } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'

export default function Navbar() {
  const { player } = usePlayer()

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
      <NavLink to="/profile" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
        <span className="nav-icon">👤</span>
        <span className="nav-label">{player?.name?.split(' ')[0]}</span>
      </NavLink>
    </nav>
  )
}
