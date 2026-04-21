


***

# JurisGenie — The Zero-Hallucination Legal AI Engine

**Contract disputes cost global businesses $150 Billion annually, but enterprises cannot rely on standard AI to fix it because LLMs hallucinate legal liabilities.** JurisGenie is a production-grade infrastructure stack that solves this. It forces probabilistic AI models into a mathematically verifiable, deterministic state machine. We turn static legal documents into structured, blockchain-anchored smart contracts—with absolute cryptographic certainty.

**Built entirely solo over 2 months** to solve real-world compliance, banking, and insurance pain points.

---

### ✨ Enterprise Business Value (Key Highlights)

- **Lawsuit-Proof Execution (Zero Hallucination)** — A strict deterministic engine ensures the same contract and event *always* produce the exact same outcome. AI extracts the data; hard math enforces the rules.
- **Automated Dispute Prevention** — A complete 8-stage pipeline (Raw PDF → AI Extraction → Compliance → State Machine → Blockchain Anchor) instantly highlights hidden liabilities before they become expensive litigation.
- **Enterprise-Grade Audit Trails** — Core logic runs on pure functions with cryptographic (SHA-256) verification. Contract events (like a delayed payment or missed delivery) are permanently anchored to an Ethereum testnet as tamper-proof facts.
- **Two Operational Modes**:
  - **Pro Dashboard** — For the compliance team: Advanced analytics, State Machine execution, Attack Simulator, and Knowledge Graphs.
  - **Classic Quick Mode** — For the front office: Fast upload + AI chat for instant risk analysis.

---

### 🚀 Live Demos (No Login Required)

**Pro Version** (Full Platform – Recommended for Technical/Audit Review)  
→ [https://jurisgenie-pro-6ijp.onrender.com](https://jurisgenie-pro-6ijp.onrender.com/pro)

**Quick Analysis + AI Chat** (Fast risk scan)  
→ [https://jurisgenie-classic-6ijp.onrender.com/upload.html](https://jurisgenie-classic-6ijp.onrender.com/upload.html)

---

### High-Level Architecture (The Trust Layer)

To eliminate unpredictability, JurisGenie isolates the AI to the extraction layer (Inference), while all execution and compliance occur in a deterministic sandbox (L3–L5).

| Layer | Component              | Purpose                                              |
|-------|------------------------|------------------------------------------------------|
| L7    | Pro UI                 | Next.js Advanced Dashboard + Visualizations          |
| L6    | Gateway                | Unified entry point (Classic vs Pro)                 |
| L6    | Platform               | REST API + SQLite + Orchestration                    |
| L5    | Execution              | State Machine + Obligation Lifecycle                 |
| L4    | Engine                 | Deterministic Rule Evaluation (Pure Function)        |
| L3    | Core                   | Serialization, SHA-256 Hashing, Legal Invariants     |
| AI    | Inference Engine       | RAG + Gemini Pro for clause extraction               |

---

### Core Guarantees for Risk & Compliance

1. **Absolute Determinism** — `evaluate(input) === evaluate(input)` on any machine, every single time.
2. **Purity** — Core logic (L3–L5) performs zero I/O, preventing external data corruption during execution.
3. **Cryptographic Integrity** — Every clause, obligation, and result is SHA-256 hashed and verifiable.
4. **AI Firewall** — Human-in-the-loop verification exists before AI-extracted data ever enters the execution layer.
5. **Production Observability** — Real-time telemetry prevents silent failures (AI Pipeline: ~345ms, Engine: ~12ms, Blockchain Anchor: ~8.9s).

---

### Quick Start (For Developers)

**Prerequisites:**
- Node.js ≥ 20.0.0
- pnpm
- Google Gemini API Key
- Pinecone API Key (optional for full RAG)

```bash
# Clone and install
git clone <repo-url>
cd jurisgenie
pnpm install

# Run full stack (Gateway + Pro UI + Backend)
pnpm run dev:all
```

**Local Ports:**
- `8000` → Gateway (Classic + Pro routing)
- `3000` → Pro Dashboard
- `3001` → Backend API

---

### Cloud Deployment

Pre-configured for **Render Blueprints**.  
Connect this repository to Render for instant microservice auto-deployment:

- `jurisgenie-classic` (Quick Analysis Node)
- `jurisgenie-backend` (REST API & State Machine)
- `jurisgenie-pro` (Next.js Dashboard)

*(See `render.yaml` for complete environment configuration).*

---

### Project Structure

```text
.
├── intelligence-engine/     # Gateway + Classic UI + RAG
├── packages/
│   ├── ui/                  # Next.js 14 Pro Dashboard
│   ├── platform/            # Express API + Persistence
│   ├── core/                # L3: Types + Hashing
│   ├── engine/              # L4: Deterministic Engine
│   └── execution/           # L5: State Machine
├── render.yaml
└── replace-urls.js
```

---

### Tech Stack

- **Frontend**: Next.js 14 + Tailwind + React Flow + Monaco Editor
- **Backend**: Node.js + Express + better-sqlite3
- **AI**: Google Gemini Pro + Pinecone Vector DB
- **Determinism**: Pure functions + Decimal.js + SHA-256
- **Build**: pnpm workspaces

---
*JurisGenie creates a world where contracts execute exactly as written, without ambiguity, without hallucination, and without costly litigation.*
