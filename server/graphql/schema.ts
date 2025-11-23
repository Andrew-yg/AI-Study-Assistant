export const typeDefs = `#graphql
  type Conversation {
    id: ID!
    userId: ID!
    title: String!
    createdAt: String!
    updatedAt: String!
    messages: [Message!]!
    materials: [Material!]!
  }

  type Material {
    id: ID!
    userId: ID!
    conversationId: ID
    courseName: String!
    materialType: String!
    description: String!
    filePath: String!
    fileSize: Int!
    originalFilename: String!
    processingStatus: String!
    createdAt: String!
    updatedAt: String!
  }

  type Message {
    id: ID!
    conversationId: ID!
    role: String!
    content: String!
    createdAt: String!
  }

  type Query {
    # Fetch all conversations for the authenticated user
    conversations: [Conversation!]!
    
    # Fetch a single conversation by ID
    conversation(id: ID!): Conversation
    
    # Fetch materials with optional conversation filter
    materials(conversationId: ID): [Material!]!
    
    # Fetch material by ID
    material(id: ID!): Material
    
    # Fetch messages for a conversation
    messages(conversationId: ID!): [Message!]!
  }

  type Mutation {
    # Create a new conversation
    createConversation(title: String!): Conversation!
    
    # Update conversation title
    updateConversation(id: ID!, title: String!): Conversation!
    
    # Delete a conversation
    deleteConversation(id: ID!): Boolean!
  }
`
