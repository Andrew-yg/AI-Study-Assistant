# 📂 Project Structure

```
AI-Study-Assistant/
├── 📄 README.md                    # Main project documentation
├── 📄 package.json                 # Node.js dependencies & scripts
├── 📄 nuxt.config.ts              # Nuxt configuration
├── 📄 tsconfig.json               # TypeScript configuration
├── 📄 playwright.config.ts        # E2E testing configuration
├── 📄 .env.example                # Environment variables template
│
├── 📁 docs/                       # 📚 All project documentation
│   ├── README.md                  # Documentation index
│   ├── QUICK_START.md            # Quick start guide
│   ├── HOW_TO_RUN.md             # Detailed run instructions
│   ├── GOOGLE_OAUTH_SETUP.md     # OAuth setup guide
│   ├── MONGODB_MIGRATION.md      # Migration documentation
│   └── ...                       # Other guides & references
│
├── 📁 scripts/                    # 🔧 Utility scripts
│   ├── README.md                 # Scripts documentation
│   ├── manage-services.sh        # Service management
│   ├── diagnose_rag_pipeline.py  # RAG diagnostics
│   └── test_vector_search.py     # Vector search tests
│
├── 📁 server/                     # 🖥️ Backend API layer
│   ├── api/                      # Nuxt API routes
│   │   ├── auth/                # Authentication endpoints
│   │   ├── agent/               # AI agent endpoints
│   │   ├── conversations/       # Conversation CRUD
│   │   ├── materials/           # Learning materials
│   │   ├── messages/            # Message handling
│   │   ├── practice-quizz/      # Quiz endpoints
│   │   └── rag/                 # RAG pipeline endpoints
│   │
│   ├── models/                   # Mongoose schemas
│   │   ├── User.ts
│   │   ├── Conversation.ts
│   │   ├── Message.ts
│   │   ├── LearningMaterial.ts
│   │   ├── PracticeQuiz.ts
│   │   └── Question.ts
│   │
│   ├── utils/                    # Server utilities
│   │   ├── mongodb.ts           # MongoDB connection
│   │   ├── auth.ts              # JWT authentication
│   │   ├── r2.ts                # Cloudflare R2 storage
│   │   ├── rag.ts               # RAG service client
│   │   └── agent.ts             # Agent service client
│   │
│   └── python-services/          # 🐍 Python microservices
│       ├── requirements.txt      # Python dependencies
│       ├── README.md            # Services documentation
│       ├── rag-service/         # RAG pipeline (port 8001)
│       ├── agent-service/       # AI agent (port 8002)
│       ├── quiz-service/        # Quiz generator (port 8003)
│       └── shared/              # Shared utilities
│
├── 📁 pages/                      # 🎨 Nuxt pages (routes)
│   ├── index.vue                # Landing page
│   ├── chat.vue                 # Chat interface
│   ├── materials.vue            # Materials management
│   ├── quizz.vue                # Quiz interface
│   └── auth/
│       └── callback.vue         # OAuth callback
│
├── 📁 components/                 # 🧩 Vue components
│   ├── AuthModal.vue
│   ├── Sidebar.vue
│   ├── FileUploadModal.vue
│   └── EditMaterialModal.vue
│
├── 📁 composables/                # 🪝 Vue composables
│   ├── useAuth.ts               # Authentication logic
│   ├── useAuthFetch.ts          # Authenticated fetch
│   ├── useConversations.ts      # Conversation management
│   ├── useQuiz.ts               # Quiz logic
│   └── usePracticeQuiz.ts       # Practice quiz handling
│
├── 📁 middleware/                 # 🛡️ Route middleware
│   └── auth.ts                  # Authentication guard
│
├── 📁 plugins/                    # 🔌 Nuxt plugins
│   └── auth.client.ts           # Client-side auth plugin
│
├── 📁 types/                      # 📐 TypeScript definitions
│
├── 📁 assets/                     # 🎨 Static assets
│   └── css/
│       └── main.css
│
├── 📁 public/                     # 🌐 Public static files
│   └── robots.txt
│
├── 📁 tests/                      # 🧪 Test suites
│   └── e2e/                     # Playwright E2E tests
│       ├── chat.spec.ts
│       └── utils/
│
├── 📁 k8s/                        # ☸️ Kubernetes configs
│
└── 📁 layouts/                    # 📐 Nuxt layouts
```

## 🎯 Key Directories

### Frontend
- `pages/` - Vue pages that define routes
- `components/` - Reusable Vue components
- `composables/` - Vue composition API hooks
- `assets/` - Stylesheets and design resources

### Backend
- `server/api/` - RESTful API endpoints (Nuxt/Nitro)
- `server/models/` - MongoDB/Mongoose data models
- `server/utils/` - Backend utilities & services
- `server/python-services/` - FastAPI microservices

### Configuration
- `docs/` - Project documentation & guides
- `scripts/` - Development & maintenance scripts
- `tests/` - Automated test suites

## 🔍 Finding Things

| Looking for... | Check... |
|---|---|
| API endpoint | `server/api/**/*.ts` |
| Database schema | `server/models/*.ts` |
| Vue component | `components/*.vue` |
| Page/route | `pages/*.vue` |
| Documentation | `docs/*.md` |
| Python service | `server/python-services/*/` |
| Test | `tests/e2e/*.spec.ts` |
| Utility script | `scripts/*` |

## 📚 Documentation Links

- [Main README](./README.md)
- [Documentation Index](./docs/README.md)
- [Scripts Guide](./scripts/README.md)
- [Python Services](./server/python-services/README.md)
