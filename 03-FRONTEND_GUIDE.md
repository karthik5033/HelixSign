# HelixSign - Frontend Developer Guide (Person 1)

**Owner:** Frontend Lead (Person 1 / You)  
**Assigned Folder:** `frontend/`  
**Tech Stack:** Next.js (App Router, TypeScript), Tailwind CSS, Lucide React, Recharts / Plotly, custom sequence visualizer  
**Role:** Complete ownership of the client application, user experience, data visualizations, sequence diff viewer, and presentation flow.

---

## 1. Executive Summary & Context

**HelixSign** is an adversarial DNA steganography and authenticity platform. It hides a compact, error-corrected ownership watermark (owner, project, batch, and keyed verification tag) inside the **synonymous codon choices** of an engineered gene.
- **Key Guarantee:** 100% protein identity preservation (the expressed protein is identical).
- **Stealth:** Indistinguishable from the host genome (*E. coli* K-12) under statistical and deep learning detectors.
- **Robustness:** Resilient to biological mutations and deliberate attacks via Reed-Solomon error correction.

> **UI Template Note:** You will be importing an existing Next.js UI template from a previous project into `frontend/` to reuse its layouts, design system, theme, and component structure. **Do not worry about leftover boilerplate or placeholder content**—your mission is simply to adapt that shell into HelixSign's pages, biology data fields, and interactive screens.

---

## 2. Zero-Conflict Golden Rules ("3-Folder Work")

To ensure all 3 team members work in parallel without git merge conflicts:

| Boundary Rule | Specification |
| :--- | :--- |
| **Your Exclusive Territory** | `frontend/**` (All components, pages, hooks, styles, public assets, and frontend-specific tests) |
| **Strictly Read-Only** | `contracts/` (API specifications and shared schemas) |
| **Off-Limits** | `backend/**` and `ml/**` — Never create, edit, or delete files in these folders! |
| **Dependencies** | Run `npm` / `pnpm` / `yarn` ONLY inside `frontend/`. Maintain `frontend/package.json`. |
| **Environment Config** | Use `frontend/.env.local`. Never commit `.env` or `.env.local` to git. Commit only `frontend/.env.example`. |

---

## 3. Git Branching & Collaboration Workflow

### Branch Strategy
- **Base Branch:** `develop` (never branch off another member's feature branch or `main`).
- **Your Branch Namespace:** `feat/frontend/<feature-name>`

Examples:
- `feat/frontend/ui-shell-and-theme`
- `feat/frontend/stamp-studio`
- `feat/frontend/stealth-and-stress-lab`
- `feat/frontend/attacker-arena`
- `feat/frontend/forensic-registry`

### Daily Git Routine
```bash
# 1. Switch to develop and get latest changes
git checkout develop
git pull origin develop

# 2. Rebase or merge develop into your feature branch to stay up to date
git checkout feat/frontend/stamp-studio
git merge develop

# 3. Work ONLY inside the frontend/ folder
git status # Ensure no backend/ or ml/ files are touched!

# 4. Commit with descriptive messages
git add frontend/
git commit -m "feat(frontend): implement codon diff highlight viewer"

# 5. Push and open PR targeting develop
git push origin feat/frontend/stamp-studio
```

---

## 4. Screens & Feature Specifications

You are responsible for implementing the following 7 core screens (mapped directly from the PRD and prototype):

### 1. Stamp Studio (P0 - Critical Path)
* **User Input:**
  - Owner / Organization Name (e.g., "ApexBio Lab")
  - Project Title (e.g., "Project Helios")
  - Batch ID / Construct Code (e.g., "B-2026-X1")
  - Host Organism Selector (Default: *Escherichia coli* K-12)
  - Coding Sequence (CDS) textarea (supports paste or `.fasta` upload; A/C/G/T validation, length % 3 == 0, recommended 600–3000 nt).
* **Live Capacity Meter:**
  - Dynamic indicator showing available synonymous codons vs. payload bits required.
* **Outputs & Visualization:**
  - **100% Protein Identity Proof:** Side-by-side amino acid sequence alignment proving 0 amino acid changes.
  - **Codon Mutation Diff Viewer:** DNA sequence display with modified synonymous codons highlighted in vibrant color (e.g., cyan/purple).
  - **Biophysical Health Cards:**
    - GC Content before vs. after (e.g., 50.8% -> 51.1%).
    - Host Codon Adaptation Index (CAI) similarity score.
    - Longest homopolymer check (must not exceed threshold, e.g. ≤ 4 bp).
  - **Download Button:** One-click `.fasta` export of the stamped sequence.

### 2. Verify & Authenticate (P0)
* **User Input:** Paste suspect sequence or upload FASTA file.
* **Outputs:**
  - **Verdict Badge:** `VERIFIED` (Green), `PARTIALLY RECOVERED` (Amber), or `NO STAMP FOUND` (Red).
  - **Decoded Provenance Card:** Verified Owner, Project, Batch, Timestamp.
  - **ECC Resilience Metric:** Number of bit errors detected and corrected by Reed-Solomon.
  - **Tamper Confidence Score:** 0–100% confidence meter.

### 3. Stealth Check (P0 - Demo Highlight)
* **Purpose:** Proves to judges that HelixSign is invisible compared to a naive watermark.
* **Layout:** Side-by-side detector comparison cards:
  - **Card A (Naive Tagging):** Flagged as synthetic/watermarked (Detector Score: > 98%, AUC ~ 1.0).
  - **Card B (HelixSign Steganography):** Indistinguishable from wildtype host DNA (Detector Score: ~ 50% chance level, AUC ~ 0.50).
* **Visuals:** Bar charts or radial gauges comparing k-mer frequency divergence and deep learning (1D CNN) synthetic probability.

### 4. Stress Lab (P0 - Interactive Simulator)
* **Interactive Controls:**
  - Substitution Rate Slider (0.1% to 5.0%).
  - Indel (Insertion/Deletion) Rate Slider (0.1% to 2.0%).
  - "Run Stress Test" action button (runs 20–50 simulated channel cycles).
* **Visuals:**
  - Line chart showing **Watermark Recovery Rate (%) vs. Mutation Noise Rate (%)**.
  - Honest "Breakdown Boundary" indicator showing where ECC capacity is exhausted.

### 5. Attacker Arena (P1)
* **Interactive Threat Test:**
  - Attack Selector: Point Mutations, 5'/3' End Trimming, Contiguous Block Deletion, Synonymous Codon Shuffling, Random Synonymous Re-encoding.
  - Intensity Slider (e.g., 5% to 30% recoding).
* **Results:**
  - Survival Verdict: "Watermark Survived" vs. "Watermark Broken".
  - Protein Functional Integrity Check: Confirms whether the attack broke the protein or not.

### 6. Forensic Trace ("Shazam for Strains") (P1)
* **User Input:** Upload an unknown, mutated, or contaminated DNA sequence.
* **Output:** Ranked list of matching constructs from the registry:
  - Match Candidate Name & Owner.
  - Sequence Similarity %.
  - Heatmap / Alignment Track showing suspected tampered/mutated regions.

### 7. Provenance Registry (P0 Minimal / P1 Full)
* **Features:**
  - Searchable, paginated table of stamped constructs.
  - Columns: Timestamp, Gene/Construct Name, Owner, Project, Sequence Hash (SHA-256), Action (View Details / Download FASTA).

---

## 5. Offline & Mock Mode (`NEXT_PUBLIC_USE_MOCKS=true`)

You do **NOT** need to wait for Person 2 (Backend) or Person 3 (ML) to finish their endpoints!

In `frontend/.env.local`:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NEXT_PUBLIC_USE_MOCKS=true
```

Create a client API service `frontend/src/services/api.ts` that checks `NEXT_PUBLIC_USE_MOCKS`:
- If `true`: Returns typed mock JSON fixtures instantly with a simulated 400ms network delay.
- If `false`: Sends `fetch()` requests to the Next.js backend API routes.

### Mock Schemas for Frontend Development

#### Mock Response: `POST /api/stamp`
```json
{
  "status": "success",
  "data": {
    "stampId": "stmp_e9b4a1c2",
    "owner": "ApexBio Lab",
    "project": "Project Helios",
    "batch": "B-2026-X1",
    "originalSequenceLength": 900,
    "stampedSequence": "ATGGCCAAG...TAA",
    "proteinTranslation": "MAK...*",
    "proteinIdentityPercent": 100.0,
    "mutations": [
      { "codonIndex": 14, "fromCodon": "GAA", "toCodon": "GAG", "aminoAcid": "E" },
      { "codonIndex": 28, "fromCodon": "CTG", "toCodon": "TTA", "aminoAcid": "L" }
    ],
    "stats": {
      "gcBefore": 51.2,
      "gcAfter": 51.4,
      "caiSimilarity": 0.985,
      "longestHomopolymer": 4,
      "capacityUsed": 64,
      "capacityTotal": 240
    },
    "createdAt": "2026-11-12T22:30:00Z"
  }
}
```

#### Mock Response: `POST /api/verify`
```json
{
  "status": "verified",
  "data": {
    "owner": "ApexBio Lab",
    "project": "Project Helios",
    "batch": "B-2026-X1",
    "errorsCorrected": 2,
    "confidenceScore": 0.994,
    "timestamp": "2026-11-12T22:30:00Z"
  }
}
```

#### Mock Response: `POST /api/stealth`
```json
{
  "data": {
    "naiveTag": {
      "kmerDetectorProb": 0.992,
      "cnnDetectorProb": 0.985,
      "aucScore": 0.998
    },
    "helixSign": {
      "kmerDetectorProb": 0.512,
      "cnnDetectorProb": 0.498,
      "aucScore": 0.505
    }
  }
}
```

---

## 6. Implementation Checklist & Milestones

- [ ] **Milestone 1: Repository Shell & Template Adaptation**
  - Extract/place template into `frontend/`.
  - Clean up unwanted pages; set up brand identity for **HelixSign** (logo, typography, dark/biotech theme).
  - Verify `npm run dev` builds cleanly on `http://localhost:3000`.
- [ ] **Milestone 2: Navigation & Mock Engine**
  - Set up navigation tabs / sidebar: *Stamp*, *Verify*, *Stealth Check*, *Stress Lab*, *Attacker Arena*, *Forensic Trace*, *Registry*.
  - Implement `NEXT_PUBLIC_USE_MOCKS` switch and mock data providers.
- [ ] **Milestone 3: Core P0 Screens**
  - Build **Stamp Studio** with DNA sequence validator and codon mutation highlighter.
  - Build **Verify** screen with provenance result badges.
  - Build **Stealth Check** visualizer with comparison charts (Recharts).
- [ ] **Milestone 4: Stress Lab & Attacker Arena (P0/P1)**
  - Implement noise sliders and reactive line charts in **Stress Lab**.
  - Implement attack configuration cards and survival indicators in **Attacker Arena**.
- [ ] **Milestone 5: Registry & Real Backend Integration**
  - Connect table view to `GET /api/registry`.
  - Flip `NEXT_PUBLIC_USE_MOCKS=false` to test against Person 2's live backend.
  - Add demo preset sequences (pre-loaded E. coli test genes) for smooth 3-minute presentations.

