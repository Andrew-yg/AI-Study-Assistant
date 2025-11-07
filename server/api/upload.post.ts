import { supabase } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  try {
    const form = await readMultipartFormData(event)

    if (!form) {
      throw createError({
        statusCode: 400,
        message: 'No file uploaded'
      })
    }

    let file: any = null
    let userId: string = ''
    let courseName: string = ''
    let materialType: string = ''
    let description: string = ''

    for (const part of form) {
      if (part.name === 'file') {
        file = part
      } else if (part.name === 'userId') {
        userId = part.data.toString()
      } else if (part.name === 'courseName') {
        courseName = part.data.toString()
      } else if (part.name === 'materialType') {
        materialType = part.data.toString()
      } else if (part.name === 'description') {
        description = part.data.toString()
      }
    }

    if (!file || !userId || !courseName || !materialType) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields'
      })
    }

    if (file.type !== 'application/pdf') {
      throw createError({
        statusCode: 400,
        message: 'Only PDF files are allowed'
      })
    }

    const timestamp = Date.now()
    const fileName = `${userId}/${timestamp}_${file.filename}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('learning-materials')
      .upload(fileName, file.data, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (uploadError) {
      throw createError({
        statusCode: 500,
        message: uploadError.message
      })
    }

    const { data: publicUrlData } = supabase.storage
      .from('learning-materials')
      .getPublicUrl(fileName)

    const { data: materialData, error: insertError } = await supabase
      .from('learning_materials')
      .insert({
        user_id: userId,
        course_name: courseName,
        material_type: materialType,
        description: description || '',
        file_path: uploadData.path,
        file_size: file.data.length,
        original_filename: file.filename || 'unknown.pdf'
      })
      .select()
      .single()

    if (insertError) {
      await supabase.storage
        .from('learning-materials')
        .remove([fileName])

      throw createError({
        statusCode: 500,
        message: insertError.message
      })
    }

    return {
      success: true,
      data: {
        ...materialData,
        publicUrl: publicUrlData.publicUrl
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to upload file'
    })
  }
})
