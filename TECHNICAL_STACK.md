# 🫀 HEART — Technical Stack

> **HEART** (Homecare & Emergency AI Routing Technology) is a real-time elderly patient monitoring system that uses AI-driven clinical decision-making to route care actions across a multi-role healthcare ecosystem in Malaysia.

---

## 1. Frontend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **UI Framework** | React | ^19.0.0 | Component-based SPA for all role dashboards |
| **Language** | TypeScript | ~5.7.2 | End-to-end type safety across all layers |
| **Build Tool** | Vite | ^6.0.5 | Lightning-fast HMR dev server & bundler |
| **Routing** | React Router DOM | ^7.1.1 | Role-based multi-view navigation (User, Doctor, Hospital, Operator, Field Unit) |
| **Styling** | Tailwind CSS | ^4.0.0 | Utility-first responsive design (via `@tailwindcss/vite` plugin) |
| **Charts** | Recharts | ^2.15.0 | Heart rate & step telemetry visualization |
| **Icons** | Lucide React | ^0.469.0 | Consistent iconography across dashboards |
| **ID Generation** | uuid | ^11.0.5 | Client-side unique identifiers |

### Role-Based Views

| View File | Target User | Key Features |
|---|---|---|
| `UserView.tsx` | Elderly Patient / Family | Daily check-ins, risk status, bilingual alerts |
| `DoctorView.tsx` | Clinician | Patient cohort, clinical assessments, AI reasoning |
| `HospitalView.tsx` | Hospital Admin | Cohort aggregation, admission triage, trends |
| `OperatorView.tsx` | Emergency Operator | Dispatch panel, real-time status, 999 escalation |
| `FieldUnitView.tsx` | Paramedic / Field Staff | Patient card, navigation, vitals summary |
| `RoleLanding.tsx` | All | Role selection & authentication gate |

### Shared Components

| Component | Purpose |
|---|---|
| `ChatWidget.tsx` | Floating AI chat assistant (Gemini-powered) |
| `Layout.tsx` | Shared navigation shell & role header |
| `LoginGate.tsx` | Role authentication & access control screen |

---

## 2. Backend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime** | Node.js + TypeScript (ESM) | — | Server-side execution with native ES Modules (`"type": "module"`) |
| **HTTP Framework** | Express.js | ^4.21.2 | REST API server for AI decision endpoints |
| **TypeScript Runner** | tsx | ^4.19.2 | Run `.ts` files directly in dev (`tsx watch`) — zero compile step |
| **CORS** | cors | ^2.8.5 | Cross-origin policy for frontend ↔ backend |
| **Schema Validation** | Zod | ^3.24.1 | Runtime input/output validation for all AI flows |
| **Environment Config** | dotenv | ^16.4.7 | `.env` loading (+ custom manual parser fallback in `server.ts`) |

### API Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Service health check — returns model info & status |
| `POST` | `/api/care-decision/snapshot` | Quick 3-signal risk assessment (HR, steps, check-in lag) |
| `POST` | `/api/care-decision/enhanced` | Full trend-aware AI analysis with baseline comparisons |
| `POST` | `/api/care-decision/batch` | Sequential multi-patient batch processing |
| `POST` | `/api/chat` | Conversational AI assistant for caregivers |
| `GET` | `/api/demo/patients` | Demo patient seed data (5 patients) |

---

## 3. Cloud Infrastructure (Google Cloud Platform)

| Service | GCP Product | Purpose |
|---|---|---|
| **AI Model** | Vertex AI (Gemini 2.5 Flash) | Core clinical reasoning engine |
| **Knowledge Search** | Vertex AI Search (Discovery Engine) | RAG — semantic retrieval of clinical guidelines |
| **Database** | Cloud Firestore (Firebase Admin SDK) | Patient records, decisions, trend snapshots |
| **Authentication** | Google Auth Library + Service Account | IAM-based secure access to all GCP services |
| **Region** | `asia-southeast1` (Singapore) | Low-latency for Malaysian healthcare context |
| **Project ID** | `heart-ai-493606` | Provisioned GCP project |

### GCP Services Configuration

```
GCP_PROJECT_ID              = heart-ai-493606
GCP_REGION                  = asia-southeast1
CHAT_MODEL                  = gemini-2.5-flash
VERTEX_SEARCH_ENGINE_ID     = heart-medical-search_1776432838194
VERTEX_SEARCH_DATASTORE_ID  = heart-guidelines_1776432929547
VERTEX_SEARCH_LOCATION      = global
GOOGLE_APPLICATION_CREDENTIALS = ./key.json
```

---

## 4. Key Libraries & SDKs

| Package | Version | Purpose |
|---|---|---|
| `@google-cloud/vertexai` | latest | Official Vertex AI SDK — calls Gemini 2.5 Flash for clinical reasoning |
| `@google-cloud/discoveryengine` | latest | Vertex AI Search SDK for RAG pipeline (guideline retrieval) |
| `firebase-admin` | ^13.0.2 | Firestore Admin SDK for server-side database operations |
| `google-auth-library` | ^10.6.2 | OAuth2 / service account authentication for GCP APIs |
| `zod` | ^3.24.1 | Schema validation for all AI input/output contracts |

---

## 5. Development Toolchain

| Tool | Version | Purpose |
|---|---|---|
| `typescript` | ~5.7.2 | Static type checking across frontend and backend |
| `vite` | ^6.0.5 | Frontend dev server, HMR, production bundler |
| `@vitejs/plugin-react` | ^4.3.4 | React Fast Refresh plugin for Vite |
| `@tailwindcss/vite` | ^4.0.0 | Tailwind CSS integration as Vite plugin |
| `tsx` | ^4.19.2 | TypeScript runner for backend (no compile step in dev) |
| `eslint` | ^9.17.0 | Code linting and style enforcement |
| `typescript-eslint` | ^8.18.2 | TypeScript-specific ESLint rules |
| `eslint-plugin-react-hooks` | ^5.1.0 | React Hooks safety rules |
| `eslint-plugin-react-refresh` | ^0.4.16 | Fast Refresh component boundary validation |
| `globals` | ^15.14.0 | Global variable definitions for ESLint |

### NPM Scripts

| Script | Command | Description |
|---|---|---|
| Frontend Dev | `npm run dev` | Starts Vite dev server (port 5173) |
| Backend Dev | `npm run server:dev` | Starts backend with `tsx watch` (hot reload, port 3000) |
| Backend Prod | `npm run server:start` | Starts backend in production mode (`tsx`) |
| Build | `npm run build` | `tsc -b && vite build` — TypeScript compile + Vite production bundle |
| Preview | `npm run preview` | Preview production build locally |
| Lint | `npm run lint` | ESLint across all source files |

---

## 6. Project Architecture Overview

```
HEART/
├── index.html                    # App entry point (Vite SPA)
├── vite.config.ts                # Vite build config + Tailwind plugin
├── tsconfig.json                 # Root TypeScript config (references)
├── tsconfig.app.json             # Frontend TypeScript config
├── tsconfig.node.json            # Backend/Node TypeScript config
├── eslint.config.js              # ESLint flat config
├── package.json                  # All dependencies & scripts
├── .env                          # Environment variables (GCP keys, config)
├── key.json                      # GCP Service Account credentials (gitignored)
├── test-vertex.ts                # Vertex AI integration test script
├── run_heart.bat                 # Windows batch launcher (frontend + backend)
│
├── public/                       # Static assets (served by Vite)
│
└── src/
    ├── main.tsx                  # React app bootstrap
    ├── App.tsx                   # Root component + React Router
    ├── types.ts                  # Shared frontend TypeScript interfaces
    ├── mock-data.ts              # Demo patient dataset (frontend)
    ├── dashboard-service.ts      # Frontend ↔ backend API connector
    │
    ├── components/
    │   ├── ChatWidget.tsx        # Floating AI chat assistant
    │   ├── Layout.tsx            # Shared navigation shell
    │   └── LoginGate.tsx         # Role authentication screen
    │
    ├── views/                    # Role-specific dashboards
    │   ├── UserView.tsx          # Patient / Family view
    │   ├── DoctorView.tsx        # Clinician view
    │   ├── HospitalView.tsx      # Hospital admin view
    │   ├── OperatorView.tsx      # Emergency operator view
    │   ├── FieldUnitView.tsx     # Paramedic / Field staff view
    │   └── RoleLanding.tsx       # Role selection landing page
    │
    └── ai/                       # Backend AI engine
        ├── server.ts             # Express REST API server (main entrypoint)
        ├── decision-flows.ts     # Snapshot, Enhanced & Dashboard flows
        ├── analytics.ts          # Velocity, anomaly & risk aggregation
        ├── rag-system.ts         # RAG orchestrator (Vertex → mock fallback)
        ├── rag-system-vertex.ts  # Vertex AI Search integration (REST API)
        ├── rag-system-mock.ts    # Offline mock knowledge base
        ├── firestore-service.ts  # Cloud Firestore CRUD layer
        ├── dashboard-service.ts  # WhatsApp payloads, clinical summaries, cohort stats
        ├── batch-processor.ts    # Multi-patient batch AI processing (daily/weekly)
        ├── schemas.ts            # Zod schemas for AI I/O validation
        ├── types.ts              # Backend-specific TypeScript interfaces
        └── mock-data.ts          # Backend seed data (5 demo scenarios)
```

---

## 7. Communication Model

```
Browser (React SPA — Vite, port 5173)
        │
        │  HTTP (REST / JSON)
        ▼
Express Backend (Node.js / port 3000)
        │
        ├──► Vertex AI (Gemini 2.5 Flash)     — clinical reasoning (JSON mode)
        ├──► Vertex AI Search (REST API)       — RAG guideline retrieval
        ├──► Cloud Firestore                   — patient data persistence
        └──► WhatsApp Deep Links               — family notification payloads
```

### Fallback Architecture

```
Vertex AI (Gemini 2.5 Flash)
        │
        ▼ (on API error / rate limit / unavailable)
Deterministic Mock Response (fallback JSON)
        │
        ▼ (ensures frontend never crashes)
Frontend renders decision normally
```

---

## 8. Firestore Data Model

```
patients/
├── {patientId}/
│   ├── baseline data (avgHR, avgSteps, avgSleep)
│   ├── lastRiskScore
│   │
│   ├── checkins/
│   │   └── {checkinId} — timestamp, responded, deviceData
│   │
│   ├── decisions/
│   │   └── {decisionId} — riskScore, action, reasoning, guidelines
│   │
│   └── trends/
│       └── {snapshotId} — date, avgHR, totalSteps, riskScore, anomalies
```

---

## 9. Internationalization (i18n)

All AI outputs and UI messages support **bilingual** content:

| Language | Code | Use Case |
|---|---|---|
| English | `en` | Clinical staff, doctors, operators |
| Bahasa Malaysia | `ms` | Patients, families, general caregivers |

Every decision output contains a `MultilingualText` object `{ en: string, ms: string }` for:
- Clinical reasoning
- Action plans
- Estimated outcomes
- WhatsApp notification messages
- Role-specific family insights

---

## 10. Batch Processing Schedule

| Job | Cron Expression | Frequency |
|---|---|---|
| Daily Trend Analysis | `0 0 * * *` | Every day at midnight |
| Weekly Cohort Analysis | `0 0 ? * MON` | Every Monday at midnight |
| Monthly Review | `0 0 1 * *` | First of every month |

---

*Last updated: May 2026 | Project: HEART AI (heart-ai-493606)*
