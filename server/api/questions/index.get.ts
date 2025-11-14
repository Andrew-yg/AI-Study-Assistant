import mongoose from 'mongoose'
import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { Question } from '~/server/models/Question'
import { serializeQuestion } from '~/server/api/questions/serializer'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)
  await connectDB()

  const query = getQuery(event)
  const filter: Record<string, any> = { userId }

  const conversationId = typeof query.conversationId === 'string' ? query.conversationId.trim() : undefined
  const materialId = typeof query.materialId === 'string' ? query.materialId.trim() : undefined
  const limitParam = typeof query.limit === 'string' ? Number(query.limit) : undefined

  if (conversationId) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw createError({ statusCode: 400, message: 'Invalid conversationId' })
    }
    filter.conversationId = new mongoose.Types.ObjectId(conversationId)
  }

  if (materialId) {
    if (!mongoose.Types.ObjectId.isValid(materialId)) {
      throw createError({ statusCode: 400, message: 'Invalid materialId' })
    }
    filter.materialId = new mongoose.Types.ObjectId(materialId)
  }

  const limit = limitParam && limitParam > 0 ? Math.min(limitParam, 100) : 50

  const questions = await Question.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()

  return {
    success: true,
    data: questions.map(serializeQuestion)
  }
})
