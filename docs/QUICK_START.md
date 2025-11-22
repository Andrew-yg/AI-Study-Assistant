# 🚀 Quick Start Guide

## Refactoring Complete!

The project has been successfully refactored from Supabase to MongoDB + MongoDB Atlas, using Google OAuth and JWT authentication.

## ✅ Completed Changes

### Backend
- ✅ Installed MongoDB, Mongoose, JWT, Passport and other dependencies
- ✅ Created MongoDB connection utility (`server/utils/mongodb.ts`)
- ✅ Created Cloudflare R2 storage utility (`server/utils/r2.ts`)
- ✅ Created 4 Mongoose models: User, Conversation, Message, LearningMaterial
- ✅ Implemented JWT authentication middleware (`server/utils/auth.ts`)
- ✅ Implemented Google OAuth login flow
  - `/api/auth/google` - Initiate OAuth
  - `/api/auth/google/callback` - Callback handler
  - `/api/auth/me` - Get current user
  - `/api/auth/logout` - Logout
- ✅ Refactored all API endpoints to use MongoDB
  - Conversations (CRUD)
  - Messages (CRUD)
  - Materials (CRUD)
  - Upload (using Cloudflare R2)

### Frontend
- ✅ Removed Supabase client plugin
- ✅ Refactored `composables/useAuth.ts` to use JWT
- ✅ Refactored `composables/useConversations.ts`
- ✅ Updated `pages/auth/callback.vue` to handle tokens
- ✅ Updated `components/AuthModal.vue` (removed GitHub, kept Google only)
- ✅ Created `composables/useAuthFetch.ts` helper function

### Configuration
- ✅ Updated `nuxt.config.ts`
- ✅ Created `.env.example`
- ✅ Updated `package.json`

## 📋 Next Steps

### 1. Configure Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Then fill in the following information:

```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-study-assistant

# JWT (generate a strong random key)
JWT_SECRET=your-super-secret-jwt-key

# Google OAuth (obtain from Google Cloud Console)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-key-id
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=ai-study-materials

# Application URL
BASE_URL=http://localhost:3000
```

### 2. Set Up MongoDB Atlas

1. Visit https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user
4. Add IP address to whitelist (0.0.0.0/0 for development)
5. Get the connection string

### 3. Set Up Google OAuth

1. Visit https://console.cloud.google.com/
2. Create project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID
4. Application type: Web application
5. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback`
6. Copy Client ID and Client Secret

### 4. Set Up Cloudflare R2

1. Login to Cloudflare Dashboard
2. R2 → Create bucket (`ai-study-materials`)
3. Manage R2 API Tokens → Create API Token
4. Copy Account ID, Access Key ID, Secret Access Key

### 5. Start Development Server

```bash
npm run dev
```

This command will start all four services simultaneously:

- Web application: http://localhost:3000
- RAG service: http://localhost:8001
- Agent service: http://localhost:8002
- Quiz service: http://localhost:8003

> Only want to run the frontend? Use `npm run dev:web`.

## 🧪 Testing Workflow

1. **Test Login**
   - Click "Log In" or "Sign Up"
   - Select "Continue with Google"
   - After authorization, should redirect to `/chat`

2. **Test Conversations**
   - Create new conversation
   - Send messages
   - View conversation list

3. **Test File Upload**
   - Upload PDF files
   - View materials list
   - Delete materials

## 🔍 Key Changes

### Authentication Flow
```
Old: Supabase Auth (OAuth)
  ↓
New: Google OAuth → JWT Token → localStorage
```

### Database
```
Old: PostgreSQL (Supabase)
  ↓
New: MongoDB (Atlas) + Mongoose
```

### File Storage
```
Old: Supabase Storage
  ↓
New: Cloudflare R2 (S3-compatible)
```

### Field Naming
```
Old: snake_case (user_id, created_at)
  ↓
New: camelCase (userId, createdAt)
```

## 📚 Important Files

- `server/models/` - Mongoose data models
- `server/utils/mongodb.ts` - MongoDB connection
- `server/utils/auth.ts` - JWT authentication
- `server/utils/r2.ts` - Cloudflare R2 storage
- `server/api/auth/` - Authentication API
- `composables/useAuth.ts` - Frontend authentication logic
- `MONGODB_MIGRATION.md` - Detailed migration documentation

## ⚠️ Important Notes

1. **Development Environment**: Ensure all environment variables are configured
2. **MongoDB Atlas**: Free tier has storage limit (512MB)
3. **Cloudflare R2**: Free tier includes 10GB storage per month
4. **JWT Secret**: Production environment must use a strong random key
5. **Google OAuth**: Production environment needs updated redirect URI

## 🐛 Common Issues

### 1. "Cannot connect to MongoDB"
- Check if `MONGODB_URI` is correct
- Confirm IP address is in Atlas whitelist
- Verify database user password

### 2. "Google OAuth failed"
- Confirm redirect URI matches exactly
- Check Client ID and Secret
- Ensure Google+ API is enabled

### 3. "Token expired"
- Logout and login again
- Check if `JWT_SECRET` is consistent

### 4. "R2 upload failed"
- Verify R2 credentials
- Confirm bucket name is correct
- Check file size limit (currently 10MB)

## 🎉 Complete!

The project has been fully migrated to the new architecture. See `MONGODB_MIGRATION.md` for more detailed information.

If you have issues, please check:
1. All environment variables are correctly configured
2. MongoDB, Google OAuth, R2 are properly set up
3. Review browser console and server logs

Happy coding! 🚀
