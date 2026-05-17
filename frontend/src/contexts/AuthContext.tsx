import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../lib/api'
import { toast } from 'sonner'

export interface User {
  id: string
  name: string
  email: string
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN'
  department?: string
  managerId?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('atomquest_token')
    const savedUser = localStorage.getItem('atomquest_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    const { token: newToken, user: newUser } = res.data
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('atomquest_token', newToken)
    localStorage.setItem('atomquest_user', JSON.stringify(newUser))
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('atomquest_token')
    localStorage.removeItem('atomquest_user')
    delete api.defaults.headers.common['Authorization']
    toast.success('Logged out successfully')
  }

  const updateUser = (updated: User) => {
    setUser(updated)
    localStorage.setItem('atomquest_user', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
