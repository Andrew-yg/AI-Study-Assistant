# 🚀 How to Run the Project

## ✅ Current Status

Your project is **fully configured** and ready to run!

- ✅ MongoDB connection configured
- ✅ Google OAuth configured
- ✅ All dependencies installed
- ✅ `npm run dev` starts Nuxt + RAG + Agent + Quiz services simultaneously
- ✅ Development server runs at **http://localhost:3000**

---

## 📍 Accessing the Application

The project is ready to run!

### Local Access
Open your browser and visit:
```
http://localhost:3000
```

### Network Access (same LAN devices)
```
http://172.20.10.175:3000
```

---

## 🔍 Testing Endpoints

### 1. Health Check
Test if MongoDB connection is working:
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-11-10T..."
}
```

### 2. Google Login
Visit in your browser:
```
http://localhost:3000
```
Click the "Sign in with Google" button to test the OAuth flow.

---

## 📝 Important Notes

### ⚠️ Cloudflare R2 Configuration
The current `.env` file has R2 placeholders:
```env
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=ai-study-materials
```

**File upload functionality requires R2 configuration** to work. If you need to test file uploads now, please:

#### Configure Cloudflare R2:
1. Login to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to R2 Object Storage
3. Create bucket (name: `ai-study-materials`)
4. Generate API tokens (read/write permissions)
5. Update R2 configuration in `.env` file

### ✅ Features You Can Test

#### Features without R2 (test immediately):
- ✅ Google OAuth login/logout
- ✅ Create conversations
- ✅ Send messages (with Agent replies, requires python agent-service running)
- ✅ View conversation list
- ✅ Update conversation titles
- ✅ Delete conversations

#### Features requiring R2 (test after configuration):
- ⏸️ Upload PDF files
- ⏸️ Download material files
- ⏸️ Delete material files

---

## 🔧 Common Commands

### Stop Server
```bash
# Press Ctrl+C to stop the current terminal server
# Or kill all nuxt processes
pkill -f "nuxt dev"
```

### Restart Server
```bash
npm run dev   # Start Nuxt and all Python services simultaneously
```

### Start Individual Python Services
> `npm run dev` automatically starts all Python services. Use the following commands only when debugging individually.

```bash
npm run dev:rag    # Port http://localhost:8001
npm run dev:agent  # Port http://localhost:8002
npm run dev:quiz   # Port http://localhost:8003
```
All services depend on `OPENAI_API_KEY` in `.env`, Agent additionally uses `BRAVE_SEARCH_API_KEY`.

### Run End-to-End Tests

Complete UI flow (chat + Telemetry + Quiz panel) is now covered by Playwright. No need to start Python microservices—tests will start Nuxt Dev Server locally and intercept API requests to generate mock data.

```bash
# First run requires browser installation
npx playwright install

# Execute tests
npm run test:e2e

# View latest report (optional)
npx playwright show-report
```

> Playwright automatically starts Nuxt on port `3100`. If you've manually run `npm run dev:web`, it can reuse the existing instance.

### Install Dependencies (if needed)
```bash
npm install
```

### Build Production Version
```bash
npm run build
```

### Preview Production Version
```bash
npm run preview
```

---

## 🐛 Common Issues

### Port Already in Use
If you see a port conflict error, Nuxt will automatically use another port (like 3000).

### WebSocket Error
```
ERROR  WebSocket server error: Port 24678 is already in use
```
This is a VS Code HMR (hot reload) port conflict, **does not affect application operation**, can be ignored.

### MongoDB Connection Failed
Check:
1. Is MongoDB Atlas cluster running
2. Is IP address added to whitelist (or use `0.0.0.0/0` to allow all)
3. Is `MONGODB_URI` in `.env` correct

### Google OAuth Failed
Check:
1. Does Google OAuth redirect URI include `http://localhost:3000/api/auth/google/callback`
2. Are `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env` correct
3. Are necessary APIs enabled in Google Cloud project

---

## 📊 API Endpoint List

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Conversations
- `GET /api/conversations` - Get all conversations
- `POST /api/conversations` - Create conversation
- `PUT /api/conversations/:id` - Update conversation
- `DELETE /api/conversations/:id` - Delete conversation

### Messages / Agent
- `GET /api/messages/:conversationId` - Get conversation messages
- `POST /api/messages` - Create system message (e.g., upload notification)
- `POST /api/agent/chat` - Call AI Agent (automatically calls RAG + Brave Search)

### Materials
- `GET /api/materials` - Get all materials
- `GET /api/materials/:id` - Get single material
- `POST /api/materials` - Create material record
- `PUT /api/materials/:id` - Update material
- `DELETE /api/materials/:id` - Delete material
- `POST /api/upload` - Upload file to R2

### System
- `GET /api/health` - Health check

---

## 🎯 Next Steps

### Can Do Immediately:
1. ✅ Open http://localhost:3000 in browser
2. ✅ Test Google login
3. ✅ Create conversations and send messages
4. ✅ Test conversation CRUD operations

### Configure Later:
1. ⏸️ Configure Cloudflare R2
2. ⏸️ Test file upload functionality
3. ⏸️ Deploy to production environment

---

## 📚 Related Documentation

- `QUICK_START.md` - Quick start guide
- `MONGODB_MIGRATION.md` - Complete migration documentation
- `REFACTOR_SUMMARY.md` - Refactoring summary
- `.env.example` - Environment variables template

---

## ✨ Enjoy!

The project is ready—start exploring! 🚀
