import type { IPracticeQuiz } from '~/server/models/PracticeQuiz'

interface SerializeOptions {
  revealAnswers?: boolean
}

export const serializePracticeQuiz = (doc: IPracticeQuiz, options: SerializeOptions = {}) => {
  const { revealAnswers = false } = options
  return {
    id: doc._id?.toString() || '',
    userId: doc.userId?.toString(),
    conversationId: doc.conversationId?.toString() || null,
    materialIds: (doc.materialIds || []).map(id => id.toString()),
    questionType: doc.questionType,
    difficulty: doc.difficulty,
    count: doc.count,
    status: doc.status,
    materialSummary: doc.materialSummary || '',
    questions: (doc.questions || []).map(question => ({
      id: question._id?.toString() || '',
      order: question.order,
      question: question.question,
      questionType: question.questionType,
      options: question.options || [],
      difficulty: question.difficulty,
      tags: question.tags || [],
      explanation: question.explanation || '',
      sourceSummary: question.sourceSummary || '',
      ...(revealAnswers ? { correctAnswer: question.correctAnswer } : {}),
    })),
    submissions: (doc.submissions || []).map(submission => ({
      submittedAt: submission.submittedAt,
      summary: submission.summary,
      answers: submission.answers.map(answer => ({
        questionId: answer.questionId.toString(),
        userAnswer: answer.userAnswer,
        isCorrect: answer.isCorrect,
        feedback: answer.feedback,
        score: answer.score,
        correctAnswer: answer.correctAnswer,
      })),
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}
