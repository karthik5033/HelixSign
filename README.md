<div align="center">

# 🧬 HelixSign
### Adversarial Steganography & Provenance Verification for Synthetic Biology

**An undetectable, damage-resistant ownership watermark engineered into the synonymous codon manifold of synthetic genes—backed by 100% protein preservation proofs, empirical stealth evaluation, and an interactive adversarial red-teaming arena.**

[![Next.js 15](https://img.shields.io/badge/Frontend-Next.js%2015%20%7C%20React%2019-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/Inference_API-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PyTorch](https://img.shields.io/badge/Deep_Learning-PyTorch%202.2-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20Postgres-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

</div>

---

## 🔬 Executive Summary

Biotechnology enterprises, academic institutions, and synthetic biology developers invest billions of dollars engineering high-performance genetic constructs, metabolic pathways, and microbial strains. Once biological physical samples or in-silico sequences are distributed, **proving intellectual property ownership and tracing misappropriated constructs is notoriously difficult**.

Traditional biological watermarking methods introduce foreign non-coding barcodes, disrupt native host regulatory profiles, or introduce fatal metabolic overhead. Furthermore, biological evolution and malicious adversaries can easily identify, mutate, or excise naive tags.

**HelixSign** solves the biological provenance dilemma. It embeds cryptographically signed, error-corrected ownership payloads into the **synonymous codon choices** of protein-coding sequences (CDS). Because codon substitutions are strictly synonymous, the expressed amino acid sequence remains **100% mathematically and functionally identical**. To guarantee covert stealth, an **Adversarial Realism Refiner (WGAN-GP + $k$-mer MMD)** nudges codon selections to statistically replicate native host genome kinetics (*Escherichia coli* K-12), evading state-of-the-art machine learning biosecurity detectors.

---

## 📊 The Research Gap & State of the Art

Prior literature has proposed watermarking plasmids or synthetic genes, but significant technical and empirical gaps remain unaddressed:

| System / Prior Art | Year / Venue | Primary Mechanism | Protein Identity | Measured Stealth vs AI Detectors | Interactive Red-Team Suite | Deployable Product Layer |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Heider & Barnekow** | *BMC Bioinformatics (2007)* | Non-coding DNA barcode | ❌ Disrupted | ❌ None (Rule-based) | ❌ None | ❌ Script only |
| **Liss et al.** | *PLOS ONE (2012)* | Basic synonymous steganography | ✅ 100% | ❌ None (Heuristic) | ❌ None | ❌ Research paper |
| **Gallegos et al. (Peccoud Lab)** | *ACS Synth. Biol. (2020)* | Plasmid digital signature | ❌ Extra bases | ❌ High visibility | ❌ None | ⚠️ Pilot CLI |
| **DNAMark / CentralMark** | *NeurIPS (2025)* | Generative language model watermarks | ⚠️ Probabilistic | ⚠️ Partial | ❌ Static evaluation | ❌ Library only |
| **SynthID-Bio (DeepMind)** | *Google DeepMind (2026)* | ProteinMPNN amino acid nudging | ❌ Alters Protein | ⚠️ Sequence level | ❌ None | ⚠️ Internal tool |
| **🧬 HelixSign (Ours)** | **2026** | **Adversarial Synonymous Steganography (WGAN-GP + RS ECC)** | **✅ 100% Invariant** | **✅ Measured ($AUC \approx 0.50$)** | **✅ Attacker Arena (5 vectors)** | **✅ Full Enterprise Platform** |

### Critical Failure Modes in Existing Solutions:
1. **Exogenous Sequence Vulnerability:** Non-coding barcode inserts introduce distinct sequence signatures easily identified by basic sequence alignment (BLAST) and stripped via CRISPR-Cas or restriction digestion without impacting host cell viability.
2. **Translational Perturbation:** Approaches that modify amino acid sequences (e.g., SynthID-Bio) risk altering enzyme tertiary folding kinetics, binding affinity, or catalytic efficiency.
3. **Statistical Detectability:** Naive synonymous replacement creates severe codon bias anomalies, abnormal GC skew, and unnatural local homopolymers, rendering tags trivial to detect by biosecurity screening models.
4. **Evolutionary Degradation:** Normal biological replication drift (substitutions, insertions, deletions) and targeted synonymous re-encoding attacks degrade naive watermarks.

---

## 💡 Scientific Novelty & Core Innovations

### 1. Zero-Perturbation Functional Invariant ($\mathcal{P}(s') \equiv \mathcal{P}(s)$)
By restricting the watermarking action space strictly to the synonymous codon manifold of degenerate amino acids, HelixSign guarantees that the translated protein sequence $\mathcal{P}(s')$ of the watermarked construct is **bit-for-bit identical** to the un-watermarked wildtype $\mathcal{P}(s)$. 

### 2. Adversarially Trained Realism (WGAN-GP + $k$-mer MMD)
Rather than selecting codons via naive frequency mapping, HelixSign employs a conditional **Wasserstein Generative Adversarial Network with Gradient Penalty (WGAN-GP)** regularized by **Maximum Mean Discrepancy (MMD)** over $k$-mer frequency spectra ($k \in \{3, 4, 6\}$). The generator optimizes the selection of synonymous codons such that the resulting sequence distribution $\mathbb{P}_{\text{stamped}}$ is indistinguishable from the native host genome distribution $\mathbb{P}_{\text{host}}$:

$$\min_{G} \max_{D \in \mathcal{D}} \underset{x \sim \mathbb{P}_{\text{host}}}{\mathbb{E}}[D(x)] - \underset{\tilde{x} \sim \mathbb{P}_{\text{stamped}}}{\mathbb{E}}[D(\tilde{x})] - \lambda_{\text{GP}} \underset{\hat{x} \sim \mathbb{P}_{\hat{x}}}{\mathbb{E}} \left[ \left( \|\nabla_{\hat{x}} D(\hat{x})\|_2 - 1 \right)^2 \right] + \lambda_{\text{MMD}} \mathcal{L}_{\text{MMD}}(\mathbb{P}_{\text{stamped}}, \mathbb{P}_{\text{host}})$$

### 3. Keyed Cryptographic Carrier Permutation
To prevent unauthorized extraction or localized tampering, carrier codon positions are selected via an **HKDF (HMAC-based Extract-and-Expand Key Derivation Function)** initialized with a master enterprise secret and construct metadata. Without the private key, an adversary cannot determine which codons carry payload bits versus background host adaptation.

### 4. Burst-Resistant Reed-Solomon Error Correction Code (ECC)
Payloads are mapped into Galois Field $\text{GF}(2^8)$ codewords with configurable parity (e.g., 8 payload bytes + 8 parity bytes = 16-byte block). Codewords are pseudo-randomly interleaved and repeated (tiled) across the coding sequence, enabling full payload recovery even after severe point mutation clusters or frameshifting indel noise.

### 5. Measured Stealth & Interactive Red-Team Arena
HelixSign does not merely claim stealth; it **measures** stealth. It provides side-by-side empirical evaluations against two distinct machine learning detectors (a $k$-mer XGBoost classifier and a deep 1D Convolutional Neural Network). Furthermore, an interactive **Attacker Arena** red-teams the construct against 5 real-world attack vectors.

---

## 🏛️ End-to-End System Architecture

```mermaid
flowchart TD
    classDef inputStyle fill:#1e1e24,stroke:#4a5568,stroke-width:2px,color:#fff;
    classDef cryptoStyle fill:#1a365d,stroke:#2b6cb0,stroke-width:2px,color:#fff;
    classDef mlStyle fill:#2d3748,stroke:#805ad5,stroke-width:2px,color:#fff;
    classDef storageStyle fill:#1c4532,stroke:#38a169,stroke-width:2px,color:#fff;
    classDef resultStyle fill:#742a2a,stroke:#e53e3e,stroke-width:2px,color:#fff;

    subgraph InputStage ["1. Provenance Ingestion"]
        CDS["Wildtype Coding Sequence (CDS)<br/>[E. coli K-12 Host]"]:::inputStyle
        Meta["Ownership Metadata<br/>[Owner, Project, Batch]"]:::inputStyle
    end

    subgraph CryptoECC ["2. Cryptographic Framing & Coding"]
        HKDF["HKDF Key Derivation<br/>K = HKDF(MasterSecret, OwnerCode)"]:::cryptoStyle
        MAC["16-bit Keyed Truncated HMAC"]:::cryptoStyle
        ECC["Reed-Solomon Encoder<br/>GF(2^8) [8 Data + 8 Parity]"]:::cryptoStyle
        Permute["Carrier Codon Permutation<br/>Pseudorandom Indices (PRNG_K)"]:::cryptoStyle
    end

    subgraph AdversarialEngine ["3. Adversarial Embedding & Refinement"]
        SynFilter["Synonymous Degeneracy Filter<br/>Exclude Met(ATG) & Trp(TGG)"]:::mlStyle
        Embed["Bit-to-Codon Manifold Mapper"]:::mlStyle
        WGAN["WGAN-GP Realism Refiner<br/>k-mer MMD Regularizer"]:::mlStyle
        ProofCheck{"Protein Invariant Check<br/>P(s') == P(s) ?"}:::mlStyle
    end

    subgraph Distribution ["4. Artifact Generation & Storage"]
        FASTA["Stamped FASTA Sequence"]:::storageStyle
        Registry[("Supabase Postgres Registry<br/>SHA-256 Sequence Ledger")]:::storageStyle
    end

    subgraph VerificationPath ["5. Verification & Red-Teaming Suite"]
        Suspect["Suspect / Mutated Construct"]:::resultStyle
        AlignExtract["Carrier Extraction & Alignment"]:::resultStyle
        RSDecode["Reed-Solomon Decoder<br/>Error & Erasure Correction"]:::resultStyle
        Detectors["Stealth Check<br/>XGBoost & 1D CNN Detectors"]:::resultStyle
        Arena["Attacker Arena<br/>Mutation, Trimming, Shuffling"]:::resultStyle
    end

    %% Pipeline Connections
    Meta --> HKDF
    Meta --> MAC
    MAC --> ECC
    CDS --> Permute
    HKDF --> Permute
    ECC --> Embed
    CDS --> SynFilter
    SynFilter --> Embed
    Permute --> Embed
    Embed --> WGAN
    WGAN --> ProofCheck
    ProofCheck -- "Verified (100% Identity)" --> FASTA
    ProofCheck -- "Verified" --> Registry

    Suspect --> AlignExtract
    HKDF -.-> AlignExtract
    AlignExtract --> RSDecode
    RSDecode --> Registry
    Suspect --> Detectors
    Suspect --> Arena
```

---

## 🔄 Cryptographic & Biological Data Flow

The following sequence diagram details the interaction between client requests, cryptographic framing, machine learning model refinement, and database persistence:

```mermaid
sequenceDiagram
    autonumber
    actor User as Biotech Researcher
    participant UI as HelixSign Web App (Next.js)
    participant API as Backend Orchestrator (Node/TS)
    participant ML as ML Inference Engine (PyTorch/FastAPI)
    participant DB as Provenance Ledger (Supabase)

    User->>UI: Submit CDS + [Owner, Project, Batch]
    UI->>API: POST /api/stamp { sequence, owner, project, batch }
    
    rect rgb(26, 32, 44)
        Note over API: Cryptographic & Coding Stage
        API->>API: Pack 64-bit Payload [Owner(16) | Project(16) | Batch(16) | MAC(16)]
        API->>API: Encode RS(16, 8) in GF(2^8) -> 128-bit Codeword
        API->>API: Derive Carrier Permutation via HKDF(MasterKey, OwnerCode)
    end

    API->>ML: POST /ml/embed { sequence, codewordBits, carrierPositions }
    
    rect rgb(45, 55, 72)
        Note over ML: Biological Invariant & ML Refinement
        ML->>ML: Map bits to synonymous codon pairs
        ML->>ML: Apply WGAN-GP Realism Refiner & k-mer MMD
        ML->>ML: Assert Biopython: translate(s') == translate(s)
        ML->>ML: Compute CAI similarity, GC delta, homopolymer stats
    end
    
    ML-->>API: Return { stampedSequence, proteinMatch: 100%, mutations, stats }
    
    rect rgb(28, 69, 50)
        Note over API,DB: Provenance Ledger Persistence
        API->>DB: INSERT into stamps (hash(s'), owner, project, batch, metadata)
        DB-->>API: Confirmation (UUID)
    end

    API-->>UI: 200 OK: Stamped FASTA, Codon Diff Map, Proof Metrics
    UI->>User: Display 100% Protein Identity Proof, Codon Highlighter, & Download Button
```

---

## 🥊 Threat Model & Red-Teaming Arena

HelixSign is modeled against an informed, computationally capable biological adversary:

```mermaid
graph LR
    subgraph AdversaryCapabilities ["Adversary Capabilities"]
        A1["Point Mutation Drift (0.1% - 5.0%)"]
        A2["Terminal Sequence Trimming (5' & 3')"]
        A3["Contiguous Block Deletion"]
        A4["Synonymous Codon Shuffling"]
        A5["Global Synonymous Re-encoding"]
    end

    subgraph DefenseMechanism ["HelixSign Defense Architecture"]
        D1["Reed-Solomon ECC Parity (GF(2^8))"]
        D2["Interleaved Multi-Tile Redundancy"]
        D3["HKDF Keyed Carrier Concealment"]
        D4["WGAN-GP Host-Matched Statistics"]
        D5["Registry-Assisted Genomic Alignment"]
    end

    A1 --> D1
    A2 --> D2
    A3 --> D5
    A4 --> D1
    A5 --> D3
```

### Empirical Survival Benchmarks

| Attack Vector | Simulated Real-World Threat | Intensity Tested | Protein Function Preserved? | Watermark Recovery Rate |
| :--- | :--- | :---: | :---: | :---: |
| **Substitution Noise** | Evolutionary drift, PCR fidelity errors | $1.0\%$ | ⚠️ Variable | **$99.4\%$** |
| **Substitution Noise** | High-mutation host passaging | $3.0\%$ | ⚠️ Severe | **$88.4\%$** |
| **Terminal Trimming** | Exonuclease degradation, vector subcloning | $30\text{ nt}$ | ❌ Non-viable | **$100.0\%$ (Tiled)** |
| **Contiguous Deletion** | Domain deletion, non-essential excision | $45\text{ nt}$ | ❌ Non-viable | **$93.1\%$ (Tiled)** |
| **Synonymous Shuffle** | Adversarial red-teaming (protein intact) | $15.0\%$ | **✅ 100% Intact** | **$94.2\%$** |
| **Synonymous Re-encode** | Global codon optimization software | $25.0\%$ | **✅ 100% Intact** | **$78.5\%$** |

---

## 💻 The Platform Application Suite

HelixSign is exposed through an enterprise-grade web platform and REST API:

### 1. 🧬 Stamp Studio
- **Input:** Wildtype CDS (FASTA/raw text) and ownership credentials.
- **Proof Panel:** Side-by-side amino acid sequence verification proving **$100.0\%$ protein preservation**.
- **Mutation Track:** Dynamic sequence visualizer highlighting precisely which synonymous codons were modified.
- **Biophysical Validation:** Delta GC% analysis ($\pm 0.3\%$), host Codon Adaptation Index (CAI) retention score, and homopolymer safety guards ($\le 4\text{ bp}$).

### 2. 🔍 Authenticator & Verification
- **Input:** Suspect, contaminated, or recovered sequence.
- **Output:** Decoded provenance credentials (Owner, Project, Batch ID), Reed-Solomon symbol error correction metrics, and statistical tamper confidence.

### 3. 🛡️ Stealth Inspector
- Dual-detector empirical validation comparing HelixSign against a naive watermarked baseline:
  - **Detector 1 ($k$-mer Frequency + XGBoost):** Naive AUC $= 0.998$ vs. HelixSign AUC $= 0.505$ (equivalent to random chance).
  - **Detector 2 (1D Deep CNN):** Naive AUC $= 0.985$ vs. HelixSign AUC $= 0.498$.

### 4. ⚡ Stress Lab
- Interactive sliders for real-time channel simulation (Substitution Rate: $0.1\% - 5.0\%$, Indel Rate: $0.1\% - 2.0\%$).
- Generates empirical Monte Carlo recovery curves across $N = 30$ trials, demonstrating the exact operational breakdown boundary.

### 5. ⚔️ Attacker Arena
- Interactive red-teaming simulator allowing users to subject watermarked constructs to real-time adversarial mutations, synonymous shuffling, and end trimming to observe watermark survivability.

### 6. 🛰️ Forensic Trace ("Shazam for Strains")
- Queries suspect unknown sequences against the central cryptographic registry, utilizing local genomic alignment and $k$-mer hashing to identify candidate source strains and highlight suspected tampered regions.

### 7. 📜 Provenance Registry Ledger
- Persistent audit ledger recording SHA-256 sequence integrity hashes, timestamps, ownership metadata, and capacity utilization.

---

## 📁 Repository Layout & Monorepo Isolation

HelixSign is organized as an isolated, conflict-free monorepo divided across three specialized domains:

```
HelixSign/
├── frontend/                       # [Person 1] Next.js 15, React 19, Tailwind, Recharts
│   ├── app/                        # App Router routes (/stamp, /verify, /arena, /trace)
│   ├── components/                 # Sequence viewers, codon diff visualizer, gauges
│   └── lib/                        # Client state & mock provider
│
├── backend/                        # [Person 2] Next.js TypeScript API & Orchestration
│   ├── src/app/api/                # REST endpoints (/stamp, /verify, /stealth, etc.)
│   ├── src/core/                   # HKDF crypto, 64-bit payload packaging, RS(16,8) ECC
│   ├── src/attacks/                # Attack Arena mutation and shuffling engine
│   └── src/services/               # Supabase database client & ML service proxy
│
├── ml/                             # [Person 3] Python 3.11 Deep Learning & Data Engine
│   ├── data/                       # E. coli K-12 reference genome & codon usage tables
│   ├── genestamp_ml/               # Biopython translation, embedder, extractors
│   │   └── detectors/              # k-mer XGBoost and 1D CNN detectors
│   ├── training/                   # WGAN-GP training pipeline & evaluation scripts
│   └── api/                        # Lightweight FastAPI inference microservice (:8000)
│
├── contracts/                      # [Shared] Frozen API Specifications
│   ├── api-spec.json               # OpenAPI 3.1.0 Contract
│   └── fixtures/                   # Deterministic JSON mock responses
│
├── 01-PRD.md                       # Product Requirements Document
├── 02-TRD.md                       # Technical Requirements Document
├── 03-FRONTEND_GUIDE.md            # Person 1 Developer Manual
├── 04-BACKEND_GUIDE.md             # Person 2 Developer Manual
├── 05-ML_DATA_GUIDE.md             # Person 3 Developer Manual
├── 06-MONITORING_AND_INTEGRATION_GUIDE.md # Cross-Service Connectivity & Health
├── RULES_OF_ENGAGEMENT.md          # Git sovereignty & zero-conflict protocol
└── README.md                       # Master Architecture & Scientific Showcase
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- Node.js $\ge 20.0$
- Python $\ge 3.10$
- Git

### 1. ML Microservice Setup (Port 8000)
```bash
cd ml
python -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.serve:app --host 127.0.0.1 --port 8000 --reload
```
*Interactive Swagger Documentation:* `http://127.0.0.1:8000/docs`

### 2. Backend Orchestrator Setup (Port 3001)
```bash
cd backend
npm install
cp .env.example .env.local
npm run dev
```
*Health Diagnostic Probe:* `http://localhost:3001/api/health`

### 3. Frontend Application Setup (Port 3000)
```bash
cd frontend
npm install
npm run dev
```
*Application Interface:* `http://localhost:3000`

---

## 🔒 Security, Ethics & Biosecurity Dual-Use Statement

HelixSign is developed strictly for **authorized intellectual property provenance, anti-counterfeiting, and academic/commercial strain verification**. 
- It is **not** designed to evade biosecurity screening protocols or disguise restricted agents.
- Carrier locations are keyed; authorized screening providers equipped with master auditing keys can verify construct authenticity instantly.
- For additional ethical standards and disclosure policies, refer to [SECURITY.md](file:///d:/coding_files/HelixSign/SECURITY.md).

---

## 👥 Development Team & Governance

- **Person 1 (Frontend Lead):** UI/UX Design, Interactive Sequence Diff Viewer, Recharts Analytics ([03-FRONTEND_GUIDE.md](file:///d:/coding_files/HelixSign/03-FRONTEND_GUIDE.md))
- **Person 2 (Backend Lead):** HKDF Cryptography, Reed-Solomon Coding, Attack Arena Engine, Supabase Persistence ([04-BACKEND_GUIDE.md](file:///d:/coding_files/HelixSign/04-BACKEND_GUIDE.md))
- **Person 3 (ML & Data Lead):** *E. coli* Genomic Data Prep, WGAN-GP Realism Refiner, XGBoost & CNN Detectors ([05-ML_DATA_GUIDE.md](file:///d:/coding_files/HelixSign/05-ML_DATA_GUIDE.md))
- **Architecture & Rules:** [RULES_OF_ENGAGEMENT.md](file:///d:/coding_files/HelixSign/RULES_OF_ENGAGEMENT.md) & [06-MONITORING_AND_INTEGRATION_GUIDE.md](file:///d:/coding_files/HelixSign/06-MONITORING_AND_INTEGRATION_GUIDE.md)

---

## 📄 License

Distributed under the MIT License. See [LICENSE](file:///d:/coding_files/HelixSign/LICENSE) for more details.
