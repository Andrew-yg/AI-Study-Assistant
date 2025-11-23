import mongoose from 'mongoose'
import type { GraphQLContext } from '../context'
import { Message } from '~/server/models/Message'

export const messageResolvers = {
    Query: {
        // Fetch messages for a conversation
        messages: async (
            _parent: any,
            args: { conversationId: string },
            context: GraphQLContext
        ) => {
            if (!mongoose.Types.ObjectId.isValid(args.conversationId)) {
                throw new Error('Invalid conversation ID')
            }

            const messages = await Message.find({
                conversationId: args.conversationId,
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
    },
}
