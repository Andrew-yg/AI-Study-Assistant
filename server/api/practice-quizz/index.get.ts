import mongoose from 'mongoose'

import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { PracticeQuiz } from '~/server/models/PracticeQuiz'
import { serializePracticeQuiz } from '~/server/api/practice-quizz/serializer'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)
  await connectDB()

  const query = getQuery(event)
  const filter: Record<string, any> = { userId }

  const conversationId = typeof query.conversationId === 'string' ? query.conversationId.trim() : undefined
  const limitParam = typeof query.limit === 'string' ? Number(query.limit) : undefined

  if (conversationId) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw createError({ statusCode: 400, message: 'Invalid conversationId' })
    }
    filter.conversationId = new mongoose.Types.ObjectId(conversationId)
  }

  const limit = limitParam && limitParam > 0 ? Math.min(limitParam, 50) : 20

  const docs = await PracticeQuiz.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()

  return {
    success: true,
    data: docs.map((doc) => serializePracticeQuiz(doc as any)),
  }
})
