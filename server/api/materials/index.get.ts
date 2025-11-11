import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { LearningMaterial } from '~/server/models/LearningMaterial'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)

  await connectDB()

  try {
    const materials = await LearningMaterial.find({ userId })
      .sort({ createdAt: -1 })
      .lean()

    const transformedMaterials = materials.map(mat => ({
      id: mat._id.toString(),
      userId: mat.userId.toString(),
      conversationId: mat.conversationId?.toString() || null,
      courseName: mat.courseName,
      materialType: mat.materialType,
      description: mat.description,
      filePath: mat.filePath,
      fileSize: mat.fileSize,
      originalFilename: mat.originalFilename,
      createdAt: mat.createdAt,
      updatedAt: mat.updatedAt
    }))

    return {
      success: true,
      data: transformedMaterials
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch materials'
    })
  }
})

