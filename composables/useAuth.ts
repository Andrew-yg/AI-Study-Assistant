import { useSupabaseClient } from '~/utils/supabase'
import type { User, Session } from '@supabase/supabase-js'

export const useAuth = () => {
  const user = useState<User | null>('auth-user', () => null)
  const session = useState<Session | null>('auth-session', () => null)
  const loading = useState<boolean>('auth-loading', () => true)

  const initAuth = async () => {
    if (!process.client) return

    loading.value = true
    try {
      const supabase = useSupabaseClient()
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
    const supabase = useSupabaseClient()
    const origin = window.location.origin
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`
      }
    })

    if (error) {
      console.error('Google OAuth error:', error)
      throw error
    }

    if (data?.url) {
      window.location.href = data.url
    }

    return data
  }

  const signInWithGithub = async () => {
    const supabase = useSupabaseClient()
    const origin = window.location.origin
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${origin}/auth/callback`
      }
    })

    if (error) {
      console.error('GitHub OAuth error:', error)
      throw error
    }

    if (data?.url) {
      window.location.href = data.url
    }

    return data
  }

  const signOut = async () => {
    const supabase = useSupabaseClient()
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
