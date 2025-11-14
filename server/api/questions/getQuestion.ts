import mongoose from 'mongoose'
import { Question } from '~/server/models/Question'

export const findQuestionOrThrow = async (id: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError({ statusCode: 400, message: 'Invalid question id' })
  }

  const question = await Question.findOne({ _id: id, userId })
  if (!question) {
    throw createError({ statusCode: 404, message: 'Question not found' })
  }

  return question
}
