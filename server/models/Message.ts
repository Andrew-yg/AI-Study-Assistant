import mongoose from 'mongoose'

const { Schema, model, models } = mongoose

export interface IMessage {
  _id?: string
  conversationId: mongoose.Types.ObjectId | string
  role: 'user' | 'assistant'
  content: string
  createdAt?: Date
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['user', 'assistant'],
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

// Index for sorting by creation date
MessageSchema.index({ createdAt: 1 })

export const Message = (models.Message || model<IMessage>('Message', MessageSchema)) as mongoose.Model<IMessage>
