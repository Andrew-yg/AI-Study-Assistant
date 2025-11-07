import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

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
