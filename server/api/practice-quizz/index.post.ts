import mongoose from 'mongoose'
import { z } from 'zod'

import { requireAuth } from '~/server/utils/auth'
import { connectDB } from '~/server/utils/mongodb'
import { Conversation } from '~/server/models/Conversation'
import { LearningMaterial } from '~/server/models/LearningMaterial'
import { PracticeQuiz } from '~/server/models/PracticeQuiz'
import type { ILearningMaterial } from '~/server/models/LearningMaterial'
import { serializePracticeQuiz } from '~/server/api/practice-quizz/serializer'
import { downloadFromR2 } from '~/server/utils/r2'
import { processMaterialWithRag } from '~/server/utils/rag'
import { ensureServiceHealthy } from '~/server/utils/serviceHealth'

const fetchProcessedMaterials = async (conversationObjectId: mongoose.Types.ObjectId, userObjectId: mongoose.Types.ObjectId) => {
  return await LearningMaterial.find({
    conversationId: conversationObjectId,
    userId: userObjectId,
    processingStatus: 'processed',
  })
    .select('_id')
    .lean()
}

const reprocessMaterialsIfNeeded = async (conversationObjectId: mongoose.Types.ObjectId, userObjectId: mongoose.Types.ObjectId) => {
  await ensureServiceHealthy('rag')

  const allMaterials = await LearningMaterial.find({
    conversationId: conversationObjectId,
    userId: userObjectId,
  }).lean()

  if (!allMaterials.length) {
    return { processed: [], total: 0 }
  }

  const reprocessable = allMaterials.filter((material) => ['failed', 'pending'].includes(material.processingStatus || 'pending'))

  for (const material of reprocessable) {
    try {
      await LearningMaterial.findByIdAndUpdate(material._id, {
        processingStatus: 'processing',
        processingError: null,
      })

      const fileBuffer = await downloadFromR2(material.filePath)
      const ragResult = await processMaterialWithRag(material as unknown as ILearningMaterial, fileBuffer)

      await LearningMaterial.findByIdAndUpdate(material._id, {
        processingStatus: 'processed',
        processedAt: new Date(),
        vectorDocumentCount: ragResult.documents,
      })
    } catch (error: any) {
      console.error('[PracticeQuiz] Reprocessing failed for material', material._id, error)
      await LearningMaterial.findByIdAndUpdate(material._id, {
        processingStatus: 'failed',
        processingError: error?.message || 'Unknown error',
      })
    }
  }

  const processed = await fetchProcessedMaterials(conversationObjectId, userObjectId)
  return { processed, total: allMaterials.length }
}

const bodySchema = z.object({
  conversationId: z.string().min(1),
  questionType: z.enum(['multiple_choice', 'true_false', 'short_answer']).default('multiple_choice'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  count: z.coerce.number().int().min(1).max(10).default(5),
})

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event)
  await connectDB()

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw createError({ statusCode: 401, message: 'Invalid user session' })
  }

  const userObjectId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(userId)

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid request body', data: parsed.error.flatten() })
  }

  const { conversationId, questionType, difficulty, count } = parsed.data

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw createError({ statusCode: 400, message: 'Invalid conversationId' })
  }

  const conversation = await Conversation.findOne({
    _id: new mongoose.Types.ObjectId(conversationId),
    userId: userObjectId,
  })

  if (!conversation) {
    throw createError({ statusCode: 404, message: 'Conversation not found' })
  }

  const conversationObjectId = new mongoose.Types.ObjectId(conversation._id)

  let materialDocs = await fetchProcessedMaterials(conversationObjectId, userObjectId)

  if (!materialDocs.length) {
    const { processed, total } = await reprocessMaterialsIfNeeded(conversationObjectId, userObjectId)
    materialDocs = processed

    if (!materialDocs.length) {
      if (total === 0) {
        throw createError({ statusCode: 400, message: 'No learning materials found for this conversation' })
      }

      throw createError({
        statusCode: 409,
        message: 'Materials are still being processed. Please try again in a moment.',
      })
    }
  }

  const materialIds = materialDocs.map((doc) => new mongoose.Types.ObjectId(doc._id))

  const config = useRuntimeConfig()
  const quizServiceUrl = config.quizServiceUrl
  if (!quizServiceUrl) {
    throw createError({ statusCode: 500, message: 'Quiz service URL is not configured' })
  }

  await ensureServiceHealthy('quiz')

  const upstreamResponse = await fetch(`${quizServiceUrl}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      material_ids: materialIds.map((id) => id.toString()),
      user_id: userId,
      question_type: questionType,
      difficulty,
      count,
    }),
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

  const doc = await PracticeQuiz.create({
  userId: userObjectId,
  conversationId: conversationObjectId,
    materialIds,
    questionType,
    difficulty,
    count,
    materialSummary: payload.material_summary || '',
    questions: questions.map((question: any, index: number) => ({
      order: index,
      question: question.question,
      questionType: question.question_type || questionType,
      options: question.options || undefined,
      correctAnswer: question.correct_answer,
      explanation: question.explanation || '',
      difficulty: (question.difficulty || difficulty).toLowerCase(),
      tags: question.tags || [],
    })),
  })

  return {
    success: true,
    data: serializePracticeQuiz(doc),
  }
})
