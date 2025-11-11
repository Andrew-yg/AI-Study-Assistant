import mongoose from 'mongoose'

const { Schema, model, models } = mongoose

export interface IUser {
  _id?: string
  googleId: string
  email: string
  name: string
  avatar?: string
  createdAt?: Date
  updatedAt?: Date
}

const UserSchema = new Schema<IUser>(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

// Prevent model overwrite upon hot reload
export const User = (models.User || model<IUser>('User', UserSchema)) as mongoose.Model<IUser>
