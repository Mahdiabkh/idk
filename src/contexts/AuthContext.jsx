import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('dynamed_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    // Simulate API call
    if (email === 'admin@dynamed.com' && password === 'admin') {
      const userData = {
        id: 1,
        name: 'Admin User',
        email: 'admin@dynamed.com',
        role: 'admin',
        specialite: 'Administration'
      }
      setUser(userData)
      localStorage.setItem('dynamed_user', JSON.stringify(userData))
      return userData
    } else if (email === 'doctor@dynamed.com' && password === 'doctor') {
      const userData = {
        id: 2,
        name: 'Dr. Jean Dupont',
        email: 'doctor@dynamed.com',
        role: 'doctor',
        phone: '+33 1 23 45 67 89',
        specialite: 'Médecine Générale',
        type_pratique: 'prive'
      }
      setUser(userData)
      localStorage.setItem('dynamed_user', JSON.stringify(userData))
      return userData
    }
    throw new Error('Invalid credentials')
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('dynamed_user')
  }

  const value = {
    user,
    login,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}