# AI Study Assistant - MongoDB Refactored

This project has been refactored from Supabase (PostgreSQL) to MongoDB + MongoDB Atlas with Google OAuth authentication.

## 🚀 Tech Stack

- **Frontend**: Nuxt 3 (Vue 3)
- **Database**: MongoDB + MongoDB Atlas
- **Authentication**: Google OAuth 2.0 + JWT
- **File Storage**: Cloudflare R2 (S3-compatible)
- **ODM**: Mongoose

## 📋 Prerequisites

1. **MongoDB Atlas Account**
   - Create a cluster at https://www.mongodb.com/cloud/atlas
   - Get your connection string

2. **Google Cloud Console**
   - Create OAuth 2.0 credentials
   - Authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
   - For production: `https://yourdomain.com/api/auth/google/callback`

3. **Cloudflare R2**
   - Create an R2 bucket
   - Get Access Key ID and Secret Access Key
   - Get Account ID

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-study-assistant?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cloudflare R2
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=ai-study-materials

# App
BASE_URL=http://localhost:3000
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/google/callback`
   - Production: `https://yourdomain.com/api/auth/google/callback`
7. Copy Client ID and Client Secret to `.env`

### 4. MongoDB Atlas Setup

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (Free tier available)
3. **Database Access**: Create a database user
4. **Network Access**: Add your IP address (or 0.0.0.0/0 for development)
5. Click **Connect** → **Connect your application**
6. Copy the connection string and replace `<password>` with your database user password
7. Paste into `.env` as `MONGODB_URI`

### 5. Cloudflare R2 Setup

1. Log in to Cloudflare Dashboard
2. Go to **R2** → **Create bucket**
3. Bucket name: `ai-study-materials` (or your choice)
4. Go to **Manage R2 API Tokens** → **Create API token**
5. Copy Account ID, Access Key ID, and Secret Access Key to `.env`

### 6. Run Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

## 🏗️ Project Structure

```
server/
├── models/
│   ├── User.ts              # User model (Google OAuth)
│   ├── Conversation.ts      # Chat conversations
│   ├── Message.ts           # Chat messages
│   └── LearningMaterial.ts  # Uploaded PDF materials
├── utils/
│   ├── mongodb.ts           # MongoDB connection
│   ├── auth.ts              # JWT authentication
│   └── r2.ts                # Cloudflare R2 storage
└── api/
    ├── auth/
    │   ├── google.get.ts          # Initiate Google OAuth
    │   ├── google/callback.get.ts # Handle OAuth callback
    │   ├── me.get.ts              # Get current user
    │   └── logout.post.ts         # Logout
    ├── conversations/             # CRUD for conversations
    ├── messages/                  # CRUD for messages
    ├── materials/                 # CRUD for materials
    └── upload.post.ts            # File upload to R2

composables/
├── useAuth.ts              # Authentication composable
├── useConversations.ts     # Conversations/messages API
└── useAuthFetch.ts         # Authenticated fetch helper
```

## 🔐 Authentication Flow

1. User clicks "Continue with Google"
2. Redirected to Google OAuth consent screen
3. After approval, Google redirects to `/api/auth/google/callback`
4. Server exchanges code for user info
5. Server creates/updates user in MongoDB
6. Server generates JWT token
7. Redirects to `/auth/callback?token=xxx`
8. Frontend stores token in localStorage
9. Frontend uses token for all API requests

## 📊 Data Models

### User
```typescript
{
  googleId: string      // Unique Google ID
  email: string         // User email
  name: string          // Display name
  avatar: string        // Profile picture URL
  createdAt: Date
  updatedAt: Date
}
```

### Conversation
```typescript
{
  userId: ObjectId      // Reference to User
  title: string         // Chat title
  createdAt: Date
  updatedAt: Date
}
```

### Message
```typescript
{
  conversationId: ObjectId  // Reference to Conversation
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}
```

### LearningMaterial
```typescript
{
  userId: ObjectId          // Reference to User
  conversationId: ObjectId  // Optional reference
  courseName: string
  materialType: 'lecture' | 'textbook' | 'slides' | 'assignment' | 'other'
  description: string
  filePath: string          // R2 object key
  fileSize: number          // Bytes
  originalFilename: string
  createdAt: Date
  updatedAt: Date
}
```

## 🔧 API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Conversations
- `GET /api/conversations` - List all user conversations
- `POST /api/conversations` - Create new conversation
- `PUT /api/conversations/:id` - Update conversation title
- `DELETE /api/conversations/:id` - Delete conversation

### Messages
- `GET /api/messages/:conversationId` - Get messages for conversation
- `POST /api/messages` - Create new message

### Materials
- `GET /api/materials` - List all user materials
- `GET /api/materials/:id` - Get specific material
- `PUT /api/materials/:id` - Update material metadata
- `DELETE /api/materials/:id` - Delete material (+ R2 file)
- `POST /api/upload` - Upload PDF to R2

## 🚀 Deployment

### Environment Variables for Production

Make sure to set all environment variables in your hosting platform:
- MongoDB URI with production credentials
- Google OAuth credentials with production redirect URI
- Cloudflare R2 credentials
- JWT_SECRET (generate a strong random secret)
- BASE_URL (your production domain)

### Recommended Platforms
- **Vercel** (recommended for Nuxt 3)
- **Netlify**
- **Railway**
- **Render**

## 📝 Migration Notes

### Changes from Supabase

1. **Authentication**: Supabase Auth → Google OAuth + JWT
2. **Database**: PostgreSQL → MongoDB
3. **Storage**: Supabase Storage → Cloudflare R2
4. **Row Level Security**: Database RLS → Application-level JWT verification
5. **Field Names**: snake_case → camelCase

### Benefits

✅ More control over authentication flow
✅ No vendor lock-in
✅ Flexible NoSQL schema
✅ Lower storage costs with R2
✅ JWT-based stateless authentication

## 🐛 Troubleshooting

### "No authentication token available"
- Make sure you're logged in
- Check if token exists in localStorage
- Try logging out and back in

### "Failed to connect to MongoDB"
- Verify MONGODB_URI in `.env`
- Check MongoDB Atlas network access settings
- Ensure IP is whitelisted

### "Google OAuth error"
- Verify redirect URI matches exactly
- Check Google Cloud Console credentials
- Ensure Google+ API is enabled

### "R2 upload failed"
- Verify R2 credentials in `.env`
- Check bucket name is correct
- Ensure bucket exists in Cloudflare

## 📚 Learn More

- [Nuxt 3 Documentation](https://nuxt.com/)
- [MongoDB Atlas](https://www.mongodb.com/docs/atlas/)
- [Mongoose ODM](https://mongoosejs.com/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)

## 📄 License

MIT
