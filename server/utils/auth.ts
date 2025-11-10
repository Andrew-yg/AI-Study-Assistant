import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

export const getAuthenticatedSupabase = async (event: H3Event) => {
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  const token = authHeader.substring(7)

  const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !supabaseAnonKey) {
    throw createError({
      statusCode: 500,
      message: 'Server configuration error'
    })
  }

  // Create Supabase client with the user's token
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })

  // Verify the token and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    console.error('[Auth] Failed to verify token:', authError?.message)
    throw createError({
      statusCode: 401,
      message: 'Invalid authentication token'
    })
  }

  console.log('[Auth] Authenticated user:', user.id)

  return { supabase, user }
}
