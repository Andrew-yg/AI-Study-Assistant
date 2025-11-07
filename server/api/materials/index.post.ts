import { supabase } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const { userId, courseName, materialType, description, filePath, fileSize, originalFilename } = body

    if (!userId || !courseName || !materialType || !filePath || !fileSize || !originalFilename) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields'
      })
    }

    const { data, error } = await supabase
      .from('learning_materials')
      .insert({
        user_id: userId,
        course_name: courseName,
        material_type: materialType,
        description: description || '',
        file_path: filePath,
        file_size: fileSize,
        original_filename: originalFilename
      })
      .select()
      .single()

    if (error) {
      throw createError({
        statusCode: 500,
        message: error.message
      })
    }

    return {
      success: true,
      data
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to create material'
    })
  }
})
