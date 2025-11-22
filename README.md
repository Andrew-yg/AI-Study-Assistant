# 📚 AI Study Assistant

<div align="center">
	<p><strong>Nuxt 3 + MongoDB RAG platform that ingests study materials, chats with an AI tutor, and generates adaptive practice quizzes.</strong></p>
	<p>
		<img alt="Nuxt" src="https://img.shields.io/badge/Nuxt-3.13-00DC82?style=flat-square" />
		<img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-Atlas-brightgreen?style=flat-square" />
		<img alt="Status" src="https://img.shields.io/badge/status-active-success?style=flat-square" />
		<img alt="Tests" src="https://img.shields.io/badge/tests-Playwright-blue?style=flat-square" />
	</p>
	<p>
		<a href="#getting-started">Getting Started</a>
		· <a href="./docs/HOW_TO_RUN.md">Runbook</a>
		· <a href="./docs/QUICK_START.md">Quick Start</a>
		· <a href="https://github.com/Andrew-yg/AI-Study-Assistant/issues">Report Bug</a>
	</p>
</div>

---

## 📑 Table of Contents

- [About the Project](#-about-the-project)
	- [Built With](#built-with)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Project Structure](./PROJECT_STRUCTURE.md)
- [Getting Started](#-getting-started)
	- [Prerequisites](#prerequisites)
	- [Installation](#installation)
	- [Environment Variables](#environment-variables)
- [Running the Stack](#-running-the-stack)
- [Deploying to Kubernetes](#-deploying-to-kubernetes)
- [Usage Walkthrough](#-usage-walkthrough)
- [Testing](#-testing)
- [API & Services](#-api--services)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)
- [Acknowledgments](#-acknowledgments)


---



## 🧠 About the Project

**AI Study Assistant** is a comprehensive learning platform that transforms static study materials into interactive, AI-powered learning experiences. Built with modern web technologies and a microservices architecture, it provides students with an intelligent tutor that understands their course materials and generates personalized practice content.

### What Makes It Special?

The platform leverages **Retrieval Augmented Generation (RAG)** to create a contextual learning environment where:
- PDFs are automatically processed, chunked, and embedded into a vector database
- Student questions are answered using both uploaded materials and real-time web search
- Practice quizzes are generated from actual course content, not generic templates
- Every interaction is transparent, showing which sources informed each response

### Current Status

✅ **Fully Functional** - The project is production-ready with:
- Complete authentication system (Google OAuth + JWT)
- Working RAG pipeline with MongoDB Atlas Vector Search
- Streaming AI chat with telemetry
- Quiz generation and evaluation
- Responsive UI optimized for desktop and mobile
- Comprehensive E2E test coverage
- Kubernetes deployment configurations
- Docker support for containerized deployment

### Built With

- [Nuxt 3](https://nuxt.com/) + [Vue 3](https://vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [MongoDB Atlas](https://www.mongodb.com/atlas) + [Mongoose](https://mongoosejs.com/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [FastAPI](https://fastapi.tiangolo.com/) microservices (RAG, Agent, Quiz)
- [OpenAI GPT-4](https://openai.com/) + optional [Brave Search API](https://brave.com/search/api/)
- [Playwright](https://playwright.dev/) for e2e coverage

---

## ✨ Key Features

### 🔐 Authentication & User Management
- **Google OAuth 2.0** integration with JWT-based session management
- Automatic token refresh and secure session handling
- Protected routes with authentication middleware
- User profile management with MongoDB persistence

### 📚 Intelligent Document Processing
- **Zero-copy PDF ingestion**: Upload PDFs directly to Cloudflare R2 storage
- Automatic text extraction, chunking, and vectorization
- MongoDB Atlas Vector Search for semantic document retrieval
- Support for multiple document types (lectures, textbooks, slides, assignments)
- Per-conversation material organization for contextual learning

### 💬 AI-Powered Chat Interface
- **Streaming responses** with real-time token-by-token display
- LangChain-based agent orchestration combining:
  - RAG (Retrieval Augmented Generation) from uploaded materials
  - Brave Search API for supplemental web context
  - GPT-4 for intelligent response generation
- **Response telemetry** showing:
  - Model used for generation
  - Referenced course materials with relevance scores
  - Web search results and citations
  - Tool call transparency
- Conversation management (create, rename, delete, switch)
- Message history persistence

### 🎯 Adaptive Practice Quizzes
- **Intelligent quiz generation** from uploaded materials
- Multiple question types:
  - Multiple choice
  - True/False
  - Short answer
- Configurable difficulty levels (easy, medium, hard)
- Automated answer evaluation with detailed feedback
- Quiz history and progress tracking
- Per-conversation quiz organization

### 🏗️ Robust Architecture
- **Health-aware backend**: Nuxt server middleware verifies downstream Python services before making requests
- **Microservices architecture** with independent RAG, Agent, and Quiz services
- **All-in-one dev command**: `npm run dev` simultaneously boots Nuxt + rag + agent + quiz services
- **Comprehensive error handling** with user-friendly error messages
- **E2E testing** with Playwright for critical user flows

---

## 🧱 Architecture

```
┌────────────┐      ┌───────────────┐      ┌─────────────┐
│  Nuxt UI   │◄────►│  Node/Nitro   │◄────►│  Python Svc │
└────────────┘      │  API layer    │      │ (RAG/Agent/ │
			▲       └───────────────┘      │    Quiz)    │
			│                    ▲         └─────────────┘
			│                    │                       │
			│             Cloudflare R2 (PDFs)           │
			│                    │                       │
			▼                    ▼                       ▼
	Browser            MongoDB Atlas vector store  OpenAI + Brave
```

- **Nuxt app**: components under `pages/` & `components/` deliver chat, materials, and quiz workflows.
- **Server routes**: `server/api/**` orchestrate authentication, storage, and fan-out requests to Python services.
- **Python microservices**: FastAPI apps in `server/python-services/` handle ingestion, conversational agent logic, and quiz workflows.

---

## 🚀 Getting Started

### Prerequisites

- Node.js **20.19+** or **22.12+** (required by Nuxt 3.20)
- Python **3.10+** with `pip`
- MongoDB Atlas cluster & credentials
- Cloudflare R2 bucket + API token
- `OPENAI_API_KEY` (plus optional `BRAVE_SEARCH_API_KEY`)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/Andrew-yg/AI-Study-Assistant.git
cd AI-Study-Assistant

# 2. Install Node dependencies
npm install

# 3. Install Python dependencies
pip install -r server/python-services/requirements.txt

# 4. Copy env template
cp .env.example .env
```

### Environment Variables

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret used to sign user sessions |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials with redirect `http://localhost:3000/api/auth/google/callback` |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` | Cloudflare R2 storage credentials |
| `BASE_URL` | Public base URL for the Nuxt app |
| `OPENAI_API_KEY` | Required by all Python services |
| `BRAVE_SEARCH_API_KEY` (optional) | Enables supplemental web search |

Need extra context? See [`docs/QUICK_START.md`](./docs/QUICK_START.md) and [`docs/HOW_TO_RUN.md`](./docs/HOW_TO_RUN.md).

---

## � Running the Stack

| Command | What it does |
| --- | --- |
| `npm run dev` | Boots Nuxt + rag + agent + quiz services concurrently |
| `npm run dev:web` | Nuxt dev server only (http://localhost:3000) |
| `npm run dev:rag` / `dev:agent` / `dev:quiz` | Start individual FastAPI services on ports 8001–8003 |
| `npm run build` + `npm run preview` | Production build & preview |
| `npm run test:e2e` | Execute Playwright suite (auto-launches Nuxt on port 3100) |

Health checks are available via `GET /api/health` (Nuxt) and `/health` on each Python service. The Node layer returns a 503 with remediation tips if a dependency is down.

## ☸️ Deploying to Kubernetes

Ready for production traffic? Follow [`docs/DEPLOY_TO_K8S.md`](./docs/DEPLOY_TO_K8S.md) for detailed instructions on building/pushing container images, creating the ConfigMap & secrets, applying the manifests under `k8s/`, and wiring the ingress for your own domain + TLS certificate. Update the sample registry names and `study.example.com` placeholders before applying the manifests.

---

## 🧭 Usage Walkthrough

1. **Sign in with Google** – OAuth flow persists a JWT session.
2. **Create a conversation** – start from the sidebar, rename or delete anytime.
3. **Upload study materials** – PDFs land in Cloudflare R2, kick off ingestion + vectorization.
4. **Chat with the agent** – messages stream token-by-token with citations.
5. **Generate practice quizzes** – pick material, auto-generate questions, submit answers for evaluation.

Every interaction surfaces telemetry and backend health so you always know which service responded.

---

## ✅ Testing

```bash
npx playwright install   # first run only
npm run test:e2e         # spins up Nuxt on port 3100 and mocks APIs
npx playwright show-report  # optional HTML report
```

Playwright covers the critical chat ➜ telemetry ➜ quiz happy path. Extend `tests/e2e` with additional scenarios as features grow.

---

## 🔌 API & Services

### Nuxt / Node Endpoints

- **Auth**: `GET /api/auth/google`, `/api/auth/google/callback`, `/api/auth/me`, `POST /api/auth/logout`
- **Conversations & Messages**: CRUD endpoints under `/api/conversations` and `/api/messages`, plus `/api/agent/chat` for streaming replies.
- **Materials**: `/api/materials`, `/api/upload` handle metadata + Cloudflare R2 operations.
- **Practice quizzes**: `/api/practice-quizz` endpoints manage quiz creation, retrieval, and grading.

### Python FastAPI Services

| Service | Port | Responsibilities |
| --- | --- | --- |
| RAG Service | 8001 | PDF parsing, chunking, embedding, semantic search (`/process`, `/query`, `/health`) |
| Agent Service | 8002 | LangChain agent orchestration + Brave Search tools (`/chat`, `/health`) |
| Quiz Service | 8003 | Question generation and answer evaluation (`/generate`, `/evaluate`, `/health`) |

Each service exposes Swagger docs at `http://localhost:<port>/docs`.

---

## 🗺 Roadmap

- [ ] Expand RAG service beyond PDFs (web captures, slides)
- [ ] Docker-compose workflow for one-click bootstrapping
- [ ] Advanced analytics dashboard (study streaks, retention curves)
- [ ] Multi-user org sharing + workspace permissions

Track progress inside [`docs/NEXT_STEPS.md`](./docs/NEXT_STEPS.md) and [`docs/optimized-implementation-plan.md`](./docs/optimized-implementation-plan.md).

---

## 🤝 Contributing

Contributions make this project better for every student. To propose changes:

1. Fork the repo & create a feature branch (`git checkout -b feat/amazing`)
2. Install deps + ensure `npm run test:e2e` passes
3. Commit with conventional messages and open a PR

Issues and enhancement ideas are welcome on the [GitHub issue tracker](https://github.com/Andrew-yg/AI-Study-Assistant/issues).

---

## 📜 License

No explicit license has been published yet. Please contact the maintainers before reusing or distributing this codebase.

---

## 📫 Contact

- Project Link: <https://github.com/Andrew-yg/AI-Study-Assistant>
- Questions? Open an issue and tag `@Andrew-yg`.

---

## 🙌 Acknowledgments

- Inspired by the excellent [Best-README-Template](https://github.com/othneildrew/Best-README-Template) and [bane sullivan's README](https://github.com/banesullivan/README)
- Thanks to the Nuxt, MongoDB, and FastAPI communities for stellar docs and tooling

Happy studying! 🚀
