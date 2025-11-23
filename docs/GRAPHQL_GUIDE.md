# GraphQL Integration - Quick Start Guide

## 🚀 Quick Start

### 1. Access GraphQL Playground

Start the development server:
```bash
npm run dev
```

Open your browser to:
```
http://localhost:3001/api/graphql
```

### 2. Example GraphQL Queries

#### Query all conversations
```graphql
query {
  conversations {
    id
    title
    updatedAt
  }
}
```

#### Query conversation with nested data
```graphql
query GetConversationDetail($id: ID!) {
  conversation(id: $id) {
    id
    title
    messages {
      id
      role
      content
    }
    materials {
      id
      originalFilename
      courseName
    }
  }
}
```

#### Create a new conversation
```graphql
mutation {
  createConversation(title: "My GraphQL Chat") {
    id
    title
    createdAt
  }
}
```

### 3. Authentication

All GraphQL requests require JWT authentication. In GraphQL Playground:

1. Get your JWT token (sign in via Google OAuth)
2. Add to HTTP Headers:
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN_HERE"
}
```

### 4. Demo Page

Visit the interactive demo page:
```
http://localhost:3001/graphql-demo
```

This page demonstrates:
- ✅ GraphQL Query #1: Fetching conversations list
- ✅ GraphQL Query #2: Fetching conversation details with nested data
- ✅ GraphQL Mutation: Creating new conversations

---

## 📂 Key Files

| File | Purpose |
|------|---------|
| `server/api/graphql.ts` | GraphQL endpoint |
| `server/graphql/schema.ts` | Type definitions |
| `server/graphql/resolvers/` | Query/Mutation resolvers |
| `composables/useGraphQL.ts` | Frontend GraphQL composable |
| `pages/graphql-demo.vue` | Interactive demo page |

---

## ✅ Verification Checklist

- [x] GraphQL endpoint running at `/api/graphql`
- [x] GraphiQL playground accessible
- [x] Authentication working (JWT)
- [x] 9 resolvers implemented (6 queries + 3 mutations)
- [x] Frontend demo page with 2+ GraphQL calls
- [x] REST API unchanged and working
- [x] TypeScript types throughout
- [x] No breaking changes

---

## 🔄 REST vs GraphQL

**Use REST for:**
- File uploads
- Streaming responses (SSE chat)
- WebSocket connections

**Use GraphQL for:**
- Fetching nested data
- Flexible client-side queries
- Reducing over-fetching
- Type-safe queries

Both APIs share the same:
- ✅ Database (MongoDB)
- ✅ Authentication (JWT)
- ✅ Mongoose models
- ✅ Validation logic
