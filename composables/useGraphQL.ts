import { useQuery, useMutation } from '@urql/vue'
import type { Ref } from 'vue'

export interface GraphQLConversation {
    id: string
    userId: string
    title: string
    createdAt: string
    updatedAt: string
    messages?: GraphQLMessage[]
    materials?: GraphQLMaterial[]
}

export interface GraphQLMaterial {
    id: string
    userId: string
    conversationId: string | null
    courseName: string
    materialType: string
    description: string
    filePath: string
    fileSize: number
    originalFilename: string
    processingStatus: string
    createdAt: string
    updatedAt: string
}

export interface GraphQLMessage {
    id: string
    conversationId: string
    role: string
    content: string
    createdAt: string
}

export const useGraphQL = () => {
    /**
     * Fetch all conversations for the authenticated user
     */
    const fetchConversations = () => {
        const query = `
      query GetConversations {
        conversations {
          id
          userId
          title
          createdAt
          updatedAt
        }
      }
    `

        return useQuery<{ conversations: GraphQLConversation[] }>({
            query,
        })
    }

    /**
     * Fetch a single conversation with nested messages and materials
     */
    const fetchConversationDetail = (conversationId: Ref<string | null>) => {
        const query = `
      query GetConversationDetail($id: ID!) {
        conversation(id: $id) {
          id
          userId
          title
          createdAt
          updatedAt
          messages {
            id
            role
            content
            createdAt
          }
          materials {
            id
            originalFilename
            courseName
            fileSize
            materialType
            processingStatus
            createdAt
          }
        }
      }
    `

        return useQuery<{ conversation: GraphQLConversation | null }>({
            query,
            variables: computed(() => ({ id: conversationId.value })),
            pause: computed(() => !conversationId.value),
        })
    }

    /**
     * Fetch materials with optional conversation filter
     */
    const fetchMaterials = (conversationId?: Ref<string | null>) => {
        const query = `
      query GetMaterials($conversationId: ID) {
        materials(conversationId: $conversationId) {
          id
          originalFilename
          courseName
          fileSize
          materialType
          processingStatus
          createdAt
        }
      }
    `

        return useQuery<{ materials: GraphQLMaterial[] }>({
            query,
            variables: conversationId ? computed(() => ({ conversationId: conversationId.value })) : {},
        })
    }

    /**
     * Fetch messages for a conversation
     */
    const fetchMessages = (conversationId: Ref<string | null>) => {
        const query = `
      query GetMessages($conversationId: ID!) {
        messages(conversationId: $conversationId) {
          id
          role
          content
          createdAt
        }
      }
    `

        return useQuery<{ messages: GraphQLMessage[] }>({
            query,
            variables: computed(() => ({ conversationId: conversationId.value })),
            pause: computed(() => !conversationId.value),
        })
    }

    /**
     * Create a new conversation
     */
    const createConversation = () => {
        const mutation = `
      mutation CreateConversation($title: String!) {
        createConversation(title: $title) {
          id
          userId
          title
          createdAt
          updatedAt
        }
      }
    `

        return useMutation<
            { createConversation: GraphQLConversation },
            { title: string }
        >(mutation)
    }

    /**
     * Update conversation title
     */
    const updateConversation = () => {
        const mutation = `
      mutation UpdateConversation($id: ID!, $title: String!) {
        updateConversation(id: $id, title: $title) {
          id
          title
          updatedAt
        }
      }
    `

        return useMutation<
            { updateConversation: GraphQLConversation },
            { id: string; title: string }
        >(mutation)
    }

    /**
     * Delete a conversation
     */
    const deleteConversation = () => {
        const mutation = `
      mutation DeleteConversation($id: ID!) {
        deleteConversation(id: $id)
      }
    `

        return useMutation<{ deleteConversation: boolean }, { id: string }>(mutation)
    }

    return {
        // Queries
        fetchConversations,
        fetchConversationDetail,
        fetchMaterials,
        fetchMessages,

        // Mutations
        createConversation,
        updateConversation,
        deleteConversation,
    }
}
