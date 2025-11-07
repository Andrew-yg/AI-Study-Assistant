import { supabase } from '~/utils/supabase'
import type { User, Session } from '@supabase/supabase-js'

export const useAuth = () => {
  const user = useState<User | null>('auth-user', () => null)
  const session = useState<Session | null>('auth-session', () => null)
  const loading = useState<boolean>('auth-loading', () => true)

  const initAuth = async () => {
    loading.value = true
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      session.value = currentSession
      user.value = currentSession?.user || null

      supabase.auth.onAuthStateChange((_event, newSession) => {
        session.value = newSession
        user.value = newSession?.user || null
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      loading.value = false
    }
  }

  const signInWithGoogle = async () => {
    const origin = window.location.origin
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`
      }
    })

    if (error) {
      throw error
    }

    return data
  }

  const signInWithGithub = async () => {
    const origin = window.location.origin
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${origin}/auth/callback`
      }
    })

    if (error) {
      throw error
    }

    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
    user.value = null
    session.value = null
  }

  return {
    user,
    session,
    loading,
    initAuth,
    signInWithGoogle,
    signInWithGithub,
    signOut
  }
}
