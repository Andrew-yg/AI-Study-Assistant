import mongoose from 'mongoose'

import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { PracticeQuiz } from '~/server/models/PracticeQuiz'
import { serializePracticeQuiz } from '~/server/api/practice-quizz/serializer'

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)
  await connectDB()

  const id = event.context.params?.id
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw createError({ statusCode: 400, message: 'Invalid quiz id' })
  }

  const quiz = await PracticeQuiz.findOne({
    _id: new mongoose.Types.ObjectId(id),
    userId,
  })

  if (!quiz) {
    throw createError({ statusCode: 404, message: 'Quiz not found' })
  }

  return {
    success: true,
    data: serializePracticeQuiz(quiz),
  }
})
