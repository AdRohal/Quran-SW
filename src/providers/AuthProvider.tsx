import { ReactNode } from 'react'
import { useEffect } from 'react'
import { useAuthStore } from '../store/auth'
import { authAPI } from '../lib/authAPI'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (token) {
          const user = await authAPI.getCurrentUser()
          if (user) {
            setUser(user)
          } else {
            // Token is invalid or expired
            localStorage.removeItem('authToken')
          }
        }
      } catch (error) {
        console.error('Failed to restore session:', error)
        localStorage.removeItem('authToken')
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [setUser, setLoading])

  return <>{children}</>
}
