import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { LearningMaterial } from '~/server/models/LearningMaterial'

export default defineEventHandler(async (event) => {
  const authResult = await requireAuth(event)
  await connectDB()

  try {
    const body = await readBody(event)
    const { conversationId, courseName, materialType, description, filePath, fileSize, originalFilename } = body

    if (!courseName || !materialType || !filePath || !fileSize || !originalFilename) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields'
      })
    }

    const material = await LearningMaterial.create({
      userId: authResult.userId,
      conversationId: conversationId || null,
      courseName,
      materialType,
      description: description || '',
      filePath,
      fileSize,
      originalFilename
    })

    return {
      success: true,
      data: {
        id: material._id!.toString(),
        userId: material.userId.toString(),
        conversationId: material.conversationId?.toString() || null,
        courseName: material.courseName,
        materialType: material.materialType,
        description: material.description,
        filePath: material.filePath,
        fileSize: material.fileSize,
        originalFilename: material.originalFilename,
        createdAt: material.createdAt,
        updatedAt: material.updatedAt
      }
    }
  } catch (error: any) {
    console.error('Error creating material:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to create material'
    })
  }
})
