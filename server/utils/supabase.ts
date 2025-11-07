import { createClient } from '@supabase/supabase-js'

const config = useRuntimeConfig()
const supabaseUrl = config.public.supabaseUrl || ''
const supabaseAnonKey = config.public.supabaseAnonKey || ''

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
