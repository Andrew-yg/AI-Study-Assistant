import mongoose from 'mongoose'

const { Schema, model, models } = mongoose

export type PracticeQuizStatus = 'generated' | 'completed'
export type PracticeQuizQuestionType = 'multiple_choice' | 'true_false' | 'short_answer'
export type PracticeQuizDifficulty = 'easy' | 'medium' | 'hard'

export interface IPracticeQuizQuestion {
  _id?: mongoose.Types.ObjectId
  order: number
  question: string
  questionType: PracticeQuizQuestionType
  options?: string[]
  correctAnswer: string
  explanation?: string
  difficulty: PracticeQuizDifficulty
  tags?: string[]
}

export interface IPracticeQuizSubmissionAnswer {
  questionId: mongoose.Types.ObjectId
  userAnswer: string
  isCorrect: boolean
  feedback: string
  score: number
  correctAnswer: string
}

export interface IPracticeQuizSubmission {
  submittedAt: Date
  summary: {
    correct: number
    total: number
    score: number
  }
  answers: IPracticeQuizSubmissionAnswer[]
}

export interface IPracticeQuiz {
  _id?: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  conversationId: mongoose.Types.ObjectId
  materialIds: mongoose.Types.ObjectId[]
  questionType: PracticeQuizQuestionType
  difficulty: PracticeQuizDifficulty
  count: number
  status: PracticeQuizStatus
  materialSummary?: string | null
  questions: IPracticeQuizQuestion[]
  submissions: IPracticeQuizSubmission[]
  createdAt?: Date
  updatedAt?: Date
}

const PracticeQuizQuestionSchema = new Schema<IPracticeQuizQuestion>(
  {
    order: { type: Number, default: 0 },
    question: { type: String, required: true },
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
    },
    explanation: {
      type: String,
      default: '',
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
  },
  { _id: true }
)

const PracticeQuizSubmissionSchema = new Schema<IPracticeQuizSubmission>(
  {
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    summary: {
      correct: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      score: { type: Number, default: 0 },
    },
    answers: [
      new Schema<IPracticeQuizSubmissionAnswer>(
        {
          questionId: {
            type: Schema.Types.ObjectId,
            required: true,
          },
          userAnswer: {
            type: String,
            default: '',
          },
          isCorrect: {
            type: Boolean,
            default: false,
          },
          feedback: {
            type: String,
            default: '',
          },
          score: {
            type: Number,
            default: 0,
          },
          correctAnswer: {
            type: String,
            required: true,
          },
        },
        { _id: false }
      ),
    ],
  },
  { _id: false }
)

const PracticeQuizSchema = new Schema<IPracticeQuiz>(
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
      required: true,
      index: true,
    },
    materialIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'LearningMaterial',
        index: true,
      },
    ],
    questionType: {
      type: String,
      enum: ['multiple_choice', 'true_false', 'short_answer'],
      default: 'multiple_choice',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    count: {
      type: Number,
      default: 5,
    },
    status: {
      type: String,
      enum: ['generated', 'completed'],
      default: 'generated',
    },
    materialSummary: {
      type: String,
      default: '',
    },
    questions: [PracticeQuizQuestionSchema],
    submissions: [PracticeQuizSubmissionSchema],
  },
  {
    timestamps: true,
    collection: 'practice_quizz',
  }
)

PracticeQuizSchema.index({ userId: 1, conversationId: 1, createdAt: -1 })
PracticeQuizSchema.index({ userId: 1, createdAt: -1 })

export const PracticeQuiz = (models.PracticeQuiz || model<IPracticeQuiz>('PracticeQuiz', PracticeQuizSchema)) as mongoose.Model<IPracticeQuiz>
