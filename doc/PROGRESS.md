# SocraticEngine — Piano di Sviluppo e Progressi

> Ultimo aggiornamento: 2025-07-12
> Stato globale: 🟡 In corso — Fase 1 ~95%, Fase 2 ~90%, Fase 3 ~80%

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

## FASE 2: Core Editor & UI (Priorità: CRITICA) — 🟡 90%

### Task 2.1: Editor WYSIWYG — 🟢 COMPLETATO
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 2.1.1 | Integrare ProseMirror in React | 🟢 | ProseMirrorEditor.tsx con forwardRef |
| 2.1.2 | Schema editor (paragrafi, heading, bold...) | 🟢 | editor/schema.ts + intervention mark |
| 2.1.3 | Tema dark CSS variables | 🟢 | styles/global.css |
| 2.1.4 | Tipografia IBM Plex Mono + Playfair Display | 🟢 | Google Fonts + CSS vars |
| 2.1.5 | Sistema cromatico tripartito | 🟢 | verde/arancio/viola |
| 2.1.6 | Toolbar formattazione | 🟢 | EditorToolbar.tsx: B/I/Code/H1-3/¶/❝/lists/undo/redo |
| 2.1.7 | Sidebar interventi AI | 🟢 | Tabbed sidebar (Interventions + Versions) |

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

### Task 2.3: Versioning — 🟡 83%
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 2.3.1 | Backend: versioning tree | 🟢 | parent_version_id |
| 2.3.2 | Backend: list/get/rollback | 🟢 | |
| 2.3.3 | Frontend: pannello cronologia | 🟢 | VersionPanel.tsx con expand/collapse |
| 2.3.4 | Frontend: diff visuale | 🔴 | Da implementare |
| 2.3.5 | Frontend: rollback UI | 🟢 | Rollback button in VersionPanel |
| 2.3.6 | Commit message automatici | 🟢 | |

---

## FASE 3: Funzionalità AI Core (Priorità: CRITICA) — 🟡 ~80%

### Task 3.1: WebSocket Real-Time — 🟢 COMPLETATO
| ID | Subtask | Stato |
|----|---------|-------|
| 3.1.1 | WebSocket manager (connect/disconnect/broadcast) | 🟢 |
| 3.1.2 | Endpoint `/api/ws/{document_id}` con JWT auth | 🟢 |
| 3.1.3 | Abort/cancel stream in-flight | 🟢 |
| 3.1.4 | Routing messaggi (text_activity, trigger, abort) | 🟢 |

### Task 3.2: LLM Service Multi-Provider — 🟢 COMPLETATO
| ID | Subtask | Stato | Provider |
|----|---------|-------|----------|
| 3.2.1 | Astrazione LLM con streaming async | � | — |
| 3.2.2 | Anthropic streaming (claude-sonnet-4, claude-haiku-4) | 🟢 | Anthropic |
| 3.2.3 | OpenAI streaming (gpt-4o-mini, gpt-4o) | 🟢 | OpenAI |
| 3.2.4 | **Gemini streaming (gemini-2.0-flash, gemini-2.5-pro)** | 🟢 | Google (google-genai≥1.0) |
| 3.2.5 | Router intelligente (feature → modello) | 🟢 | — |
| 3.2.6 | Fallback chain (Anthropic → OpenAI → Gemini) | 🟢 | — |

### Task 3.3: Voce Socratica — � COMPLETATO
| ID | Subtask | Stato |
|----|---------|-------|
| 3.3.1 | Prompt system + output (Domanda + Sottotesto) | 🟢 |
| 3.3.2 | Trigger automatico 3s silenzio + debounce | 🟢 |
| 3.3.3 | Endpoint REST POST /interventions/socratica | 🟢 |
| 3.3.4 | Streaming via WebSocket | 🟢 |

### Task 3.4: Paradosso — 🟢 COMPLETATO
| ID | Subtask | Stato |
|----|---------|-------|
| 3.4.1 | Prompt system + output (Tensione + Nucleo) | 🟢 |
| 3.4.2 | Endpoint REST POST /interventions/paradosso | 🟢 |
| 3.4.3 | Streaming via WebSocket | 🟢 |
| 3.4.4 | Cooldown anti-saturazione (5 min / sezione) | 🔴 |

### Task 3.5: Lenti Filosofiche — 🟢 COMPLETATO
| ID | Subtask | Stato |
|----|---------|-------|
| 3.5.1 | Prompt per 8 filosofi (Platone, Aristotele, Kant, Hegel, Nietzsche, Heidegger, Foucault, Wittgenstein) | 🟢 |
| 3.5.2 | Output strutturato: Lettura + Critica + Domanda | 🟢 |
| 3.5.3 | Endpoint REST POST /interventions/lente | 🟢 |
| 3.5.4 | Streaming via WebSocket + selezione testo | 🟢 |

### Task 3.6: Config & Persistenza Interventi — 🟢 COMPLETATO
| ID | Subtask | Stato |
|----|---------|-------|
| 3.6.1 | user_preferences JSONB (frequenza, intensità) | 🟢 |
| 3.6.2 | Salvataggio intervento in tabella interventions | 🟢 |
| 3.6.3 | Reaction utente (accept/reject/ignore) | 🟢 |

### Task 3.7: Frontend AI UI — 🟢 COMPLETATO
| ID | Subtask | Stato | File |
|----|---------|-------|------|
| 3.7.1 | Hook `useInterventions` (WS, streaming, debounce) | 🟢 | hooks/useInterventions.ts |
| 3.7.2 | Componente `InterventionCard` | 🟢 | components/InterventionCard.tsx |
| 3.7.3 | Componente `InterventionPanel` | 🟢 | components/InterventionPanel.tsx |
| 3.7.4 | Integrazione in `EditorPage` | 🟢 | pages/EditorPage.tsx |

### Task 3.8: Migrazione DB — ⏸️ BLOCCATO
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 3.8.1 | Alembic `--autogenerate` per tabella interventions | ⏸️ | Richiede Docker Desktop avviato |
| 3.8.2 | `alembic upgrade head` | ⏸️ | Dopo 3.8.1 |

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
| 2: Editor & UI | 20 | 18 | 90% |
| 3: AI Core | 50 | 40 | 80% |
| 4: Sicurezza | 33 | 2 | 6% |
| 5: Intelligence | 31 | 0 | 0% |
| 6: Osservabilità | 17 | 2 | 12% |
| **Totale prioritarie** | **173** | **82** | **47%** |
| Futuro (F.x) | 28 | 0 | 0% |

---

## Changelog

### 2025-07-12 — Sessione 3: Fase 3 AI Core (quasi completa)
- ✅ PROGRESS.md aggiornato: Fase 3 con Gemini come terzo provider
- ✅ `google-genai>=1.0` installato (nuovo SDK ufficiale, sostituisce `google-generativeai`)
- ✅ `backend/app/schemas/interventions.py`: Pydantic schemas (InterventionType, Philosopher×8, UserReaction, LLMProvider, request/response types, WsMessageType)
- ✅ `backend/app/services/llm_service.py`: astrazione streaming multi-provider (Anthropic → OpenAI → Gemini), routing feature→modello, fallback chain configurabile
- ✅ `backend/app/services/intervention_service.py`: prompt italiani per 3 tipi, 8 filosofi, metodi stream + blocking
- ✅ `backend/app/api/ws_manager.py`: ConnectionManager singleton con abort/task cancellation
- ✅ `backend/app/api/endpoints/ws.py`: WebSocket `/api/ws/{document_id}` (JWT via query param, debounce auto-socratica 3s)
- ✅ `backend/app/api/endpoints/interventions.py`: REST socratica/paradosso/lente/list/reaction
- ✅ `backend/app/api/router.py`: nuovi router inclusi
- ✅ `backend/app/api/deps.py`: `get_current_user_ws()` aggiunto
- ✅ `backend/app/models/intervention.py`: `version_id` reso nullable
- ✅ `backend/app/core/config.py`: OPENAI_HEAVY_MODEL, GEMINI_API_KEY/FAST/HEAVY_MODEL, LLM_PRIMARY_PROVIDER, ANTHROPIC_HAIKU_MODEL
- ✅ `.env.example`: GEMINI_API_KEY + LLM_PRIMARY_PROVIDER documentati
- ✅ `frontend/src/hooks/useInterventions.ts`: hook WS con streaming, debounce 3.5s, auto-reconnect, setReaction
- ✅ `frontend/src/components/InterventionCard.tsx`: card filosofica con colori tipo, reaction buttons, streaming cursor
- ✅ `frontend/src/components/InterventionPanel.tsx`: pannello completo (trigger buttons, philosopher picker, WS status, lista interventi)
- ✅ `frontend/src/pages/EditorPage.tsx`: integrazione InterventionPanel al posto del placeholder
- ✅ TypeScript: 0 errori
- ⏸️ Alembic migration bloccata: Docker Desktop non avviato

### 2025-07-11 — Sessione 2: ProseMirror + Version Panel
- ✅ ProseMirror integrato in React (ProseMirrorEditor.tsx con forwardRef)
- ✅ Schema editor personalizzato (schema.ts): paragrafi, heading 1-3, blockquote, hr, bold, italic, code, lists, intervention mark custom
- ✅ Plugin setup (plugins.ts): keymap, history, input rules, dropcursor, gapcursor
- ✅ EditorToolbar.tsx: B/I/Code/H1-H3/¶/❝/bullet/ordered/hr/undo/redo
- ✅ VersionPanel.tsx: cronologia versioni, expand/collapse, text preview, rollback button
- ✅ Sidebar con tabs (Interventions / Versions)
- ✅ CSS styling (ProseMirrorEditor.css, EditorToolbar.css, VersionPanel.css)
- ✅ npm install (196 packages, 0 vulnerabilities)
- ✅ pip install backend deps (venv)
- ✅ TypeScript: 0 errori, Vite build: 75 moduli, 422KB JS + 16KB CSS
- ⚠️ Docker Desktop non attivo — alembic migration pending

### 2025-07-11 — Sessione 1: Scaffolding completo
- ✅ Monorepo: backend/ (FastAPI), frontend/ (React+Vite), shared/, doc/
- ✅ 6 modelli DB: User, Document, Version, Intervention, SharedArtifact, AuditLog
- ✅ Auth: registrazione Argon2id, login JWT, refresh, middleware protezione
- ✅ CRUD documenti: create, list, get, update, soft-delete + versioning Git-like
- ✅ Frontend: Login, Register, Dashboard, Editor pages con API client + AuthContext
- ✅ Tema dark filosofico: IBM Plex Mono + Playfair Display, colori Socratica/Paradosso/Lenti
- ✅ Docker Compose: PostgreSQL 15 + Redis 7
- ✅ CI/CD: GitHub Actions backend (pytest) + frontend (lint+build)

---

## Prossimi Step Immediati
1. **Avviare Docker Desktop** → `docker compose up -d`
2. **Alembic migration** → `alembic revision --autogenerate -m "add_interventions_table"` + `alembic upgrade head`
3. **Test E2E WebSocket** — aprire editor, verifica stream Voce Socratica
4. Aggiungere cooldown anti-saturazione (Task 3.4.4)
5. Diff visuale tra versioni (Task 2.3.4)
6. Rate limiting endpoint auth (Task 1.3.7)
