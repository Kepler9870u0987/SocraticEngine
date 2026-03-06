# SocraticEngine — Editor Filosofico

**Co-Writing, Tensione Intellettuale e Pensiero Critico Aumentato**

Un editor di scrittura che non assiste la produzione testuale, ma esercita una pressione intellettuale attiva sull'autore attraverso dialettica socratica, paradossi strutturali e lenti filosofiche.

## Architecture

```
socratic-engine/
├── backend/          # Python FastAPI — API, WebSocket, AI workers
├── frontend/         # React + TypeScript + Vite — Editor UI
├── shared/           # Shared types, constants, contracts
├── doc/              # Documentation, analysis, progress tracking
├── docker/           # Docker configs
└── .github/          # CI/CD workflows
```

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+ (via Docker)

### Development Setup

```bash
# 1. Clone and enter
git clone <repo-url>
cd SocraticEngine

# 2. Copy environment variables
cp .env.example .env
# Edit .env with your API keys

# 3. Start infrastructure (PostgreSQL + Redis)
docker compose up -d

# 4. Backend setup
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
alembic upgrade head          # Run migrations
uvicorn app.main:app --reload

# 5. Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Access
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Editor | ProseMirror |
| Backend | Python 3.12 + FastAPI |
| Real-time | WebSocket (native) |
| Database | PostgreSQL 15+ |
| Cache | Redis |
| Auth | JWT (access + refresh tokens) |
| LLM | Anthropic Claude, OpenAI GPT-4 |

## Documentation

- [Analisi Strategica](doc/Analisi_Editor_Filosofico_UPDATED.md)
- [Progress Tracking](doc/PROGRESS.md)

## License

Proprietary — All rights reserved.
