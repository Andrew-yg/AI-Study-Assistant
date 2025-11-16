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
		· <a href="./HOW_TO_RUN.md">Runbook</a>
		· <a href="./QUICK_START.md">Quick Start</a>
		· <a href="https://github.com/Andrew-yg/AI-Study-Assistant/issues">Report Bug</a>
	</p>
</div>

---

## 📑 Table of Contents

- [About the Project](#-about-the-project)
	- [Built With](#built-with)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
	- [Prerequisites](#prerequisites)
	- [Installation](#installation)
	- [Environment Variables](#environment-variables)
- [Running the Stack](#-running-the-stack)
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

AI Study Assistant turns loose PDFs into conversational study sessions. Upload materials once, let the Retrieval Augmented Generation (RAG) pipeline chunk and index them inside MongoDB Atlas Vector Search, and interact with a fast UI that streams tutor-style answers and personalized quizzes.

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

- **Google OAuth + JWT** login flow with automatic session refresh.
- **Zero-copy ingestion**: Upload PDFs to Cloudflare R2, auto-chunk, embed, and store vectors in MongoDB.
- **Streaming tutor**: A LangChain agent that combines retrieved context with Brave Search snippets for grounded answers.
- **Practice quizzes**: Dedicated quiz generator/evaluator microservice that reuses the same context window.
- **Health-aware backend**: Nuxt server middleware verifies downstream Python services before making requests.
- **All-in-one dev command**: `npm run dev` simultaneously boots Nuxt + rag + agent + quiz services.

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

- Node.js **18+**
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

Need extra context? See [`QUICK_START.md`](./QUICK_START.md) and [`HOW_TO_RUN.md`](./HOW_TO_RUN.md).

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

Track progress inside [`NEXT_STEPS.md`](./NEXT_STEPS.md) and [`optimized-implementation-plan.md`](./optimized-implementation-plan.md).

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
