import { createClient } from '@supabase/supabase-js'

let supabaseInstance: ReturnType<typeof createClient> | null = null

export const useSupabaseClient = () => {
  if (!supabaseInstance && process.client) {
    const config = useRuntimeConfig()
    const supabaseUrl = config.public.supabaseUrl as string
    const supabaseAnonKey = config.public.supabaseAnonKey as string

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL and Anon Key must be provided')
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }

  if (!supabaseInstance) {
    throw new Error('Supabase client is only available on the client side')
  }

  return supabaseInstance
}

export type LearningMaterial = {
  id: string
  user_id: string
  course_name: string
  material_type: 'lecture' | 'textbook' | 'slides' | 'assignment' | 'other'
  description: string
  file_path: string
  file_size: number
  original_filename: string
  created_at: string
  updated_at: string
}
