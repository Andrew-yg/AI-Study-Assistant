import mongoose from 'mongoose'

const { Schema, model, models } = mongoose

export type MaterialType = 'lecture' | 'textbook' | 'slides' | 'assignment' | 'other'

export interface ILearningMaterial {
  _id?: string
  userId: mongoose.Types.ObjectId | string
  conversationId?: mongoose.Types.ObjectId | string | null
  courseName: string
  materialType: MaterialType
  description: string
  filePath: string
  fileSize: number
  originalFilename: string
  createdAt?: Date
  updatedAt?: Date
}

const LearningMaterialSchema = new Schema<ILearningMaterial>(
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
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    materialType: {
      type: String,
      required: true,
      enum: ['lecture', 'textbook', 'slides', 'assignment', 'other'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// Index for sorting by creation date
LearningMaterialSchema.index({ createdAt: -1 })

export const LearningMaterial = (models.LearningMaterial || model<ILearningMaterial>('LearningMaterial', LearningMaterialSchema)) as mongoose.Model<ILearningMaterial>
