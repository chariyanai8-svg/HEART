# 🧠 HEART — AI Architecture

> This document describes the complete AI system design of **HEART** (Homecare & Emergency AI Routing Technology), including models, decision flows, the RAG pipeline, analytics engine, and the escalation framework.

---

## 1. AI System Overview

HEART is an **autonomous care decision engine** that analyzes elderly patient wearable telemetry (smartwatch data) and determines the appropriate level of care intervention. The AI operates across two modes:

- **Snapshot Mode** — Fast 3-signal assessment (heart rate, steps, check-in lag)
- **Enhanced Mode** — Full trend-aware analysis with RAG-enriched clinical context

The system is designed to detect **gradual behavioral decline**, not just acute emergencies — a key distinction in elderly homecare monitoring.

---

## 2. AI Models

### Primary Model — Gemini 2.5 Flash

| Attribute | Value |
|---|---|
| **Model ID** | `gemini-2.5-flash` |
| **Provider** | Google Cloud — Vertex AI |
| **Access Method** | `@google-cloud/vertexai` SDK |
| **Region** | `asia-southeast1` (Singapore) |
| **Authentication** | GCP Service Account (IAM) |

**Usage in HEART:**

| Function | Temperature | Max Tokens | Response Format |
|---|---|---|---|
| Snapshot Decision (`/api/care-decision/snapshot`) | `0.3` | `2048` | `application/json` |
| Enhanced Decision (`/api/care-decision/enhanced`) | `0.3` | `2048` | `application/json` |
| Batch Decision (`/api/care-decision/batch`) | `0.3` | `2048` | `application/json` |
| Chat Assistant (`/api/chat`) | `0.7` | `1024` | Plain text |

> **Low temperature (0.3)** is used for clinical decisions to ensure deterministic, evidence-based outputs.  
> **Higher temperature (0.7)** is used for the chat assistant to allow natural, conversational responses.

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

The AI backend exposes three decision flows, each with increasing sophistication:

### Flow 1 — Snapshot Decision (Fast Path)

```
Input: { averageHeartRate, dailySteps, daysSinceLastCheckin }
         ↓
[Deterministic Gatekeeper]
  If daysSinceLastCheckin > 1 AND dailySteps < 50
  → Immediate CALL_999 (bypass AI)
         ↓
[RAG Retrieval]
  Simulate risk profile from inputs
  → Retrieve matching clinical guidelines (Vertex AI Search or mock KB)
         ↓
[Gemini 2.5 Flash — JSON Mode]
  System Prompt: HEART_SYSTEM_PROMPT + RAG guidelines
  User Prompt:   Patient snapshot data
  Config:        temperature=0.3, maxTokens=2048, responseMimeType="application/json"
         ↓
Output: CareDecision JSON
```

**Use case:** Quick triage from wearable telemetry, triggered on a schedule or on-demand.

---

### Flow 2 — Enhanced Decision (Full Intelligence)

```
Input: { patientId, averageHeartRate, dailySteps, daysSinceLastCheckin,
         last7DaysAverageHeartRate, last7DaysAverageSteps,
         checkInResponseRate, missedCheckinsThisWeek, patientBaseline }
         ↓
[Baseline Normalization]
  Establish patient-specific reference metrics
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
  User Prompt:   Full trend analysis with deltas, velocities, pattern labels
  Config:        temperature=0.3, maxTokens=2048
         ↓
[Decision Validation]
  validateDecisionAgainstGuidelines()
  → Check for conflicts between risk score and recommended action
         ↓
[Confidence Assessment]
  assessDecisionConfidence(trends, riskFactors)
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

```
Input: EnhancedInput (same as Flow 2)
         ↓
[enhancedDecisionFlow()]
         ↓
Output: CareDecision (flattened for dashboard card rendering)
```

**Use case:** Populates role-specific dashboards (Doctor, Hospital, Operator views).

---

## 4. The Analytics Engine

**File:** `src/ai/analytics.ts`

The analytics engine processes raw wearable data before passing it to the AI model. This pre-processing ensures the LLM receives structured, quantified risk signals — not raw numbers.

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
```

#### Multi-Factor Risk Aggregation
Combines four risk dimensions with clinical weights:

| Risk Factor | Weight | Signal Source |
|---|---|---|
| Engagement Risk | **40%** | Check-in response rate, missed check-ins |
| Mobility Risk | **35%** | Step count vs. baseline, step velocity |
| Cardiovascular Risk | **20%** | Heart rate anomaly, heart rate velocity |
| Social Risk | **5%** | Static baseline (contextual factor) |

```
combinedRiskScore = engagementRisk×0.40 + mobilityRisk×0.35
                  + cardiovascularRisk×0.20 + socialRisk×0.05
```

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

---

## 5. RAG Pipeline (Retrieval-Augmented Generation)

**Files:** `src/ai/rag-system.ts`, `src/ai/rag-system-vertex.ts`, `src/ai/rag-system-mock.ts`

The RAG system grounds every AI decision in indexed medical evidence, preventing hallucination and ensuring guideline compliance.

### Architecture

```
[Risk Profile] → [Query Builder] → [Vertex AI Search REST API]
                                          ↓
                               [Result Parser] → [MedicalGuideline[]]
                                          ↓
                          [RAG Prompt Builder] → [Enriched System Prompt]
                                          ↓
                              [Gemini 2.5 Flash]
```

### Fallback Chain

```
Primary:  Vertex AI Search (live indexed corpus)
             ↓ (on error or empty results)
Fallback: Mock Knowledge Base (KNOWLEDGE_BASE in rag-system-mock.ts)
```

### Query Strategy

The search query is built dynamically from the patient's risk profile:

| Risk Signal | Generated Search Terms |
|---|---|
| Mobility Risk ≥ 7 | `"mobility decline collapse immobility elderly fall"` |
| Cardiovascular Risk ≥ 7 | `"cardiac heart rate arrhythmia tachycardia elderly"` |
| Engagement Risk ≥ 7 | `"unresponsive check-in engagement elderly care"` |
| Combined Critical (≥8, multi-factor) | `"emergency critical multi-factor deterioration"` |
| Default | `"gradual decline behavioral change elderly monitoring"` |

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
  retrievalSource: 'vertex_search' | 'mock';
}
```

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

| Condition | Auto-Action |
|---|---|
| `daysSinceLastCheckin > 1` AND `dailySteps < 50` | Immediate `CALL_999` (riskScore = 10) |
| Heart Rate > 100 OR < 50 with other declining signals | `CALL_999` |
| No check-in for 2+ days with declining vitals | Minimum `CLINIC_VISIT` |
| Steps declining > 50% from baseline | Minimum `FAMILY_CHECK` |

---

## 7. AI Output Schema

Every decision endpoint returns a structured JSON matching this schema:

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
  "referencedGuidelines": ["KKM_Geriatric_Care_v2", "NICE_Heart_Failure_2024"],
  "whatsappMessage": {
    "en": "HEART Alert: Patient requires a clinic visit...",
    "ms": "Amaran HEART: Pesakit memerlukan lawatan ke klinik..."
  }
}
```

---

## 8. Multi-Role AI Insights

The AI generates **role-specific insights** tailored to each consumer's context:

| Role | Insight Style | Audience |
|---|---|---|
| **Family** | Simple, empathetic, bilingual | Non-medical caregivers |
| **Field Unit** | Concise transmission summary | Paramedics / EMTs on-scene |
| **Doctor** | Detailed clinical assessment with baseline comparisons | Clinicians |
| **Operator** | Dispatch and triage instructions | Emergency response coordinators |

---

## 9. Chat AI Assistant

**Endpoint:** `POST /api/chat`

A conversational assistant powered by Gemini 2.5 Flash, designed for caregivers and operators to ask questions about patient status, interpret AI decisions, and get guidance.

| Attribute | Value |
|---|---|
| **Model** | Gemini 2.5 Flash |
| **Temperature** | 0.7 (conversational) |
| **Max Tokens** | 1024 |
| **Language** | English by default; Bahasa Malaysia on request |
| **Context** | Accepts optional `patientContext` object for grounded answers |
| **Scope** | Vital sign interpretation, care decision explanations, elderly care guidance, system help |

The assistant is instructed to:
- Avoid markdown formatting (plain text output for frontend rendering)
- Recommend calling 999 for any emergency symptoms
- Stay professional and evidence-based

---

## 10. AI Safety & Reliability Design

| Concern | Design Decision |
|---|---|
| **API Unavailability** | Full fallback chain: Vertex AI → deterministic rules → mock response |
| **Invalid JSON from LLM** | `try/catch` JSON parse with automatic fallback mock decision |
| **Safety Filter Truncation** | Detected via parse failure → fallback response injected |
| **Over-escalation** | Decision validation checks for conflicts between risk score and action |
| **Under-escalation** | Deterministic gatekeepers override AI for critical conditions |
| **Confidence Scoring** | Confidence degrades when risk factors are inconsistent or data is sparse |
| **Audit Trail** | Every decision gets a `decisionId`, timestamp, and referenced guidelines logged |

---

## 11. AI Data Flow Diagram

```
Wearable Device (Smartwatch)
        │ Heart Rate, Steps
        ▼
Patient Check-In (UserView)
        │ Response, Days since last check-in
        ▼
Dashboard Service (dashboard-service.ts)
        │ Aggregated EnhancedInput
        ▼
Express AI Server (server.ts)
        │
        ├─[Analytics Engine]──────────────────────────────────────────────────┐
        │  computeTrendMetrics()                                               │
        │  aggregateRiskFactors()          RiskFactors { cv, mobility,        │
        │  detectDeclinePatterns()  ────►  engagement, social, combined }     │
        │                                                                      │
        ├─[RAG Pipeline]───────────────────────────────────────────────────── ▼
        │  buildSearchQuery(riskFactors)                                       │
        │  Vertex AI Search REST API  ──► MedicalGuideline[]                  │
        │  (fallback: mock KNOWLEDGE_BASE)                                     │
        │                                                                      │
        ├─[Prompt Construction]──────────────────────────────────────────────┐ │
        │  buildRAGEnrichedPrompt()                                           │ │
        │  HEART_SYSTEM_PROMPT                                                │ │
        │  Patient data + trend analysis                                      │ │
        │                                                                     ▼ ▼
        └─[Gemini 2.5 Flash via Vertex AI]
                │  JSON response
                ▼
        [JSON Parse + Validation]
                │  validateDecisionAgainstGuidelines()
                ▼
        Care Decision Output
                │
                ├──► Firestore (decision stored)
                ├──► Role Dashboards (via REST)
                └──► WhatsApp Notification (if enabled)
```

---

*Last updated: May 2026 | Model: Gemini 2.5 Flash | Platform: Google Cloud Vertex AI*
