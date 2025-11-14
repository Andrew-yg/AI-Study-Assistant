import mongoose from 'mongoose'
import { z } from 'zod'

import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { LearningMaterial } from '~/server/models/LearningMaterial'
import { Question } from '~/server/models/Question'
import { serializeQuestion } from '~/server/api/questions/serializer'

const bodySchema = z.object({
  materialId: z.string().min(1),
  conversationId: z.string().optional(),
  questionType: z.enum(['multiple_choice', 'true_false', 'short_answer']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  count: z.coerce.number().int().min(1).max(10)
})

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)
  await connectDB()

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid request body', data: parsed.error.flatten() })
  }

  const { materialId, conversationId, questionType, difficulty, count } = parsed.data

  if (!mongoose.Types.ObjectId.isValid(materialId)) {
    throw createError({ statusCode: 400, message: 'Invalid materialId' })
  }

  const materialObjectId = new mongoose.Types.ObjectId(materialId)

  const material = await LearningMaterial.findOne({ _id: materialObjectId, userId })
  if (!material) {
    throw createError({ statusCode: 404, message: 'Material not found' })
  }

  let resolvedConversationId: mongoose.Types.ObjectId | null = null
  if (conversationId) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw createError({ statusCode: 400, message: 'Invalid conversationId' })
    }
    resolvedConversationId = new mongoose.Types.ObjectId(conversationId)
  } else if (material.conversationId) {
    resolvedConversationId = material.conversationId as mongoose.Types.ObjectId
  }

  const config = useRuntimeConfig()
  const quizServiceUrl = config.quizServiceUrl
  if (!quizServiceUrl) {
    throw createError({ statusCode: 500, message: 'Quiz service URL is not configured' })
  }

  const upstreamResponse = await fetch(`${quizServiceUrl}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      material_id: materialId,
      user_id: userId,
      question_type: questionType,
      difficulty,
      count
    })
  })

  if (!upstreamResponse.ok) {
    const errorText = await upstreamResponse.text().catch(() => 'Quiz service error')
    throw createError({ statusCode: 502, message: errorText })
  }

  const payload = await upstreamResponse.json()
  const questions = Array.isArray(payload.questions) ? payload.questions : []
  if (!questions.length) {
    throw createError({ statusCode: 502, message: 'Quiz service returned no questions' })
  }

  const docs = await Question.insertMany(
    questions.map((question: any) => ({
      userId,
      conversationId: resolvedConversationId,
      materialId: materialObjectId,
      question: question.question,
      questionType: question.question_type || questionType,
      options: question.options || undefined,
      correctAnswer: question.correct_answer,
      explanation: question.explanation || '',
      difficulty: (question.difficulty || difficulty).toLowerCase(),
      tags: question.tags || [],
      sourceSummary: question.source_summary || payload.material_summary || null,
    })),
    { ordered: false }
  )

  return {
    success: true,
    data: docs.map(serializeQuestion)
  }
})
