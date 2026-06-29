import { createContext, useContext, useState, useEffect } from 'react'

const PlayerContext = createContext(null)

const SESSION_KEY = 'wc2026_player'
const SESSION_TS_KEY = 'wc2026_player_ts'
const SESSION_DURATION = 60 * 60 * 1000 // 1 hour

function loadSession() {
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    const ts = localStorage.getItem(SESSION_TS_KEY)
    if (!stored || !ts) return null
    if (Date.now() - Number(ts) > SESSION_DURATION) {
      localStorage.removeItem(SESSION_KEY)
      localStorage.removeItem(SESSION_TS_KEY)
      return null
    }
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function PlayerProvider({ children }) {
  const [player, setPlayer] = useState(() => loadSession())

  // Check session expiry every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (loadSession() === null && player !== null) {
        setPlayer(null)
      }
    }, 60 * 1000)
    return () => clearInterval(interval)
  }, [player])

  const login = (playerData) => {
    setPlayer(playerData)
    localStorage.setItem(SESSION_KEY, JSON.stringify(playerData))
    localStorage.setItem(SESSION_TS_KEY, String(Date.now()))
  }

  const logout = () => {
    setPlayer(null)
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(SESSION_TS_KEY)
  }

  return (
    <PlayerContext.Provider value={{ player, login, logout }}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  return useContext(PlayerContext)
}
