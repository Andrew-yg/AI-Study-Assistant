# 📚 AI Study Assistant

> Nuxt 3 + MongoDB application that ingests PDFs into a RAG pipeline, streams AI tutoring responses, and generates practice quizzes.

## ✨ Features

- Google OAuth + JWT session handling
- Cloudflare R2 uploads with automatic ingestion into MongoDB Atlas Vector Search
- Streaming AI chat agent (OpenAI + Brave Search)
- Practice quiz generator + evaluator powered by the same material context
- Dedicated Python microservices for RAG, agent orchestration, and quiz generation

## 🧱 Requirements

- Node.js 18+
- Python 3.10+ with `pip`
- MongoDB Atlas cluster + Cloudflare R2 bucket
- API keys: `OPENAI_API_KEY`, optional `BRAVE_SEARCH_API_KEY`

## ⚙️ Setup

1. Install Node dependencies

```bash
npm install
```

2. Install Python dependencies once (creates/uses your local environment)

```bash
pip install -r server/python-services/requirements.txt
```

3. Copy `.env.example` → `.env` and fill in MongoDB, Google OAuth, R2, and OpenAI credentials.

## 🏃‍♀️ Run the full stack

`npm run dev` now launches **Nuxt + all Python services** concurrently, so a single command gives you the entire experience:

```bash
npm run dev
```

This starts:

- `web` → Nuxt app on http://localhost:3000
- `rag-service` → http://localhost:8001
- `agent-service` → http://localhost:8002
- `quiz-service` → http://localhost:8003

> Need only the Nuxt app? Use `npm run dev:web`.

## ✅ Verifying everything is up

The backend now checks downstream health before making requests. If a service is offline you’ll get a 503 with guidance (`npm run dev:rag`, etc.), and the UI won’t hang at 90%.

## 🧪 Useful scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Launch Nuxt + rag + agent + quiz services |
| `npm run dev:web` | Only run the Nuxt dev server |
| `npm run dev:rag` / `dev:agent` / `dev:quiz` | Start services individually |
| `npm run build` | Production build |
| `npm run preview` | Preview production output |

## 🚀 Production

```bash
npm run build
npm run preview
```

Deploy the Nuxt build together with the Python services (for example via separate processes or containers). Ensure the environment variables for `RAG_SERVICE_URL`, `AGENT_SERVICE_URL`, and `QUIZ_SERVICE_URL` point to the deployed services.

---

Need more context? Check `HOW_TO_RUN.md` and `QUICK_START.md` for deep-dive instructions.
