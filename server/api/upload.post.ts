import { getAuthenticatedSupabase } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(event)

    // Set the session for RLS to work properly
    const authHeader = getHeader(event, 'authorization')
    const token = authHeader?.substring(7)
    
    if (token) {
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: ''
      })
    }

    const form = await readMultipartFormData(event)

    if (!form) {
      console.error('[Upload] No multipart form data received')
      throw createError({
        statusCode: 400,
        message: 'No file uploaded'
      })
    }

    let file: any = null
    let courseName: string = ''
    let materialType: string = ''
    let description: string = ''
    let conversationId: string = ''

    for (const part of form) {
      if (part.name === 'file') {
        file = part
      } else if (part.name === 'courseName') {
        courseName = part.data.toString()
      } else if (part.name === 'materialType') {
        materialType = part.data.toString()
      } else if (part.name === 'description') {
        description = part.data.toString()
      } else if (part.name === 'conversationId') {
        conversationId = part.data.toString()
      }
    }

    if (!file || !courseName || !materialType) {
      console.error('[Upload] Missing required fields:', {
        hasFile: !!file,
        courseName,
        materialType
      })
      throw createError({
        statusCode: 400,
        message: 'Missing required fields'
      })
    }

    if (file.type !== 'application/pdf') {
      console.error('[Upload] Invalid file type:', file.type)
      throw createError({
        statusCode: 400,
        message: 'Only PDF files are allowed'
      })
    }

    const fileSizeMB = file.data.length / (1024 * 1024)
    if (fileSizeMB > 10) {
      console.error('[Upload] File too large:', fileSizeMB.toFixed(2), 'MB')
      throw createError({
        statusCode: 400,
        message: 'File size must be less than 10MB'
      })
    }

    console.log('[Upload] Starting upload for user:', user.id, {
      filename: file.filename,
      size: fileSizeMB.toFixed(2) + 'MB',
      courseName,
      materialType,
      conversationId
    })

    const timestamp = Date.now()
    const fileName = `${user.id}/${timestamp}_${file.filename}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('learning-materials')
      .upload(fileName, file.data, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (uploadError) {
      console.error('[Upload] Storage upload failed:', uploadError.message)
      throw createError({
        statusCode: 500,
        message: `Storage error: ${uploadError.message}`
      })
    }

    console.log('[Upload] File uploaded to storage:', uploadData.path)

    const { data: publicUrlData } = supabase.storage
      .from('learning-materials')
      .getPublicUrl(fileName)

    const { data: materialData, error: insertError } = await supabase
      .from('learning_materials')
      .insert({
        user_id: user.id,
        conversation_id: conversationId || null,
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
      console.error('[Upload] Database insert failed:', insertError.message, insertError.details)

      await supabase.storage
        .from('learning-materials')
        .remove([fileName])

      throw createError({
        statusCode: 500,
        message: `Database error: ${insertError.message}`
      })
    }

    console.log('[Upload] Material saved to database:', materialData.id)

    return {
      success: true,
      data: {
        ...materialData,
        publicUrl: publicUrlData.publicUrl
      }
    }
  } catch (error: any) {
    console.error('[Upload] Upload failed:', error.message, error.statusCode)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to upload file'
    })
  }
})
