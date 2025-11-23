import { conversationResolvers } from './conversation'
import { materialResolvers } from './material'
import { messageResolvers } from './message'

// Merge all resolvers
export const resolvers = {
    Query: {
        ...conversationResolvers.Query,
        ...materialResolvers.Query,
        ...messageResolvers.Query,
    },
    Mutation: {
        ...conversationResolvers.Mutation,
    },
    Conversation: {
        ...conversationResolvers.Conversation,
    },
}
