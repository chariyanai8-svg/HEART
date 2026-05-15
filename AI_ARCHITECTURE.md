# 🧠 HEART — AI Architecture

> This document describes the complete AI system design of **HEART** (Homecare & Emergency AI Routing Technology), including models, decision flows, the RAG pipeline, analytics engine, and the escalation framework.

---

## 1. AI System Overview

HEART is an **autonomous care decision engine** that analyzes elderly patient wearable telemetry (smartwatch data) and determines the appropriate level of care intervention. The AI operates across three processing modes:

- **Snapshot Mode** — Fast 3-signal assessment (heart rate, steps, check-in lag)
- **Enhanced Mode** — Full trend-aware analysis with RAG-enriched clinical context
- **Dashboard Mode** — Flattened decision output for multi-role dashboard rendering

The system is designed to detect **gradual behavioral decline**, not just acute emergencies — a key distinction in elderly homecare monitoring.

### Core Design Principles

```
1. Gradual decline is more dangerous than sudden spikes
2. "No response + immobility" = highest risk signal
3. Multi-factor patterns matter: look for combinations of risk signals
4. Time is critical: early intervention prevents hospitalizations
5. Be specific: justify decisions with evidence from the data
```

---

## 2. AI Models

### Primary Model — Gemini 2.5 Flash

| Attribute | Value |
|---|---|
| **Model ID** | `gemini-2.5-flash` (configurable via `CHAT_MODEL` env var) |
| **Provider** | Google Cloud — Vertex AI |
| **Access Method** | `@google-cloud/vertexai` SDK (`VertexAI` class) |
| **Region** | `asia-southeast1` (Singapore) |
| **Authentication** | GCP Service Account (IAM) via `key.json` |

**Usage in HEART:**

| Function | Temperature | Max Tokens | Response Format | Purpose |
|---|---|---|---|---|
| Snapshot Decision | `0.3` | `2048` | `application/json` | Deterministic clinical triage |
| Enhanced Decision | `0.3` | `2048` | `application/json` | Full trend-aware analysis |
| Batch Decision | `0.3` | `2048` | `application/json` | Multi-patient processing |
| Chat Assistant | `0.7` | `1024` | Plain text | Conversational caregiver support |

> **Low temperature (0.3)** ensures deterministic, evidence-based clinical outputs.
> **Higher temperature (0.7)** enables natural, conversational chat responses.

### Secondary System — Vertex AI Search (RAG Retriever)

| Attribute | Value |
|---|---|
| **Product** | Google Cloud Discovery Engine |
| **Engine ID** | `heart-medical-search_1776432838194` |
| **Datastore ID** | `heart-guidelines_1776432929547` |
| **Location** | `global` |
| **Access Method** | REST API via `google-auth-library` OAuth2 |
| **Retrieval** | Semantic search with extractive answers & snippets |

**Role:** Retrieves relevant clinical guidelines from an indexed medical knowledge corpus to inject into the Gemini prompt (Retrieval-Augmented Generation).

---

## 3. Decision Flows

The AI backend exposes three decision flows, each with increasing sophistication. These are implemented across two files:
- `server.ts` — Express route handlers (direct Vertex AI calls)
- `decision-flows.ts` — Structured flows with analytics integration

### Flow 1 — Snapshot Decision (Fast Path)

**File:** `server.ts` → `POST /api/care-decision/snapshot`
**Also:** `decision-flows.ts` → `snapshotDecisionFlow()`

```
Input: { averageHeartRate, dailySteps, daysSinceLastCheckin,
         patientName?, age?, gender?, medicalHistory? }
         ↓
[Deterministic Gatekeeper]
  If daysSinceLastCheckin > 1 AND dailySteps < 50
  → Immediate CALL_999 (riskScore = 10, bypass AI)
         ↓
[Simulate Risk Profile]
  Mock risk assessment from raw inputs
  → cardiovascularRisk, mobilityRisk, engagementRisk
         ↓
[RAG Retrieval]
  retrieveRelevantGuidelines(simulatedRisks)
  → Vertex AI Search (primary) → Mock KB (fallback)
  buildRAGEnrichedPrompt(guidelines)
         ↓
[Gemini 2.5 Flash — JSON Mode]
  System Prompt: RAG prompt + HEART_SYSTEM_PROMPT
  User Prompt:   Patient snapshot data
  Config:        temperature=0.3, maxTokens=2048,
                 responseMimeType="application/json"
         ↓
[JSON Parse + Fallback]
  try/catch → getFallbackMockResponse() on parse failure
         ↓
Output: CareDecision JSON + metadata
```

**Use case:** Quick triage from wearable telemetry, triggered on a schedule or on-demand.

---

### Flow 2 — Enhanced Decision (Full Intelligence)

**File:** `decision-flows.ts` → `enhancedDecisionFlow()`
**Also:** `server.ts` → `POST /api/care-decision/enhanced`

```
Input: { patientId, averageHeartRate, dailySteps, daysSinceLastCheckin,
         last7DaysAverageHeartRate, last7DaysAverageSteps,
         checkInResponseRate, missedCheckinsThisWeek,
         sleepHours?, patientBaseline? }
         ↓
[Baseline Normalization]
  If no baseline provided → derive from 7-day averages
  Construct PatientBaseline object
         ↓
[Mock Historical Data]
  Generate 2-point data series (baseline → current)
  for trend computation
         ↓
[Analytics Engine]
  computeTrendMetrics()     — velocity & anomaly scores
  aggregateRiskFactors()    — weighted multi-factor risk
  detectDeclinePatterns()   — named pattern classification
         ↓
[RAG Retrieval]
  retrieveRelevantGuidelines(riskFactors)
  → Vertex AI Search (primary) → Mock KB (fallback)
  buildRAGEnrichedPrompt(guidelines)
         ↓
[Gemini 2.5 Flash — JSON Mode]
  System Prompt: RAG prompt + clinical principles
  User Prompt:   Full trend analysis with deltas, velocities,
                 pattern labels, risk scores
  Config:        temperature=0.3, maxTokens=2048
         ↓
[Decision Validation]
  validateDecisionAgainstGuidelines()
  → Check for conflicts between risk score and recommended action
  → Warn if critical guidelines exist but action is MONITOR
  → Warn if riskScore ≥ 9 but action ≠ CALL_999
         ↓
[Confidence Assessment]
  assessDecisionConfidence(trends, riskFactors)
  → Penalize inconsistent risk factors (-10%)
  → Penalize high anomaly scores (-15%)
  → Clamp to [20%, 100%]
         ↓
Output: EnhancedOutput {
  riskScore, action, reasoning (bilingual),
  actionPlan (bilingual), estimatedOutcome (bilingual),
  riskFactors, trendInsights, referencedGuidelines,
  decisionId, confidencePercent
}
```

**Use case:** Comprehensive daily analysis, triggered by the dashboard service or batch processor.

---

### Flow 3 — Dashboard Aggregation

**File:** `decision-flows.ts` → `dashboardAggregationFlow()`

```
Input: EnhancedInput (same as Flow 2)
         ↓
[enhancedDecisionFlow()]
         ↓
[Flatten to CareDecision]
  Map EnhancedOutput → CareDecision interface
  Include: patientId, decisionId, timestamp, trends,
           confidencePercent, medicalGuidelinesApplied
         ↓
Output: CareDecision (for dashboard card rendering)
```

**Use case:** Populates role-specific dashboards (Doctor, Hospital, Operator views).

---

## 4. The Analytics Engine

**File:** `src/ai/analytics.ts`

The analytics engine processes raw wearable data **before** passing it to the AI model. This pre-processing ensures the LLM receives structured, quantified risk signals — not raw numbers.

### Exported Functions

| Function | Purpose |
|---|---|
| `computeTrendMetrics()` | Velocity & anomaly scoring from time-series data |
| `aggregateRiskFactors()` | Weighted multi-factor risk calculation |
| `detectDeclinePatterns()` | Named behavioral pattern classification |
| `assessDecisionConfidence()` | Confidence scoring based on data quality |

### Key Algorithms

#### Velocity Analysis
Measures the **rate of change** per day for heart rate and steps:
```
velocity = (latest_value - earliest_value) / days_elapsed
```
A rapidly declining velocity signals deterioration even if current values appear normal.

#### Anomaly Scoring (Sigmoid-Normalized)
Computes how far current metrics deviate from the patient's **personal baseline** in standard deviations:
```
deviation = (current - baseline) / std_dev
anomalyScore = sigmoid(|deviation|) ∈ [0, 1]

sigmoid(x) = 1 / (1 + e^(-x))
```

#### Trend Direction Classification
```
If stepsVelocity < -30 AND heartRateVelocity < -2 → "declining"
If stepsVelocity > 30 AND heartRateAnomaly < 0.3  → "improving"
Otherwise                                          → "stable"
```

#### Multi-Factor Risk Aggregation
Combines four risk dimensions with clinical weights:

| Risk Factor | Weight | Signal Source |
|---|---|---|
| Engagement Risk | **40%** | Check-in response rate, missed check-ins |
| Mobility Risk | **35%** | Step count vs. baseline, step velocity |
| Cardiovascular Risk | **20%** | Heart rate anomaly, heart rate velocity |
| Social Risk | **5%** | Static baseline (contextual factor, fixed at 2) |

```
combinedRiskScore = engagementRisk × 0.40 + mobilityRisk × 0.35
                  + cardiovascularRisk × 0.20 + socialRisk × 0.05
```

#### Mobility Risk Thresholds

| Steps (% of Baseline) | Base Risk Score |
|---|---|
| < 30% | 9 |
| < 50% | 7 |
| < 70% | 5 |
| < 85% | 3 |
| ≥ 85% | 1 |

If step velocity < -50/day, risk is boosted by +2 (capped at 10).

#### Engagement Risk Thresholds

| Check-in Response Rate | Base Risk Score |
|---|---|
| < 50% | 9 |
| < 70% | 6 |
| < 85% | 3 |
| ≥ 85% | 1 |

If missed check-ins this week > 3, risk is boosted by +2 (capped at 10).

#### Cardiovascular Risk Thresholds

| Heart Rate Anomaly Score | Base Risk Score |
|---|---|
| > 0.7 | 8+ (scaled) |
| > 0.5 | 5+ (scaled) |
| > 0.3 | 3+ (scaled) |
| ≤ 0.3 | 1 |

#### Decline Pattern Detection
Named behavioral patterns identified from multi-signal analysis:

| Pattern Label | Trigger Condition |
|---|---|
| Severe Mobility Decline | Steps < 50% baseline AND velocity < -50/day |
| Moderate Mobility Decline | Steps < 70% baseline AND velocity < -30/day |
| Sedentary Behavior | Steps < 100 with zero velocity |
| Elevated Heart Rate Trend | HR velocity > 3/day AND HR anomaly > 0.5 |
| Sleep Pattern Abnormality | Sleep anomaly > 0.6 |

These pattern labels are injected verbatim into the Gemini prompt to guide clinical reasoning.

#### Confidence Assessment
```
base_confidence = min(100, data_point_count × 10)
if |mobilityRisk - cardiovascularRisk| > 4  → confidence -= 10
if heartRateAnomaly > 0.8 OR stepsAnomaly > 0.8 → confidence -= 15
final_confidence = clamp(result, 20, 100)
```

---

## 5. RAG Pipeline (Retrieval-Augmented Generation)

**Files:** `src/ai/rag-system.ts`, `src/ai/rag-system-vertex.ts`, `src/ai/rag-system-mock.ts`

The RAG system grounds every AI decision in indexed medical evidence, preventing hallucination and ensuring guideline compliance.

### Architecture

```
[Risk Factors] → [Query Builder] → [Vertex AI Search REST API]
                                          ↓
                               [Result Parser] → [MedicalGuideline[]]
                                          ↓
                          [RAG Prompt Builder] → [Enriched System Prompt]
                                          ↓
                              [Gemini 2.5 Flash]
```

### Fallback Chain

```
1. Vertex AI Search (live indexed corpus)
         ↓ (on error, empty results, or not configured)
2. Mock Knowledge Base (KNOWLEDGE_BASE in rag-system-mock.ts)
```

The system checks `VERTEX_SEARCH_ENGINE_ID` and `VERTEX_SEARCH_DATASTORE_ID` env vars at startup:
- If present → attempts `initializeVertexSearch()` → sets `vertexSearchEnabled = true`
- If absent or failed → falls back to mock KB silently

### Mock KB Retrieval Logic

Guidelines are selected from the mock knowledge base based on risk thresholds:

| Condition | Guidelines Retrieved |
|---|---|
| Always | `general_elderly_care` category |
| Cardiovascular Risk ≥ 6 | `cardiovascular_decline` category |
| Mobility Risk ≥ 5 | `mobility_decline` category |
| Combined Risk ≥ 8 | All `critical` risk level guidelines |
| Combined Risk ≥ 6 | Up to 2 additional `high` risk guidelines |

Maximum 5 guidelines per retrieval (to fit system prompt token limits).

### Guideline Schema

Each retrieved guideline conforms to the `MedicalGuideline` interface:

```typescript
interface MedicalGuideline {
  id: string;
  category: string;                              // e.g. "cardiovascular_decline"
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  triggers: string[];                            // Pattern triggers
  recommendedActions: string[];                  // Clinical action steps
  source: string;                                // Guideline name/authority
  evidence: string;                              // Extracted text (max 500 chars)
  retrievalSource?: 'vertex_search' | 'mock';
}
```

### RAG Prompt Construction

The `buildRAGEnrichedPrompt()` function constructs a system prompt that includes:
1. HEART Care Decision Engine identity
2. Core clinical principles (5 rules)
3. Risk stratification definitions (MONITOR → CALL_999)
4. Retrieved guidelines formatted as numbered blocks:
   - Source & category
   - Risk level
   - Trigger conditions
   - Evidence text
   - Recommended actions

### Clinical Guidelines Referenced

| Authority | Domain |
|---|---|
| **KKM** (Kementerian Kesihatan Malaysia) | National standards, geriatric protocols |
| **NHS** Guidelines for Elderly Care | General homecare best practices |
| **NICE** Guidelines for Heart Failure | Cardiac monitoring thresholds |
| **WHO** Integrated Care Guidelines | Holistic elderly care approach |
| **Fall Prevention Protocols** | Mobility risk intervention |

---

## 6. Escalation Framework

Every AI decision maps to one of **four care action levels**, forming a traffic-light escalation model:

| Action | Risk Score | Color | Meaning | Response |
|---|---|---|---|---|
| `MONITOR` | 1–3 | 🟢 Green | Patient stable | Continue passive monitoring |
| `FAMILY_CHECK` | 4–5 | 🟡 Yellow | Mild decline detected | Contact family within 24 hours |
| `CLINIC_VISIT` | 6–7 | 🟠 Orange | Moderate concern | Schedule clinic within 48 hours |
| `CALL_999` | 8–10 | 🔴 Red | Critical emergency | Immediate 999 dispatch |

### Deterministic Override Rules

The following conditions trigger immediate escalation **before AI inference**, for patient safety:

| Condition | Auto-Action | Location |
|---|---|---|
| `daysSinceLastCheckin > 1` AND `dailySteps < 50` | Immediate `CALL_999` (riskScore = 10) | `decision-flows.ts` gatekeeper |
| Heart Rate > 100 OR < 50 with other declining signals | `CALL_999` | System prompt rule #3 |
| No check-in for 2+ days with declining vitals | Minimum `CLINIC_VISIT` | System prompt rule #2 |
| Steps declining > 50% from baseline | Minimum `FAMILY_CHECK` | System prompt rule #4 |

### Fallback Escalation (Vertex AI Offline)

When Vertex AI is unavailable, `buildFallbackEnhancedOutput()` applies deterministic rules:

| Combined Risk Score | Fallback Action |
|---|---|
| ≥ 8 | `CALL_999` (riskScore = 9) |
| ≥ 5 | `CLINIC_VISIT` |
| ≥ 3 | `FAMILY_CHECK` |
| < 3 | `MONITOR` |

---

## 7. AI Output Schema

### Snapshot Output (Basic)

```json
{
  "riskScore": 7,
  "reasoning": {
    "en": "Clinical reasoning in English...",
    "ms": "Penalaran klinikal dalam Bahasa Malaysia..."
  },
  "action": "CLINIC_VISIT"
}
```

### Enhanced Output (Full)

```json
{
  "riskScore": 7,
  "action": "CLINIC_VISIT",
  "confidencePercent": 82,
  "reasoning": {
    "en": "Patient shows a 3-day trend of declining mobility...",
    "ms": "Pesakit menunjukkan trend kemerosotan mobiliti selama 3 hari..."
  },
  "riskFactors": {
    "cardiovascularRisk": 6,
    "mobilityRisk": 8,
    "engagementRisk": 5,
    "socialRisk": 2,
    "combinedRiskScore": 7
  },
  "actionPlan": {
    "en": "Schedule a clinic visit within 48 hours...",
    "ms": "Jadualkan lawatan klinik dalam 48 jam..."
  },
  "estimatedOutcome": {
    "en": "With early intervention, risk of hospitalization reduces by 75%.",
    "ms": "Dengan campur tangan awal, risiko kemasukan hospital berkurangan 75%."
  },
  "roleInsights": {
    "family": { "en": "...", "ms": "..." },
    "fieldUnit": "Tachycardia and immobility. Standard cardiac protocol on arrival.",
    "doctor": "Gradual 7-day ambulation decline. HR above baseline. Suspect decompensation.",
    "operator": "Priority dispatch. HR elevated, steps critical."
  },
  "trendInsights": {
    "direction": "declining",
    "percentChange": -45.5,
    "velocity": "steep decline"
  },
  "referencedGuidelines": ["KKM_Geriatric_Care_v2", "NICE_Heart_Failure_2024"],
  "whatsappMessage": {
    "en": "HEART Alert: Patient requires a clinic visit...",
    "ms": "Amaran HEART: Pesakit memerlukan lawatan ke klinik..."
  },
  "decisionId": "dec_1715789400000_a7b3c9e"
}
```

### Zod Validation

All I/O is validated at runtime using Zod schemas (`schemas.ts`):

| Schema | Validates |
|---|---|
| `SnapshotInputSchema` | HR (30–220 BPM), Steps (0–50k), Check-in days (0–30) |
| `EnhancedInputSchema` | Full input with optional baselines, sleep, response rate |
| `OutputSchema` | riskScore (1–10), reasoning (multilingual), action (enum) |
| `EnhancedOutputSchema` | Full output with risk factors, trends, guidelines, confidence |

---

## 8. Multi-Role AI Insights

The AI generates **role-specific insights** tailored to each consumer's context:

| Role | Insight Style | Language | Audience |
|---|---|---|---|
| **Family** | Simple, empathetic | Bilingual (en + ms) | Non-medical caregivers |
| **Field Unit** | Concise transmission summary | English only | Paramedics / EMTs on-scene |
| **Doctor** | Detailed clinical assessment with baseline comparisons | English only | Clinicians |
| **Operator** | Dispatch and triage instructions | English only | Emergency response coordinators |

---

## 9. Chat AI Assistant

**Endpoint:** `POST /api/chat`

A conversational assistant powered by Gemini 2.5 Flash, designed for caregivers and operators to ask questions about patient status, interpret AI decisions, and get guidance.

| Attribute | Value |
|---|---|
| **Model** | Gemini 2.5 Flash |
| **Temperature** | 0.7 (conversational) |
| **Max Tokens** | 1024 |
| **Default Language** | English only (Bahasa Malaysia on explicit request) |
| **Context** | Accepts optional `patientContext` object for grounded answers |
| **Output Format** | Plain text (no markdown — clean paragraphs & numbered lists) |

The assistant is instructed to:
- **Never use markdown** symbols (`*`, `#`) since the frontend renders plain text
- Recommend calling **999** for any emergency symptoms
- Stay professional, empathetic, and evidence-based
- Cover: vital sign interpretation, care decision explanations, elderly care guidance, system help

---

## 10. AI Safety & Reliability Design

| Concern | Design Decision |
|---|---|
| **API Unavailability** | Full fallback chain: Vertex AI → deterministic rules → `getFallbackMockResponse()` |
| **Invalid JSON from LLM** | `try/catch` JSON parse with automatic fallback mock decision |
| **Safety Filter Truncation** | Detected via parse failure → regex extraction (`/{[\s\S]*}/`) → fallback |
| **Over-escalation** | `validateDecisionAgainstGuidelines()` checks for conflicts |
| **Under-escalation** | Deterministic gatekeepers override AI for critical conditions |
| **Confidence Scoring** | Confidence degrades when risk factors are inconsistent or data is sparse |
| **Audit Trail** | Every decision gets a `decisionId`, timestamp, and referenced guidelines |
| **Rate Limiting** | Graceful handling of `429 Quota Exceeded` → mock response with notification |
| **CORS** | Configurable via `CORS_ORIGIN` env var (defaults to `*`) |

### Fallback Mock Response

When Vertex AI is unavailable or returns errors, the system generates a complete mock response:
- Risk score: 7 (`CLINIC_VISIT`)
- Confidence: 88%
- Full bilingual reasoning, action plan, and outcome
- Role-specific insights for all 4 roles
- WhatsApp notification template

This ensures the **frontend never crashes** regardless of backend AI status.

---

## 11. Batch Processing

**File:** `src/ai/batch-processor.ts`

### Daily Trend Analysis (`processDailyTrends()`)

For each patient in Firestore:
1. Fetch last 7 days of check-in data
2. Convert to `WearableDataPoint[]` time series
3. Run analytics engine (trends, risk factors, decline patterns)
4. Store trend snapshot to Firestore
5. If combined risk ≥ 6 → generate full AI decision via Vertex AI
6. Store decision to Firestore

### Weekly Cohort Analysis (`processWeeklyCohortAnalysis()`)

Aggregates population-level statistics:
- Total patient count
- Average risk score
- Critical patient count (risk ≥ 9)

---

## 12. Dashboard Intelligence

**File:** `src/ai/dashboard-service.ts`

### WhatsApp Integration

| Function | Purpose |
|---|---|
| `generateWhatsAppPayload()` | Encodes bilingual alert message for URL |
| `generateWhatsAppDeepLink()` | Builds `wa.me/{phone}?text={payload}` deep link |

Phone numbers are auto-formatted to Malaysian format (`60XXXXXXXXX`).

### Clinical Summary Generator

`generateClinicalSummary()` produces formatted text reports in both English and Bahasa Malaysia, containing:
- Patient identity & decision ID
- Risk assessment (score + confidence)
- Clinical reasoning
- Recommended action & action plan
- Applied medical guidelines

### Cohort Summary

`generateCohortSummary()` aggregates patient-level insights into:
- Risk distribution (critical / high / moderate / stable)
- Average risk score
- Urgent action count for the day

---

## 13. AI Data Flow Diagram

```
Wearable Device (Smartwatch)
        │ Heart Rate, Steps, Sleep
        ▼
Patient Check-In (UserView)
        │ Response, Days since last check-in
        ▼
Frontend Dashboard Service (dashboard-service.ts)
        │ HTTP REST → Express Backend
        ▼
Express AI Server (server.ts, port 3000)
        │
        ├─[Deterministic Gatekeeper]─────────────────────────────────────────┐
        │  If daysSinceLastCheckin > 1 AND dailySteps < 50                   │
        │  → Immediate CALL_999 (bypass AI entirely)                         │
        │                                                                     │
        ├─[Analytics Engine]──────────────────────────────────────────────────┤
        │  computeTrendMetrics()                                              │
        │  aggregateRiskFactors()          RiskFactors { cv, mobility,       │
        │  detectDeclinePatterns()  ────►  engagement, social, combined }    │
        │                                                                     │
        ├─[RAG Pipeline]──────────────────────────────────────────────────────┤
        │  buildSearchQuery(riskFactors)                                      │
        │  Vertex AI Search REST API  ──► MedicalGuideline[]                 │
        │  (fallback: mock KNOWLEDGE_BASE)                                    │
        │                                                                     │
        ├─[Prompt Construction]───────────────────────────────────────────────┤
        │  buildRAGEnrichedPrompt()                                           │
        │  HEART_SYSTEM_PROMPT                                                │
        │  Patient data + trend analysis + pattern labels                     │
        │                                                                     │
        └─[Gemini 2.5 Flash via Vertex AI SDK]                               │
                │  JSON response                                              │
                ▼                                                             │
        [JSON Parse + Validation + Confidence Assessment] ◄──────────────────┘
                │
                ├──► Firestore (decision stored)
                ├──► Role Dashboards (via REST → React SPA)
                └──► WhatsApp Deep Links (family notification)
```

---

## 14. Type System

**Files:** `src/ai/types.ts`, `src/ai/schemas.ts`

### Core Interfaces

| Interface | Purpose |
|---|---|
| `MultilingualText` | `{ en: string, ms: string }` — bilingual content |
| `WearableDataPoint` | Raw smartwatch telemetry (HR, steps, sleep, activity) |
| `PatientBaseline` | Patient's personal normal values for normalization |
| `TrendMetrics` | Computed velocities, anomalies, trend direction |
| `RiskFactors` | Multi-factor risk scores (CV, mobility, engagement, social, combined) |
| `CareDecision` | Full decision record with audit trail |
| `CaregiversInsights` | Dashboard-ready intelligence payload per patient |
| `MedicalGuideline` | RAG-retrieved clinical guideline entry |
| `EmergencyContact` | Malaysian phone format contact for WhatsApp |
| `PatientProfile` | Patient identity with contacts & language preference |
| `ErrorResponse` | Standardized API error format with trace ID |

---

*Last updated: May 2026 | Model: Gemini 2.5 Flash | Platform: Google Cloud Vertex AI*
