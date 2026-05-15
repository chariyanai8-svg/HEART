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
| **Styling** | Tailwind CSS | ^4.0.0 | Utility-first responsive design |
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

---

## 2. Backend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime** | Node.js + TypeScript (ESM) | — | Server-side execution with native ES Modules |
| **HTTP Framework** | Express.js | ^4.21.2 | REST API server for AI decision endpoints |
| **TypeScript Runner** | tsx | ^4.19.2 | Run `.ts` files directly in dev (`tsx watch`) |
| **CORS** | cors | ^2.8.5 | Cross-origin policy for frontend ↔ backend |
| **Schema Validation** | Zod | ^3.24.1 | Runtime input/output validation for all AI flows |
| **Environment Config** | Manual `.env` parser | — | Custom dotenv loader (no dependency required) |

### API Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Service health check, model info |
| `POST` | `/api/care-decision/snapshot` | Quick 3-signal risk assessment |
| `POST` | `/api/care-decision/enhanced` | Full trend-aware AI analysis |
| `POST` | `/api/care-decision/batch` | Multi-patient batch processing |
| `POST` | `/api/chat` | Conversational AI assistant for caregivers |
| `GET` | `/api/demo/patients` | Demo patient seed data |

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
GCP_PROJECT_ID         = heart-ai-493606
GCP_REGION             = asia-southeast1
VERTEX_SEARCH_ENGINE_ID    = heart-medical-search_1776432838194
VERTEX_SEARCH_DATASTORE_ID = heart-guidelines_1776432929547
VERTEX_SEARCH_LOCATION     = global
GOOGLE_APPLICATION_CREDENTIALS = ./key.json
```

---

## 4. Key Libraries & SDKs

| Package | Purpose |
|---|---|
| `@google-cloud/vertexai` | Official Vertex AI SDK — calls Gemini 2.5 Flash |
| `@google-cloud/discoveryengine` | Vertex AI Search SDK for RAG pipeline |
| `firebase-admin` | Firestore Admin SDK for server-side DB operations |
| `google-auth-library` | OAuth2 / service account authentication for GCP APIs |

---

## 5. Development Toolchain

| Tool | Purpose |
|---|---|
| `typescript` ~5.7.2 | Static type checking across frontend and backend |
| `vite` + `@vitejs/plugin-react` | Frontend dev server, HMR, production bundler |
| `tsx` | TypeScript runner for backend (no compile step needed in dev) |
| `eslint` + `typescript-eslint` | Code linting and style enforcement |
| `eslint-plugin-react-hooks` | Hooks safety rules |
| `eslint-plugin-react-refresh` | Fast Refresh validation |

### NPM Scripts

| Script | Command | Description |
|---|---|---|
| Frontend Dev | `npm run dev` | Starts Vite dev server |
| Backend Dev | `npm run server:dev` | Starts backend with `tsx watch` (hot reload) |
| Backend Prod | `npm run server:start` | Starts backend in production mode |
| Build | `npm run build` | TypeScript compile + Vite production bundle |
| Lint | `npm run lint` | ESLint across all source files |

---

## 6. Project Architecture Overview

```
HEART/
├── index.html                    # App entry point
├── vite.config.ts                # Vite build config
├── tsconfig.json                 # Root TypeScript config
├── package.json                  # All dependencies & scripts
├── .env                          # Environment variables (GCP keys, config)
├── key.json                      # GCP Service Account credentials
├── test-vertex.ts                # Vertex AI integration test script
│
└── src/
    ├── main.tsx                  # React app bootstrap
    ├── App.tsx                   # Root component + router
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
    │   ├── UserView.tsx
    │   ├── DoctorView.tsx
    │   ├── HospitalView.tsx
    │   ├── OperatorView.tsx
    │   ├── FieldUnitView.tsx
    │   └── RoleLanding.tsx
    │
    └── ai/                       # Backend AI engine
        ├── server.ts             # Express REST API server
        ├── decision-flows.ts     # Snapshot, Enhanced & Dashboard flows
        ├── analytics.ts          # Velocity, anomaly & risk aggregation
        ├── rag-system.ts         # RAG orchestrator (Vertex → mock fallback)
        ├── rag-system-vertex.ts  # Vertex AI Search integration
        ├── rag-system-mock.ts    # Offline mock knowledge base
        ├── firestore-service.ts  # Cloud Firestore CRUD layer
        ├── dashboard-service.ts  # Aggregated patient data for dashboards
        ├── batch-processor.ts    # Multi-patient batch AI processing
        ├── schemas.ts            # Zod schemas for AI I/O validation
        ├── types.ts              # Backend-specific TypeScript interfaces
        └── mock-data.ts          # Backend seed data for development
```

---

## 7. Communication Model

```
Browser (React SPA)
        │
        │  HTTP (REST)
        ▼
Express Backend (Node.js / port 3000)
        │
        ├──► Vertex AI (Gemini 2.5 Flash) — clinical reasoning
        ├──► Vertex AI Search             — RAG guideline retrieval
        └──► Cloud Firestore              — patient data persistence
```

---

## 8. Internationalization (i18n)

All AI outputs and UI messages support **bilingual** content:

| Language | Code | Use Case |
|---|---|---|
| English | `en` | Clinical staff, doctors, operators |
| Bahasa Malaysia | `ms` | Patients, families, general caregivers |

Every decision output contains a `MultilingualText` object `{ en: string, ms: string }` for reasoning, action plans, alerts, and WhatsApp notifications.

---

*Last updated: May 2026 | Project: HEART AI (heart-ai-493606)*
