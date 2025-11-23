import mongoose from 'mongoose'
import type { GraphQLContext } from '../context'
import { Conversation } from '~/server/models/Conversation'
import { Message } from '~/server/models/Message'
import { LearningMaterial } from '~/server/models/LearningMaterial'

export const conversationResolvers = {
    Query: {
        // Fetch all conversations for the authenticated user
        conversations: async (_parent: any, _args: any, context: GraphQLContext) => {
            const conversations = await Conversation.find({ userId: context.userId })
                .sort({ updatedAt: -1 })
                .lean()

            return conversations.map((conv: any) => ({
                id: conv._id.toString(),
                userId: conv.userId.toString(),
                title: conv.title,
                createdAt: conv.createdAt?.toISOString() || new Date().toISOString(),
                updatedAt: conv.updatedAt?.toISOString() || new Date().toISOString(),
            }))
        },

        // Fetch a single conversation by ID
        conversation: async (_parent: any, args: { id: string }, context: GraphQLContext) => {
            if (!mongoose.Types.ObjectId.isValid(args.id)) {
                throw new Error('Invalid conversation ID')
            }

            const conversation = await Conversation.findOne({
                _id: args.id,
                userId: context.userId,
            }).lean()

            if (!conversation) {
                return null
            }

            return {
                id: conversation._id.toString(),
                userId: conversation.userId.toString(),
                title: conversation.title,
                createdAt: conversation.createdAt?.toISOString() || new Date().toISOString(),
                updatedAt: conversation.updatedAt?.toISOString() || new Date().toISOString(),
            }
        },
    },

    Mutation: {
        // Create a new conversation
        createConversation: async (_parent: any, args: { title: string }, context: GraphQLContext) => {
            const conversation = await Conversation.create({
                userId: context.userId,
                title: args.title,
            })

            return {
                id: conversation._id.toString(),
                userId: conversation.userId.toString(),
                title: conversation.title,
                createdAt: conversation.createdAt?.toISOString() || new Date().toISOString(),
                updatedAt: conversation.updatedAt?.toISOString() || new Date().toISOString(),
            }
        },

        // Update conversation title
        updateConversation: async (_parent: any, args: { id: string; title: string }, context: GraphQLContext) => {
            if (!mongoose.Types.ObjectId.isValid(args.id)) {
                throw new Error('Invalid conversation ID')
            }

            const conversation = await Conversation.findOneAndUpdate(
                { _id: args.id, userId: context.userId },
                { title: args.title, updatedAt: new Date() },
                { new: true }
            ).lean()

            if (!conversation) {
                throw new Error('Conversation not found')
            }

            return {
                id: conversation._id.toString(),
                userId: conversation.userId.toString(),
                title: conversation.title,
                createdAt: conversation.createdAt?.toISOString() || new Date().toISOString(),
                updatedAt: conversation.updatedAt?.toISOString() || new Date().toISOString(),
            }
        },

        // Delete a conversation
        deleteConversation: async (_parent: any, args: { id: string }, context: GraphQLContext) => {
            if (!mongoose.Types.ObjectId.isValid(args.id)) {
                throw new Error('Invalid conversation ID')
            }

            const result = await Conversation.deleteOne({
                _id: args.id,
                userId: context.userId,
            })

            // Also delete associated messages and materials
            await Promise.all([
                Message.deleteMany({ conversationId: args.id }),
                LearningMaterial.deleteMany({ conversationId: args.id }),
            ])

            return result.deletedCount > 0
        },
    },

    Conversation: {
        // Nested resolver: fetch messages for a conversation
        messages: async (parent: any, _args: any, context: GraphQLContext) => {
            const messages = await Message.find({
                conversationId: parent.id,
            })
                .sort({ createdAt: 1 })
                .lean()

            return messages.map((msg: any) => ({
                id: msg._id.toString(),
                conversationId: msg.conversationId.toString(),
                role: msg.role,
                content: msg.content,
                createdAt: msg.createdAt.toISOString(),
            }))
        },

        // Nested resolver: fetch materials for a conversation
        materials: async (parent: any, _args: any, context: GraphQLContext) => {
            const materials = await LearningMaterial.find({
                conversationId: parent.id,
                userId: context.userId,
            })
                .sort({ createdAt: -1 })
                .lean()

            return materials.map((mat: any) => ({
                id: mat._id.toString(),
                userId: mat.userId.toString(),
                conversationId: mat.conversationId?.toString() || null,
                courseName: mat.courseName,
                materialType: mat.materialType,
                description: mat.description,
                filePath: mat.filePath,
                fileSize: mat.fileSize,
                originalFilename: mat.originalFilename,
                processingStatus: mat.processingStatus,
                createdAt: mat.createdAt?.toISOString() || new Date().toISOString(),
                updatedAt: mat.updatedAt?.toISOString() || new Date().toISOString(),
            }))
        },
    },
}
