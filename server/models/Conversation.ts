import mongoose from 'mongoose'

const { Schema, model, models } = mongoose

export interface IConversation {
  _id?: string
  userId: mongoose.Types.ObjectId | string
  title: string
  createdAt?: Date
  updatedAt?: Date
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: 'New Chat',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

// Index for sorting by updated date
ConversationSchema.index({ updatedAt: -1 })

export const Conversation = (models.Conversation || model<IConversation>('Conversation', ConversationSchema)) as mongoose.Model<IConversation>
