import mongoose from 'mongoose'

const { Schema, model, models } = mongoose

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer'
export type QuestionDifficulty = 'easy' | 'medium' | 'hard'

export interface IQuestion {
  _id?: string
  userId: mongoose.Types.ObjectId | string
  conversationId?: mongoose.Types.ObjectId | string | null
  materialId: mongoose.Types.ObjectId | string
  question: string
  questionType: QuestionType
  options?: string[]
  correctAnswer: string
  explanation: string
  difficulty: QuestionDifficulty
  tags?: string[]
  sourceSummary?: string | null
  attempts?: number
  correctAttempts?: number
  createdAt?: Date
  updatedAt?: Date
}

const QuestionSchema = new Schema<IQuestion>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
      index: true,
    },
    materialId: {
      type: Schema.Types.ObjectId,
      ref: 'LearningMaterial',
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    questionType: {
      type: String,
      enum: ['multiple_choice', 'true_false', 'short_answer'],
      required: true,
    },
    options: {
      type: [String],
      default: undefined,
    },
    correctAnswer: {
      type: String,
      required: true,
      trim: true,
    },
    explanation: {
      type: String,
      default: '',
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    tags: {
      type: [String],
      default: [],
    },
    sourceSummary: {
      type: String,
      default: null,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    correctAttempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

QuestionSchema.index({ userId: 1, createdAt: -1 })
QuestionSchema.index({ userId: 1, materialId: 1 })

export const Question = (models.Question || model<IQuestion>('Question', QuestionSchema)) as mongoose.Model<IQuestion>
