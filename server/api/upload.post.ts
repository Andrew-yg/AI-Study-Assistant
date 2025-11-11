import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { LearningMaterial } from '~/server/models/LearningMaterial'
import { uploadToR2, getSignedR2Url } from '~/server/utils/r2'

export default defineEventHandler(async (event) => {
  try {
    const { userId } = await requireAuth(event)

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

    console.log('[Upload] Starting upload for user:', userId, {
      filename: file.filename,
      size: fileSizeMB.toFixed(2) + 'MB',
      courseName,
      materialType,
      conversationId
    })

    // Upload to Cloudflare R2
    const timestamp = Date.now()
    const fileName = `${userId}/${timestamp}_${file.filename}`

    const { key, url } = await uploadToR2(fileName, file.data, 'application/pdf')

    console.log('[Upload] File uploaded to R2:', key)

    // Save metadata to MongoDB
    await connectDB()

    const material = await LearningMaterial.create({
      userId,
      conversationId: conversationId || null,
      courseName,
      materialType,
      description: description || '',
      filePath: key,
      fileSize: file.data.length,
      originalFilename: file.filename || 'unknown.pdf'
    })

    console.log('[Upload] Material saved to database:', material._id)

    // Get signed URL for temporary access
    const signedUrl = await getSignedR2Url(key, 3600) // 1 hour

    return {
      success: true,
      data: {
        id: material._id.toString(),
        userId: material.userId.toString(),
        conversationId: material.conversationId?.toString() || null,
        courseName: material.courseName,
        materialType: material.materialType,
        description: material.description,
        filePath: material.filePath,
        fileSize: material.fileSize,
        originalFilename: material.originalFilename,
        createdAt: material.createdAt,
        updatedAt: material.updatedAt,
        publicUrl: signedUrl
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

