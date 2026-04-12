


# JurisGenie — Deterministic Legal Infrastructure Stack

**Production-grade AI contract intelligence and execution engine** built on strict deterministic principles.

Turn any legal document (PDF, contract, judgment) into structured, verifiable, and blockchain-anchored smart contracts — with zero hallucination risk in the execution layer.

Built **completely solo over 2 months** for real-world legal, banking, and insurance use cases in India and globally.

---

### ✨ Key Highlights

- **Deterministic Execution Engine** — Same input always produces the same output
- **Full 8-Stage Pipeline** — From raw PDF → AI extraction → compliance → state machine → blockchain anchor
- **Zero Black-Box AI** in critical paths — Core logic is pure functions with cryptographic verification
- **Two Experience Modes**:
  - **Pro Dashboard** — Advanced analytics, State Machine, Attack Simulator, Knowledge Graph
  - **Classic Quick Mode** — Fast upload + AI chat for instant risk analysis

---

### 🚀 Live Demos

**Pro Version** (Full Platform – Recommended)  
→ [https://jurisgenie-pro-6ijp.onrender.com](https://jurisgenie-pro-6ijp.onrender.com/pro)

**Quick Analysis + AI Chat** (Fast risk scan)  
→ [https://jurisgenie-classic-6ijp.onrender.com/upload.html](https://jurisgenie-classic-6ijp.onrender.com/upload.html)

---

### High-Level Architecture

| Layer | Component              | Purpose                                      |
|-------|------------------------|----------------------------------------------|
| L7    | Pro UI                 | Next.js Advanced Dashboard + Visualizations  |
| L6    | Gateway                | Unified entry point (Classic vs Pro)         |
| L6    | Platform               | REST API + SQLite + Orchestration            |
| L5    | Execution              | State Machine + Obligation Lifecycle         |
| L4    | Engine                 | Deterministic Rule Evaluation (Pure Function)|
| L3    | Core                   | Serialization, SHA-256 Hashing, Legal Invariants |
| AI    | Inference Engine       | RAG + Gemini Pro for clause extraction       |

---

### Core Guarantees

1. **Determinism** — `evaluate(input) === evaluate(input)` on any machine
2. **Purity** — Core logic (L3–L5) performs zero I/O
3. **Cryptographic Integrity** — Every result is SHA-256 hashed and verifiable
4. **AI Firewall** — Human-in-the-loop before AI data enters execution layer
5. **Production Observability** — Real-time metrics (AI: ~345ms, Engine: ~12ms, Blockchain: ~8.9s)

---

### Prerequisites

- Node.js ≥ 20.0.0
- pnpm
- Google Gemini API Key
- Pinecone API Key (optional for full RAG)

### Quick Start

```bash
# Clone and install
git clone <repo-url>
cd jurisgenie
pnpm install

# Run full stack (Gateway + Pro UI + Backend)
pnpm run dev:all
```

Ports:
- 8000 → Gateway (Classic + Pro routing)
- 3000 → Pro Dashboard
- 3001 → Backend API

---

### Deployment

Pre-configured for **Render Blueprints**.  
Just connect this repo to Render — it will auto-deploy:

- `jurisgenie-classic` (Quick Analysis)
- `jurisgenie-backend`
- `jurisgenie-pro` (Full Dashboard)

See `render.yaml` for complete configuration.

---

### Project Structure

```
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

**Built solo in 2 months with real-world legal pain in mind.**

Perfect for banks, insurance companies, law firms, and SMEs dealing with contract risk and disputes.

---

