# SocraticEngine — Piano di Sviluppo e Progressi

> Ultimo aggiornamento: 2026-03-06
> Stato globale: 🔴 Non iniziato (0/148 subtask completati)

## Legenda Stati
- 🔴 Non iniziato
- 🟡 In corso
- 🟢 Completato
- ⏸️ Bloccato
- 🔵 Rimandato (future development)

---

## FASE 1: Project Scaffolding & Fondamenta (Priorità: CRITICA)
> Obiettivo: Setup progetto, toolchain, struttura base del codice
> Timeline stimata: Settimana 1-2

### Task 1.1: Inizializzazione Progetto
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 1.1.1 | Creare monorepo con struttura `frontend/`, `backend/`, `shared/`, `docs/` | 🔴 | |
| 1.1.2 | Setup Frontend: React + TypeScript + Vite, configurazione tsconfig, ESLint, Prettier | 🔴 | |
| 1.1.3 | Setup Backend: Python FastAPI con struttura modulare (routers, services, models, schemas) | 🔴 | |
| 1.1.4 | Configurazione Docker Compose per ambiente di sviluppo locale (app + db + redis) | 🔴 | |
| 1.1.5 | Setup CI/CD base con GitHub Actions (lint, test, build) | 🔴 | |
| 1.1.6 | Creare `.env.example` e documentazione setup locale nel README | 🔴 | |

### Task 1.2: Database PostgreSQL — Schema Base (Single-Tenant)
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 1.2.1 | Setup PostgreSQL 15+ con Docker, configurare Alembic per migrazioni | 🔴 | |
| 1.2.2 | Creare tabella `users` (id UUID, email, hashed_password, display_name, role, created_at, updated_at) | 🔴 | Senza tenant_id — single-tenant |
| 1.2.3 | Creare tabella `documents` (id, user_id FK, title, current_version_id, created_at, updated_at, deleted_at) | 🔴 | Soft delete per GDPR |
| 1.2.4 | Creare tabella `versions` (id, document_id FK, version_number, content_encrypted, author_id FK, created_at, parent_version_id, commit_message) | 🔴 | Git-like versioning |
| 1.2.5 | Creare tabella `interventions` (id, version_id FK, document_id FK, type, trigger_context, input_hash, output_json JSONB, philosopher, model_used, tokens_consumed, latency_ms, user_reaction, created_at) | 🔴 | Log delle crisi filosofiche |
| 1.2.6 | Creare tabella `shared_artifacts` (id, document_id FK, version_id FK, share_token UNIQUE, expires_at, max_views, view_count, created_by FK, created_at, revoked_at) | 🔴 | Share links |
| 1.2.7 | Creare indici per query frequenti (user_id su documents, document_id su versions, share_token) | 🔴 | |
| 1.2.8 | Scrivere seed script per dati di test | 🔴 | |

### Task 1.3: Autenticazione Base (Single-User, No SSO)
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 1.3.1 | Implementare registrazione utente (email + password con Argon2id hashing) | 🔴 | |
| 1.3.2 | Implementare login con JWT (access token + refresh token) | 🔴 | |
| 1.3.3 | Middleware FastAPI per autenticazione/autorizzazione su endpoint protetti | 🔴 | |
| 1.3.4 | Endpoint `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` | 🔴 | |
| 1.3.5 | Frontend: pagine Login e Register con form validation | 🔴 | |
| 1.3.6 | Frontend: gestione token JWT (storage sicuro, refresh automatico, redirect su 401) | 🔴 | |
| 1.3.7 | Rate limiting su endpoint auth (max 10 tentativi login/minuto per IP) | 🔴 | |

---

## FASE 2: Core Editor & UI (Priorità: CRITICA)
> Obiettivo: Editor di scrittura funzionante con interfaccia dark e tipografia filosofica
> Timeline stimata: Settimana 3-6

### Task 2.1: Editor WYSIWYG con ProseMirror/Lexical
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 2.1.1 | Integrare ProseMirror (o Lexical) nel frontend React | 🔴 | Valutare trade-off: ProseMirror più maturo, Lexical più moderno |
| 2.1.2 | Configurare schema editor: paragrafi, heading, bold, italic, liste | 🔴 | |
| 2.1.3 | Implementare tema dark con variabili CSS custom | 🔴 | Background scuro, contrasto alto |
| 2.1.4 | Configurare tipografia duale: IBM Plex Mono (voce macchina) + Playfair Display (voce autore) | 🔴 | |
| 2.1.5 | Implementare sistema cromatico tripartito: verde (Socratica), arancio (Paradosso), viola (Lenti) | 🔴 | |
| 2.1.6 | Toolbar editor con azioni di formattazione base | 🔴 | |
| 2.1.7 | Area di rendering per interventi AI laterale/inline | 🔴 | Pannello laterale o annotazioni inline |

### Task 2.2: CRUD Documenti
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 2.2.1 | Backend: endpoint CRUD `/documents` (create, list, get, update, delete soft) | 🔴 | |
| 2.2.2 | Backend: endpoint `/documents/{id}/versions` (list versions, get version, create version) | 🔴 | |
| 2.2.3 | Autosave: salvataggio automatico ogni 30 secondi con creazione versione | 🔴 | Debounce per evitare versioni duplicate |
| 2.2.4 | Frontend: lista documenti (dashboard) con titolo, data modifica, anteprima | 🔴 | |
| 2.2.5 | Frontend: apertura documento nell'editor con caricamento contenuto | 🔴 | |
| 2.2.6 | Frontend: creazione nuovo documento, rinomina titolo inline | 🔴 | |
| 2.2.7 | Frontend: eliminazione documento con conferma (soft delete) | 🔴 | |

### Task 2.3: Versioning "Git per il Pensiero"
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 2.3.1 | Backend: logica di versioning con parent_version_id (tree structure) | 🔴 | |
| 2.3.2 | Backend: diff testuale tra versioni (libreria difflib o simile) | 🔴 | |
| 2.3.3 | Frontend: pannello "Cronologia Versioni" con timeline navigabile | 🔴 | |
| 2.3.4 | Frontend: visualizzazione diff tra versione corrente e versione selezionata | 🔴 | |
| 2.3.5 | Frontend: rollback a versione precedente con conferma | 🔴 | |
| 2.3.6 | Commit message automatico basato sul tipo di modifica (es. "Dopo intervento Socratico") | 🔴 | |

---

## FASE 3: Funzionalità AI Core (Priorità: CRITICA)
> Obiettivo: Implementare Voce Socratica, Paradosso, Lenti Filosofiche con comunicazione real-time
> Timeline stimata: Settimana 7-14

### Task 3.1: Infrastruttura WebSocket
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 3.1.1 | Setup WebSocket server in FastAPI (o con Socket.io) | 🔴 | |
| 3.1.2 | Implementare connessione WebSocket autenticata (JWT nel handshake) | 🔴 | |
| 3.1.3 | Gestione eventi: `text_update`, `trigger_socratica`, `trigger_paradosso`, `trigger_lente`, `abort_generation` | 🔴 | |
| 3.1.4 | Streaming progressivo delle risposte AI via WebSocket (token-by-token) | 🔴 | |
| 3.1.5 | Heartbeat e reconnection automatica lato client | 🔴 | |
| 3.1.6 | Setup Redis per message queue tra WebSocket gateway e AI worker | 🔴 | |

### Task 3.2: Integrazione LLM Provider (Anthropic Claude)
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 3.2.1 | Creare abstraction layer per LLM API (interfaccia comune per multi-provider) | 🔴 | Preparare per switching futuro |
| 3.2.2 | Implementare client Anthropic Claude (API streaming) | 🔴 | Provider primario |
| 3.2.3 | Implementare client OpenAI GPT-4 (API streaming) come fallback | 🔴 | |
| 3.2.4 | Gestione errori, retry con exponential backoff, timeout (max 30s) | 🔴 | |
| 3.2.5 | Logging di ogni chiamata LLM: model, tokens_in, tokens_out, latency_ms, cost | 🔴 | |
| 3.2.6 | Context truncation: invio solo ultimi 3 paragrafi / sezione selezionata (max 2000 token) | 🔴 | Data minimization |

### Task 3.3: Voce Socratica
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 3.3.1 | Frontend: trigger automatico dopo N secondi di inattività (default 3s, configurabile) | 🔴 | |
| 3.3.2 | Algoritmo trigger intelligente: analisi ritmo scrittura (char/min), hysteresis pausa riflessiva vs micro-interruzione | 🔴 | |
| 3.3.3 | Backend: system prompt Socratico robusto (smontare assunzione nascosta, restituire domanda + sottotesto) | 🔴 | |
| 3.3.4 | Output JSON strutturato: `{assumption, question, subtext, severity}` | 🔴 | |
| 3.3.5 | Frontend: rendering intervento Socratico con colore verde, tipografia IBM Plex Mono | 🔴 | |
| 3.3.6 | Gestione collisioni: segnale `abort_generation` se utente riprende a scrivere durante streaming | 🔴 | Autorità dell'autore |
| 3.3.7 | Frontend: reazione utente (accept/ignore/modify/reject) salvata in `interventions` | 🔴 | |
| 3.3.8 | Debounce avanzato e batching provocazioni per evitare frammentazione | 🔴 | |

### Task 3.4: Paradosso
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 3.4.1 | Frontend: bottone "Paradosso" nell'header dell'editor | 🔴 | Trigger manuale |
| 3.4.2 | Backend: system prompt Paradosso (trovare contraddizione strutturale, restituire tensione + nucleo) | 🔴 | |
| 3.4.3 | Output JSON strutturato: `{contradiction, tension, core, severity}` | 🔴 | |
| 3.4.4 | Frontend: rendering Paradosso con colore arancione | 🔴 | |
| 3.4.5 | Cooldown anti-saturazione: max 1 paradosso ogni 5 minuti per sezione | 🔴 | |
| 3.4.6 | Metrica di saturazione: avviso quando troppi paradossi già proposti | 🔴 | |
| 3.4.7 | Frontend: reazione utente salvata in `interventions` | 🔴 | |

### Task 3.5: Lenti Filosofiche
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 3.5.1 | Definire sistema di 8 filosofi iniziali con prompt specifici (Platone, Aristotele, Kant, Hegel, Nietzsche, Heidegger, Sartre, Foucault) | 🔴 | |
| 3.5.2 | Frontend: selezione testo + popup menu con lista filosofi | 🔴 | |
| 3.5.3 | Backend: system prompt per ogni filosofo (angolo di lettura specifico) | 🔴 | |
| 3.5.4 | Output JSON strutturato: `{philosopher, critique, perspective, references}` | 🔴 | |
| 3.5.5 | Frontend: rendering Lente con colore viola e nome filosofo | 🔴 | |
| 3.5.6 | Distinzione UI tra citazione letterale e interpretazione generata (quando RAG non disponibile: disclaimer esplicito) | 🔴 | |
| 3.5.7 | Limite configurabile di lenti contemporanee per evitare sovraccarico | 🔴 | |
| 3.5.8 | Frontend: reazione utente salvata in `interventions` | 🔴 | |

### Task 3.6: Configurazione Utente per Pressione Intellettuale
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 3.6.1 | Backend: modello `user_preferences` (frequenza Socratica, profondità interventi, aggressività Paradosso, max lenti simultanee) | 🔴 | |
| 3.6.2 | Frontend: pagina Settings con slider per ogni parametro | 🔴 | |
| 3.6.3 | Frequenza Voce Socratica: da "rara" a "continua" (modifica timer inattività) | 🔴 | |
| 3.6.4 | Profondità interventi: da "suggerimento" a "critica radicale" (modifica system prompt dinamicamente) | 🔴 | |
| 3.6.5 | Override per documento: possibilità di configurare pressione per singolo documento | 🔴 | |

---

## FASE 4: Sicurezza, Export e Condivisione (Priorità: ALTA)
> Obiettivo: Sicurezza API, E2EE base, export documenti, share links
> Timeline stimata: Settimana 15-20

### Task 4.1: Sicurezza API
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 4.1.1 | Forzare TLS 1.3 su tutte le connessioni, configurare HSTS header | 🔴 | |
| 4.1.2 | Rate limiting multi-livello: per IP (100 req/min), per utente (1000 req/h), per feature AI | 🔴 | |
| 4.1.3 | Content Security Policy (CSP) headers rigorosi | 🔴 | |
| 4.1.4 | Input sanitization su tutti gli endpoint (parameterized queries, XSS prevention) | 🔴 | |
| 4.1.5 | Protezione prompt injection: sanitizzazione input utente prima di invio a LLM | 🔴 | Pattern detection + redaction |
| 4.1.6 | Output validation: scan risposte LLM per PII e contenuti inappropriati | 🔴 | |
| 4.1.7 | CORS configuration restrittiva | 🔴 | |
| 4.1.8 | Dependency scanning setup (Snyk o Dependabot) | 🔴 | |

### Task 4.2: Audit Logging
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 4.2.1 | Creare tabella `audit_logs` (timestamp, event_type, user_id, resource_id, action, ip_address, user_agent, result, metadata JSONB) | 🔴 | |
| 4.2.2 | Middleware per logging automatico di: login/logout, accesso documenti, export, share | 🔴 | |
| 4.2.3 | Logging interventi AI: tipo, input_hash, output_hash, model, tokens, latency | 🔴 | |
| 4.2.4 | Formato log strutturato JSON consistente | 🔴 | |
| 4.2.5 | Retention policy: 1 anno per eventi standard, permanente per modifiche ruoli | 🔴 | |

### Task 4.3: Crittografia Contenuti
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 4.3.1 | Implementare crittografia AES-256-GCM lato server per contenuti documenti a riposo | 🔴 | Primo step: server-side encryption |
| 4.3.2 | Key management: una DEK per documento, KEK derivata da master key applicativa | 🔴 | |
| 4.3.3 | Transparent Data Encryption (TDE) per il tablespace PostgreSQL | 🔴 | |
| 4.3.4 | Backup database crittografati | 🔴 | |
| 4.3.5 | [FUTURO] E2EE client-side con Web Crypto API (richiede rework significativo) | 🔵 | Rimandato — richiede indicizzazione client-side |

### Task 4.4: Export Documenti
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 4.4.1 | Export in Markdown (.md) | 🔴 | |
| 4.4.2 | Export in PDF (con tipografia e colori degli interventi) | 🔴 | Libreria: WeasyPrint o Puppeteer |
| 4.4.3 | Export in LaTeX (per accademici) | 🔴 | |
| 4.4.4 | Export in DOCX (per corporate) | 🔴 | Libreria: python-docx |
| 4.4.5 | Inclusione opzionale degli interventi AI nell'export (come annotazioni/commenti) | 🔴 | |
| 4.4.6 | Audit log per ogni export | 🔴 | |

### Task 4.5: Share Links (Artefatti di Pensiero)
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 4.5.1 | Backend: endpoint `POST /documents/{id}/share` — genera share_token + chiave simmetrica | 🔴 | |
| 4.5.2 | Chiave K nell'hash dell'URL (`#K`): mai inviata al server | 🔴 | |
| 4.5.3 | Backend: endpoint `GET /shared/{token}` — restituisce contenuto cifrato + metadata | 🔴 | |
| 4.5.4 | Frontend viewer: decrittazione client-side con K estratto dall'hash | 🔴 | |
| 4.5.5 | TTL configurabile: 1h, 24h, 7d (default), 30d | 🔴 | |
| 4.5.6 | Max views opzionale e conteggio visualizzazioni | 🔴 | |
| 4.5.7 | Revoca manuale del link (UI + endpoint `DELETE /shared/{token}`) | 🔴 | |
| 4.5.8 | Job asincrono per eliminare share scaduti | 🔴 | |
| 4.5.9 | HMAC signature sul share_token per validazione server-side | 🔴 | |

### Task 4.6: Log Visuale degli Interventi
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 4.6.1 | Frontend: timeline delle crisi (Socratica, Paradosso, Lenti) con timestamp | 🔴 | |
| 4.6.2 | Possibilità di tornare a versione pre-intervento (link a versioning) | 🔴 | |
| 4.6.3 | Filtro per tipo di intervento e per filosofo | 🔴 | |
| 4.6.4 | Statistiche aggregate: interventi accettati vs ignorati vs rifiutati | 🔴 | |

---

## FASE 5: Intelligence Avanzata (Priorità: MEDIA)
> Obiettivo: Memoria Agente, RAG Filosofico, LLM Switching, Dibattito
> Timeline stimata: Settimana 21-34

### Task 5.1: LLM Switching Dinamico
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 5.1.1 | Implementare router intelligente: `route_to_model(feature, context) → model_id` | 🔴 | |
| 5.1.2 | Analisi complessità contesto per decidere modello leggero vs pesante | 🔴 | |
| 5.1.3 | Matrice routing: Haiku per Socratica semplice, Opus per Paradosso e Lenti+RAG | 🔴 | |
| 5.1.4 | Dashboard costi: tracking consumo token per utente, per feature, per modello | 🔴 | |
| 5.1.5 | Alert se singolo utente supera soglia costo anomalo ($10/giorno) | 🔴 | |
| 5.1.6 | Fallback automatico: se provider primario è down, switch a secondario | 🔴 | |

### Task 5.2: RAG Filosofico
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 5.2.1 | Setup pgvector extension in PostgreSQL | 🔴 | |
| 5.2.2 | Definire schema tabella `philosophical_chunks` (id, author, work, page, paragraph, content, embedding vector, source_url, license) | 🔴 | |
| 5.2.3 | Pipeline di ingestione: PDF pubblico dominio → OCR → chunking semantico (500-1000 token) → embedding | 🔴 | |
| 5.2.4 | Ingestire corpus iniziale: Platone, Aristotele, Kant, Hegel, Nietzsche, Heidegger, Sartre, Foucault | 🔴 | Solo opere in pubblico dominio |
| 5.2.5 | Implementare vector search: dato testo utente + filosofo → top-5 chunk rilevanti | 🔴 | |
| 5.2.6 | Modificare prompt Lenti Filosofiche per includere chunk RAG nel contesto | 🔴 | |
| 5.2.7 | Output con citazioni precise: autore, opera, pagina, citazione letterale | 🔴 | |
| 5.2.8 | UI: distinzione visiva tra citazione verificata (da RAG) e interpretazione generativa | 🔴 | |
| 5.2.9 | Indicatore di confidenza: Alta (3+ citazioni), Media (1), Bassa (sintesi generica) | 🔴 | |
| 5.2.10 | Sistema feedback utente: "Citazione errata" → segnalazione per review | 🔴 | |

### Task 5.3: Memoria Agente (Base)
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 5.3.1 | Creare tabella `user_knowledge_graph` (user_id, entity_type, entity_name, frequency, confidence, created_at, updated_at) con JSONB per relazioni | 🔴 | PostgreSQL JSONB, no Neo4j per semplicità iniziale |
| 5.3.2 | Pipeline NLP: estrazione entità/topic ricorrenti dai documenti dell'utente | 🔴 | |
| 5.3.3 | Tracciamento preferenze stilistiche (lunghezza frasi, complessità, vocabulario) | 🔴 | |
| 5.3.4 | Tracciamento debolezze logiche ricorrenti (fallacy patterns identificati dalla Socratica) | 🔴 | |
| 5.3.5 | Tracciamento filosofi preferiti (frequenza uso Lenti) | 🔴 | |
| 5.3.6 | Iniezione contesto memoria nel system prompt per personalizzazione interventi | 🔴 | |
| 5.3.7 | Voce Socratica personalizzata: "Ho notato che tendi a [pattern]. Anche qui stai facendo lo stesso?" | 🔴 | |
| 5.3.8 | UI: Dashboard "Il mio profilo cognitivo" (temi, pattern, filosofi preferiti) | 🔴 | |
| 5.3.9 | Opt-in esplicito con spiegazione chiara di cosa viene memorizzato | 🔴 | Privacy e consenso |
| 5.3.10 | Modalità Ephemeral: toggle per disattivare memoria (sessione tabula rasa) | 🔴 | |
| 5.3.11 | Possibilità di editare/resettare il profilo cognitivo | 🔴 | |
| 5.3.12 | PII detection: escludere nomi, date di nascita, indirizzi dalla memorizzazione | 🔴 | |

### Task 5.4: Modalità Dibattito Multi-Agent
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 5.4.1 | Backend: endpoint `POST /debate` — accetta text_selection + 2 filosofi | 🔴 | |
| 5.4.2 | Esecuzione parallela: 2 task indipendenti (asyncio.gather), uno per filosofo | 🔴 | |
| 5.4.3 | Ogni thread riceve: testo utente + prompt filosofo + chunk RAG specifici | 🔴 | |
| 5.4.4 | Nessuna comunicazione tra thread (isolamento cognitivo) | 🔴 | |
| 5.4.5 | Frontend: UI dibattito side-by-side (testo centrale, critica SX, critica DX) | 🔴 | |
| 5.4.6 | Ordine di esecuzione deterministico e stabile (evitare bias) | 🔴 | |
| 5.4.7 | Limite: max 2 filosofi contemporaneamente | 🔴 | |
| 5.4.8 | Feature opzionale: "Sintetizza i punti di frizione" (on-demand post-dibattito) | 🔴 | |
| 5.4.9 | Costo tracking per dibattito e limiti mensili per piano | 🔴 | |

---

## FASE 6: Osservabilità, Feedback e QA (Priorità: ALTA)
> Obiettivo: Monitoring, metriche, feedback loop, testing
> Timeline stimata: Parallelo alle fasi 3-5

### Task 6.1: Monitoring e Alerting
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 6.1.1 | Setup Prometheus + Grafana (o Datadog) per metriche sistema | 🔴 | |
| 6.1.2 | Metriche: uptime, latenza API (p50/p95/p99), error rate | 🔴 | |
| 6.1.3 | Metriche LLM: latenza per modello, token consumption, costi | 🔴 | |
| 6.1.4 | Alert: downtime >5min, p95 latenza >1s, error rate >1% | 🔴 | |
| 6.1.5 | Alert: consumo token anomalo per utente | 🔴 | |
| 6.1.6 | Centralized logging con formato JSON strutturato | 🔴 | |
| 6.1.7 | Health check endpoint (`/health`) e readiness probe | 🔴 | |

### Task 6.2: Feedback Loop AI Quality
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 6.2.1 | Frontend: thumbs up/down su ogni intervento AI | 🔴 | |
| 6.2.2 | Campo testo opzionale "Perché?" dopo thumbs down | 🔴 | |
| 6.2.3 | Backend: tabella `intervention_feedback` (intervention_id, rating, comment, created_at) | 🔴 | |
| 6.2.4 | Dashboard metriche AI: intervention acceptance rate, satisfaction rate | 🔴 | |
| 6.2.5 | Report settimanale automatico: interventi con più thumbs down, pattern ricorrenti | 🔴 | |

### Task 6.3: Testing
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| 6.3.1 | Backend: unit test per tutti i service (auth, documents, versions, interventions) | 🔴 | Target: 80% coverage |
| 6.3.2 | Backend: integration test per endpoint API (con test DB) | 🔴 | |
| 6.3.3 | Backend: test di sicurezza — prompt injection patterns, rate limiting | 🔴 | |
| 6.3.4 | Frontend: unit test componenti React (editor, settings, timeline) | 🔴 | |
| 6.3.5 | E2E test: flusso completo login → crea documento → scrivi → ricevi Socratica → export | 🔴 | Playwright o Cypress |
| 6.3.6 | Load test: simulazione 100+ utenti concorrenti con WebSocket | 🔴 | |
| 6.3.7 | Test di disaster recovery: backup restore, failover | 🔴 | |

---

## 🔵 FASI FUTURE (Rimandato — Multi-Tenant & Enterprise)

### FUTURO Task F.1: Multi-Tenancy Architecture
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| F.1.1 | Aggiungere tabella `tenants` e colonna `tenant_id` a tutte le tabelle | 🔵 | |
| F.1.2 | Implementare Row-Level Security (RLS) in PostgreSQL per isolamento dati | 🔵 | |
| F.1.3 | Indici partizionati per tenant_id | 🔵 | |
| F.1.4 | Middleware per impostare `app.current_tenant` in ogni richiesta | 🔵 | |
| F.1.5 | Opzione schema dedicato per enterprise | 🔵 | |
| F.1.6 | Opzione database dedicato per single-tenant hosting | 🔵 | |

### FUTURO Task F.2: SSO Enterprise & SCIM
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| F.2.1 | Integrazione Auth0/Okta con OAuth2/OIDC | 🔵 | |
| F.2.2 | SSO con Azure AD, Google Workspace | 🔵 | |
| F.2.3 | SAML 2.0 support | 🔵 | |
| F.2.4 | MFA obbligatoria per piano Enterprise | 🔵 | |
| F.2.5 | SCIM 2.0 provisioning/deprovisioning automatico | 🔵 | |
| F.2.6 | RBAC avanzato: Owner, Admin, Editor, Reviewer, Guest | 🔵 | |

### FUTURO Task F.3: Enterprise Admin Dashboard
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| F.3.1 | User management: lista utenti, invite, bulk operations | 🔵 | |
| F.3.2 | Workspace management per team/dipartimenti | 🔵 | |
| F.3.3 | Policy configuration a livello organizzazione | 🔵 | |
| F.3.4 | Audit log viewer con filtri e export | 🔵 | |
| F.3.5 | Usage analytics dashboard (DAU, documenti, token, costi) | 🔵 | |
| F.3.6 | Billing & cost management per workspace | 🔵 | |

### FUTURO Task F.4: Data Residency & Compliance Avanzata
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| F.4.1 | Deployment multi-region (EU, US, UK) | 🔵 | |
| F.4.2 | Data Processing Agreement (DPA) template | 🔵 | |
| F.4.3 | SOC 2 Type II audit preparation | 🔵 | |
| F.4.4 | HIPAA compliance per healthcare (BAA, PHI encryption) | 🔵 | |
| F.4.5 | BYOK (Bring Your Own Key) per Enterprise | 🔵 | |
| F.4.6 | E2EE completo client-side con Web Crypto API | 🔵 | |

### FUTURO Task F.5: Plugin & Integrazioni
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| F.5.1 | Plugin Obsidian: sidebar con Socratica, Paradosso, Lenti | 🔵 | |
| F.5.2 | Add-in Microsoft Word: ribbon tab + commenti laterali | 🔵 | |
| F.5.3 | Google Docs Extension: sidebar interventions | 🔵 | |
| F.5.4 | API pubblica REST: CRUD documenti, trigger interventions | 🔵 | |
| F.5.5 | Webhook per eventi (document.created, intervention.triggered) | 🔵 | |
| F.5.6 | Marketplace filosofi custom (upload corpus + training lente) | 🔵 | |

### FUTURO Task F.6: Monetizzazione & Piani
| ID | Subtask | Stato | Note |
|----|---------|-------|------|
| F.6.1 | Integrazione Stripe per billing (Free, Pro, Researcher, Academic, Enterprise) | 🔵 | |
| F.6.2 | Metering: conteggio interventi per piano e enforcement limiti | 🔵 | |
| F.6.3 | Paywall: upgrade flow quando limiti Free raggiúnti | 🔵 | |
| F.6.4 | Trial management: 7/30 giorni con conversione automatica | 🔵 | |
| F.6.5 | Discount per studenti e università | 🔵 | |

---

## Riepilogo Conteggio

| Fase | Task | Subtask | Stato |
|------|------|---------|-------|
| Fase 1: Scaffolding & Fondamenta | 3 | 21 | 🔴 |
| Fase 2: Core Editor & UI | 3 | 20 | 🔴 |
| Fase 3: Funzionalità AI Core | 6 | 43 | 🔴 |
| Fase 4: Sicurezza, Export, Condivisione | 6 | 33 | 🔴 |
| Fase 5: Intelligence Avanzata | 4 | 31 | 🔴 |
| Fase 6: Osservabilità, Feedback, QA | 3 | 17 | 🔴 |
| **Subtotale Prioritarie** | **25** | **165** | **🔴** |
| Futuro: Multi-Tenant & Enterprise | 6 | 28 | 🔵 |
| **TOTALE** | **31** | **193** | |

---

## Note di Priorità

**Ordine di esecuzione consigliato:**
1. **Fase 1** → Fondamenta imprescindibili
2. **Fase 2** → Editor funzionante, valore visibile
3. **Fase 3** → Cuore del prodotto, differenziazione
4. **Fase 6** (in parallelo a 3-4) → Testing e monitoring fin da subito
5. **Fase 4** → Sicurezza e condivisione
6. **Fase 5** → Intelligence avanzata per utenti power
7. **Fasi Future (F.x)** → Solo dopo validazione single-tenant

**Principio guida:** Costruire un prodotto single-tenant solido, funzionante e sicuro che un singolo utente (o piccolo team senza isolamento tenant) possa usare con fiducia. Multi-tenancy, SSO enterprise, compliance avanzata e plugin verranno aggiunti solo quando il core sarà stabile e validato.