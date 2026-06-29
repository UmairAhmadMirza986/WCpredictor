import { Routes, Route, Navigate } from 'react-router-dom'
import { usePlayer } from './context/PlayerContext'
import Login from './pages/Login'
import Matches from './pages/Matches'
import Leaderboard from './pages/Leaderboard'
import Admin from './pages/Admin'
import Profile from './pages/Profile'
import Rules from './pages/Rules'
import Bracket from './pages/Bracket'
import Navbar from './components/Navbar'

function ProtectedRoute({ children }) {
  const { player } = usePlayer()
  if (!player) return <Navigate to="/" replace />
  return children
}

function AdminRoute({ children }) {
  const { player } = usePlayer()
  if (!player || !player.is_admin) return <Navigate to="/matches" replace />
  return children
}

export default function App() {
  const { player } = usePlayer()

  return (
    <div className="app">
      {player && <Navbar />}
      <main className={player ? 'main-with-nav' : 'main-full'}>
        <Routes>
          <Route path="/" element={player ? <Navigate to="/matches" replace /> : <Login />} />
          <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/rules" element={<ProtectedRoute><Rules /></ProtectedRoute>} />
          <Route path="/bracket" element={<ProtectedRoute><Bracket /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
