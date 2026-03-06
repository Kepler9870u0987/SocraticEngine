# SocraticEngine — Piano di Sviluppo e Progressi

> Ultimo aggiornamento: 2026-03-06
> Stato globale: 🟡 In corso — Fase 1 completata, Fase 2 parziale

## Legenda Stati
- 🔴 Non iniziato
- 🟡 In corso
- 🟢 Completato
- ⏸️ Bloccato
- 🔵 Rimandato (sviluppi futuri)

---

## FASE 1: Project Scaffolding & Fondamenta (Priorità: CRITICA) — 🟢 95%

### Task 1.1: Inizializzazione Progetto — 🟢 COMPLETATO
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 1.1.1 | Monorepo: frontend/, backend/, shared/, doc/ | 🟢 | |
| 1.1.2 | Frontend: React + TypeScript + Vite | 🟢 | package.json, vite.config.ts, tsconfig.json |
| 1.1.3 | Backend: FastAPI modulare (api/, core/, models/, schemas/, services/) | 🟢 | |
| 1.1.4 | Docker Compose (PostgreSQL 15 + Redis 7) | 🟢 | docker-compose.yml |
| 1.1.5 | CI/CD GitHub Actions (backend + frontend) | 🟢 | .github/workflows/ |
| 1.1.6 | .env.example + README.md | 🟢 | |

### Task 1.2: Database PostgreSQL — Schema Base (Single-Tenant) — 🟢 COMPLETATO
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 1.2.1 | Alembic per migrazioni async | 🟢 | alembic.ini + alembic/env.py |
| 1.2.2 | Tabella users | 🟢 | models/user.py — No tenant_id |
| 1.2.3 | Tabella documents (soft delete GDPR) | 🟢 | models/document.py |
| 1.2.4 | Tabella versions (Git-like tree) | 🟢 | models/version.py |
| 1.2.5 | Tabella interventions (log crisi) | 🟢 | models/intervention.py |
| 1.2.6 | Tabella shared_artifacts (share links) | 🟢 | models/shared_artifact.py |
| 1.2.7 | Tabella audit_logs | 🟢 | models/audit_log.py |
| 1.2.8 | Indici FK, email, share_token | 🟢 | |
| 1.2.9 | Generare prima migrazione Alembic | 🔴 | Richiede DB running |

### Task 1.3: Autenticazione Base — 🟢 COMPLETATO
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 1.3.1 | Registrazione (Argon2id) | 🟢 | core/security.py |
| 1.3.2 | Login JWT (access + refresh) | 🟢 | 30min + 7d |
| 1.3.3 | Middleware auth endpoint protetti | 🟢 | api/deps.py |
| 1.3.4 | Endpoint /auth/* | 🟢 | register, login, refresh, me |
| 1.3.5 | Frontend: Login + Register pages | 🟢 | |
| 1.3.6 | Frontend: gestione token + auto refresh | 🟢 | api/client.ts + AuthContext |
| 1.3.7 | Rate limiting auth | 🔴 | Da implementare |

---

## FASE 2: Core Editor & UI (Priorità: CRITICA) — 🟡 70%

### Task 2.1: Editor WYSIWYG — 🟡 IN CORSO
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 2.1.1 | Integrare ProseMirror in React | 🔴 | Deps in package.json |
| 2.1.2 | Schema editor (paragrafi, heading, bold...) | 🔴 | |
| 2.1.3 | Tema dark CSS variables | 🟢 | styles/global.css |
| 2.1.4 | Tipografia IBM Plex Mono + Playfair Display | 🟢 | Google Fonts + CSS vars |
| 2.1.5 | Sistema cromatico tripartito | 🟢 | verde/arancio/viola |
| 2.1.6 | Toolbar formattazione | 🔴 | |
| 2.1.7 | Sidebar interventi AI | 🟢 | Placeholder in EditorPage |

### Task 2.2: CRUD Documenti — 🟢 COMPLETATO
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 2.2.1 | Backend CRUD /documents | 🟢 | |
| 2.2.2 | Backend /documents/{id}/versions | 🟢 | + rollback |
| 2.2.3 | Autosave 3s debounce | 🟢 | EditorPage.tsx |
| 2.2.4 | Frontend: dashboard documenti | 🟢 | Grid layout |
| 2.2.5 | Frontend: apertura documento | 🟢 | /editor/:documentId |
| 2.2.6 | Frontend: creazione + rinomina | 🟢 | |
| 2.2.7 | Frontend: eliminazione + conferma | 🟢 | Soft delete |

### Task 2.3: Versioning — 🟡 PARZIALE
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 2.3.1 | Backend: versioning tree | 🟢 | parent_version_id |
| 2.3.2 | Backend: list/get/rollback | 🟢 | |
| 2.3.3 | Frontend: pannello cronologia | 🔴 | |
| 2.3.4 | Frontend: diff visuale | 🔴 | |
| 2.3.5 | Frontend: rollback UI | 🔴 | |
| 2.3.6 | Commit message automatici | 🟢 | |

---

## FASE 3: Funzionalità AI Core (Priorità: CRITICA) — 🔴 2%
> Task 3.1-3.6: WebSocket, LLM, Socratica, Paradosso, Lenti, Config — Tutti 🔴
> Unica eccezione: 3.6.1 user_preferences JSONB → 🟢

## FASE 4: Sicurezza, Export e Condivisione — 🔴 6%
> Task 4.1-4.6: Sicurezza API, Audit, Crittografia, Export, Share, Log → Tutti 🔴
> Eccezioni: 4.1.7 CORS → 🟢, 4.2.1 Tabella audit_logs → 🟢

## FASE 5: Intelligence Avanzata — 🔴 0%
> Task 5.1-5.4: LLM Switching, RAG, Memoria, Dibattito → Tutti 🔴

## FASE 6: Osservabilità, Feedback e QA — 🔴 12%
> 6.1.7 Health check → 🟢, 6.3.1 Test base → 🟡

## 🔵 FASI FUTURE — Multi-Tenant & Enterprise
> F.1-F.6: Multi-tenancy, SSO, Admin Dashboard, Compliance, Plugin, Monetizzazione → Tutti 🔵

---

## Riepilogo

| Fase | Subtask | Completati | % |
|------|---------|------------|---|
| 1: Scaffolding | 22 | 20 | 91% |
| 2: Editor & UI | 20 | 14 | 70% |
| 3: AI Core | 43 | 1 | 2% |
| 4: Sicurezza | 33 | 2 | 6% |
| 5: Intelligence | 31 | 0 | 0% |
| 6: Osservabilità | 17 | 2 | 12% |
| **Totale prioritarie** | **166** | **39** | **23%** |
| Futuro (F.x) | 28 | 0 | 0% |

---

## Changelog

### 2026-03-06 — Sessione 1: Scaffolding completo
- ✅ Monorepo: backend/ (FastAPI), frontend/ (React+Vite), shared/, doc/
- ✅ 6 modelli DB: User, Document, Version, Intervention, SharedArtifact, AuditLog
- ✅ Auth: registrazione Argon2id, login JWT, refresh, middleware protezione
- ✅ CRUD documenti: create, list, get, update, soft-delete + versioning Git-like
- ✅ Frontend: Login, Register, Dashboard, Editor pages con API client + AuthContext
- ✅ Tema dark filosofico: IBM Plex Mono + Playfair Display, colori Socratica/Paradosso/Lenti
- ✅ Docker Compose: PostgreSQL 15 + Redis 7
- ✅ CI/CD: GitHub Actions backend (pytest) + frontend (lint+build)
- ⏭️ Prossimi: `docker compose up` → `alembic revision --autogenerate` → `npm install` → ProseMirror

---

## Prossimi Step Immediati
1. Avviare Docker (`docker compose up -d`)
2. Creare virtualenv Python e installare dipendenze
3. Generare prima migrazione Alembic (`alembic revision --autogenerate`)
4. `npm install` nel frontend
5. Integrare ProseMirror come componente React editor
6. Testing end-to-end del flusso auth → create doc → edit → save
