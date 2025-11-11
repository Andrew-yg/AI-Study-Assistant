import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { LearningMaterial } from '~/server/models/LearningMaterial'
import { getSignedR2Url } from '~/server/utils/r2'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Material ID is required'
    })
  }

  await connectDB()

  try {
    const material = await LearningMaterial.findOne({ _id: id, userId }).lean()

    if (!material) {
      throw createError({
        statusCode: 404,
        message: 'Material not found'
      })
    }

    // Get signed URL for file access
    const signedUrl = await getSignedR2Url(material.filePath, 3600)

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
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch material'
    })
  }
})

