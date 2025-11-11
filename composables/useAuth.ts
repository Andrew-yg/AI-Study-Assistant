export interface User {
  id: string
  email: string
  name: string
  avatar?: string
}

export const useAuth = () => {
  const user = useState<User | null>('auth-user', () => null)
  const loading = useState<boolean>('auth-loading', () => true)
  const token = useState<string | null>('auth-token', () => null)

  const initAuth = async () => {
    if (!process.client) return

    loading.value = true
    try {
      // Get token from localStorage
      const storedToken = localStorage.getItem('auth_token')
      
      if (storedToken) {
        token.value = storedToken
        
        // Verify token and get user info
        const response = await $fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        })
        
        if (response.success && response.user) {
          user.value = response.user
        } else {
          // Invalid token
          localStorage.removeItem('auth_token')
          token.value = null
          user.value = null
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      localStorage.removeItem('auth_token')
      token.value = null
      user.value = null
    } finally {
      loading.value = false
    }
  }

  const signInWithGoogle = async () => {
    // Redirect to Google OAuth endpoint
    window.location.href = '/api/auth/google'
  }

  const signOut = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local state
      localStorage.removeItem('auth_token')
      token.value = null
      user.value = null
      
      // Redirect to home
      navigateTo('/')
    }
  }

  const setAuthToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('auth_token', newToken)
  }

  return {
    user,
    loading,
    token,
    initAuth,
    signInWithGoogle,
    signOut,
    setAuthToken
  }
}
