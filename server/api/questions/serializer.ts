export const serializeQuestion = (doc: any) => ({
  id: doc._id.toString(),
  userId: doc.userId.toString(),
  conversationId: doc.conversationId ? doc.conversationId.toString() : null,
  materialId: doc.materialId.toString(),
  question: doc.question,
  questionType: doc.questionType,
  options: doc.options || [],
  correctAnswer: doc.correctAnswer,
  explanation: doc.explanation,
  difficulty: doc.difficulty,
  tags: doc.tags || [],
  sourceSummary: doc.sourceSummary || null,
  attempts: doc.attempts || 0,
  correctAttempts: doc.correctAttempts || 0,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
})
