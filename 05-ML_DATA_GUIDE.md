# HelixSign - Data & ML Training Guide (Person 3)

**Owner:** Data & Machine Learning Lead (Person 3)  
**Assigned Folder:** `ml/`  
**Tech Stack:** Python 3.10+, PyTorch (CPU inference / GPU training), scikit-learn, XGBoost, Biopython, FastAPI / Uvicorn  
**Role:** Complete ownership of host biological datasets, codon frequency tables, the synonymous embedder/extractor, WGAN-GP realism refiner, detector suite, channel noise simulator, and the lightweight Python inference API.

---

## 1. Executive Summary & Context

**HelixSign** achieves covert, damage-resistant DNA watermarking by embedding error-corrected bits into the **synonymous codon choices** of an open reading frame.
- **Strict Biological Invariant:** The translated amino acid sequence must remain **100% identical** to the original gene. This is enforced by construction (structural restriction to synonymous codons only).
- **Adversarial Realism:** To evade detection, the distribution of synonymous codons must statistically match the host genome (*Escherichia coli* K-12). We train a **Wasserstein GAN with Gradient Penalty (WGAN-GP)** and a **k-mer Maximum Mean Discrepancy (MMD)** regularizer.
- **Stealth Evaluation:** We benchmark against two detectors (k-mer XGBoost and a 1D CNN). HelixSign must score near chance (AUC ~ 0.50), while a naive tag baseline gets easily caught (AUC ~ 1.0).

---

## 2. Zero-Conflict Golden Rules ("3-Folder Work")

To ensure frictionless parallel development with the Frontend and Backend leads:

| Boundary Rule | Specification |
| :--- | :--- |
| **Your Exclusive Territory** | `ml/**` (All Python packages, training scripts, data preparation pipelines, detector models, and the inference API) |
| **Strictly Read-Only** | `contracts/` (API schemas and frozen internal signatures) |
| **Off-Limits** | `frontend/**` (Next.js UI) and `backend/**` (Next.js TypeScript API server) |
| **Dependencies** | Maintain `ml/requirements.txt`. Do NOT use a global environment. Always work inside `ml/.venv/`. |
| **Model Weights & Large Files** | **NEVER commit weights (`*.pt`, `*.onnx`, `*.pkl`) or large raw FASTA files to git!** Add them to `ml/.gitignore`. Host model weights on Hugging Face Hub or load lightweight parameters directly. |

---

## 3. Git Branching & Collaboration Workflow

### Branch Strategy
- **Base Branch:** `develop`
- **Your Branch Namespace:** `feat/ml/<feature-name>`

Examples:
- `feat/ml/ecoli-data-and-codon-tables`
- `feat/ml/rule-based-embedder-extractor`
- `feat/ml/channel-noise-simulator`
- `feat/ml/kmer-and-cnn-detectors`
- `feat/ml/wgan-realism-refiner`
- `feat/ml/fastapi-inference-service`

### Daily Git Routine
```bash
# 1. Switch to develop and pull latest
git checkout develop
git pull origin develop

# 2. Merge develop into your feature branch
git checkout feat/ml/kmer-and-cnn-detectors
git merge develop

# 3. Work strictly inside ml/
git status # Ensure NO files outside ml/ are touched!

# 4. Commit and push
git add ml/
git commit -m "feat(ml): train k-mer XGBoost detector and evaluate held-out AUC"
git push origin feat/ml/kmer-and-cnn-detectors
```

---

## 4. Repository Layout (`ml/`)

```
ml/
├── data/
│   ├── download_ecoli.py            # Fetch E. coli K-12 MG1655 CDS from NCBI
│   ├── codon_usage_ecoli.json       # Precomputed E. coli K-12 codon frequency table
│   └── test_genes.fasta             # Standard held-out test genes for the demo (600-3000 nt)
├── genestamp_ml/                    # Importable core Python package
│   ├── __init__.py
│   ├── bio.py                      # Biopython translation, GC%, homopolymer & CAI checks
│   ├── embed.py                    # Eligible codon finder & synonymous bit embedder
│   ├── extract.py                  # Bit extractor returning soft probabilities
│   ├── naive.py                    # Naive watermark generator (for detector baseline)
│   ├── channel.py                  # Noise simulator (substitutions & indels)
│   └── detectors/
│       ├── kmer_detector.py        # k-mer frequency feature extraction + XGBoost
│       └── cnn_detector.py         # 1D CNN over one-hot DNA windows
├── training/
│   ├── train_detector.py           # Trains k-mer and CNN detectors
│   ├── train_refiner.py            # WGAN-GP adversarial realism refiner
│   └── evaluate.py                 # Generates AUC curves & recovery benchmarks
├── api/
│   └── serve.py                    # Lightweight FastAPI service for Person 2's backend
├── requirements.txt
├── .gitignore                      # Ignores .venv/, *.pt, *.bin, data/raw/
└── README.md
```

---

## 5. Technical Specifications & Machine Learning Design

### 5.1 Host Data & Biological Constraints (`genestamp_ml/bio.py`)
- **Target Host:** *Escherichia coli* K-12 MG1655.
- **Genetic Code:** Standard Bacterial (NCBI Translation Table 11).
- **Eligible Codons:** An amino acid is eligible if it has $\ge 2$ synonymous codons.
  - **Ineligible (Excluded):** Methionine (`ATG`) and Tryptophan (`TGG`) have degree 1 and are never modified.
- **100% Protein Identity Guarantee:** Every output sequence is verified with Biopython:
  ```python
  assert original_seq.translate(table=11) == stamped_seq.translate(table=11)
  ```
- **Bio-Safety Rules:**
  - Reject/dampen any choice creating homopolymer runs $\ge 5$ (e.g., `AAAAA`, `GGGGG`).
  - Maintain local GC content within $\pm 5\%$ of host average (~50.8%).

### 5.2 Embedder & Extractor (`genestamp_ml/embed.py` & `extract.py`)
1. **Rule-Based Baseline (Ship First):**
   - For each carrier codon assigned to carry 1 bit:
     - Bit `0`: map to the highest-frequency synonymous codon in the host.
     - Bit `1`: map to the second most frequent synonymous codon.
   - For amino acids with $\ge 3$ codons, alternate between top-frequency pairs to maintain natural balance.
2. **Extraction:**
   - Read codon at carrier position $\to$ compare against designated mapping $\to$ emit soft bit estimate (e.g., 0.99 for bit 1, 0.01 for bit 0) and confidence.

### 5.3 Realism Refinement: WGAN-GP (`training/train_refiner.py`)
When time permits, upgrade the rule-based embedder with an adversarial refiner:
- **Discriminator ($D$):** 1D CNN operating on one-hot encoded DNA windows ($L = 128$ bp), trained to distinguish native *E. coli* CDS from stamped CDS.
- **Refiner ($G$):** Adjusts synonymous codon selections within the allowed synonymous subset for each amino acid.
- **Total Loss:**
  $$\mathcal{L} = \mathcal{L}_{\text{WGAN-GP}} + \lambda_1 \mathcal{L}_{\text{kmer-MMD}} + \lambda_2 \mathcal{L}_{\text{bio}}$$
  - $\mathcal{L}_{\text{WGAN-GP}}$: Wasserstein distance with gradient penalty ($\lambda_{\text{GP}} = 10$).
  - $\mathcal{L}_{\text{kmer-MMD}}$: Maximum Mean Discrepancy over 3-mer and 4-mer frequency histograms.
  - $\mathcal{L}_{\text{bio}}$: Penalty on homopolymer runs and GC divergence.

### 5.4 Detector Suite (`genestamp_ml/detectors/`)
You must provide two detectors to validate the stealth claims:
1. **Detector 1 (k-mer Classifier):**
   - Extracts normalized k-mer frequency vectors ($k \in [3, 6]$).
   - XGBoost / Logistic Regression classifier trained on:
     - Class 0: Native *E. coli* coding sequences.
     - Class 1: Naively tagged sequences & early synthetic watermarks.
2. **Detector 2 (Held-Out Deep Learning):**
   - 3-layer 1D CNN with MaxPooling and BatchNorm over one-hot DNA representations.
   - **Crucial Rule:** Held-out from training the refiner.
3. **Success Criterion for Demo:**
   - Naive Tag Baseline: Detector synthetic probability $> 0.95$, $\text{AUC} \approx 0.99–1.00$.
   - HelixSign Steganography: Detector synthetic probability $\approx 0.50$, $\text{AUC} \approx 0.48–0.52$ (chance level).

### 5.5 Channel Noise Simulator (`genestamp_ml/channel.py`)
Simulates biological evolutionary mutations and sequencing artifacts:
- **Substitution Noise:** Configurable rate $p_s \in [0.001, 0.05]$. Simulates transitions ($A \leftrightarrow G, C \leftrightarrow T$) with higher frequency than transversions.
- **Indel Noise:** Configurable rate $p_i \in [0.001, 0.02]$. Simulates random single-base insertions or deletions.
- **Seed Control:** Accepts random seeds for reproducible evaluation curves.

---

## 6. Lightweight Python Inference API (`ml/api/serve.py`)

To allow Person 2's Next.js backend to call your ML engine, expose a fast FastAPI service on `http://127.0.0.1:8000`:

```bash
cd ml
uvicorn api.serve:app --host 127.0.0.1 --port 8000 --reload
```

### Endpoints Required by Backend:

#### 1. `POST /ml/embed`
- **Input:**
  ```json
  {
    "sequence": "ATGGCCAAG...TAA",
    "codewordBits": [1, 0, 1, 1, 0, ...],
    "carrierPositions": [14, 28, 45, 62, ...],
    "host": "E. coli K-12"
  }
  ```
- **Output:**
  ```json
  {
    "stampedSequence": "ATGGCCAAG...TAA",
    "proteinTranslation": "MAK...*",
    "proteinIdentical": true,
    "mutations": [
      { "codonIndex": 14, "fromCodon": "GAA", "toCodon": "GAG", "aminoAcid": "E" }
    ],
    "bioStats": {
      "gcBefore": 51.2,
      "gcAfter": 51.4,
      "caiSimilarity": 0.985,
      "longestHomopolymer": 4
    }
  }
  ```

#### 2. `POST /ml/extract`
- **Input:** `{ "sequence": "...", "carrierPositions": [14, 28, ...], "host": "E. coli K-12" }`
- **Output:** `{ "bitEstimates": [1, 0, 1, 1, ...], "confidences": [0.99, 0.95, 0.98, ...] }`

#### 3. `POST /ml/detect`
- **Input:** `{ "sequence": "ATGGCCAAG...TAA" }`
- **Output:** `{ "kmerProbability": 0.512, "cnnProbability": 0.498 }`

#### 4. `POST /ml/naive-encode`
- **Input:** `{ "sequence": "ATGGCCAAG...TAA", "payloadBits": [ ... ] }`
- **Output:** `{ "naiveSequence": "ATGCCCGGG...TAA" }`

#### 5. `POST /ml/channel`
- **Input:** `{ "sequence": "...", "substitutionRate": 0.02, "indelRate": 0.005, "seed": 42 }`
- **Output:** `{ "noisySequence": "...", "mutationsApplied": 18 }`

---

## 7. Implementation Checklist & Milestones

- [ ] **Milestone 1: Python Environment & Data Curation**
  - Create `ml/.venv` and install `requirements.txt` (torch, biopython, scikit-learn, xgboost, fastapi).
  - Write `data/download_ecoli.py` to parse *E. coli* K-12 CDS and compute `codon_usage_ecoli.json`.
  - Assemble 5 standard test genes (600–3000 nt) in `data/test_genes.fasta`.
- [ ] **Milestone 2: Rule-Based Embedder & Extractor**
  - Implement `genestamp_ml/bio.py` (translation, GC%, homopolymers).
  - Implement `genestamp_ml/embed.py` and `genestamp_ml/extract.py`.
  - Unit test: verify $100\%$ protein identity on all test genes.
- [ ] **Milestone 3: Detectors & Stealth Evaluation**
  - Train k-mer XGBoost detector and 1D CNN on native vs naive-encoded DNA.
  - Save static evaluation metrics (AUC curves) to `ml/artifacts/eval_results.json`.
- [ ] **Milestone 4: Channel Simulator & Stress Profiling**
  - Implement `genestamp_ml/channel.py` with substitution and indel noise.
  - Run evaluation script across noise rates ($0.1\%$ to $5\%$) and benchmark bit error rates.
- [ ] **Milestone 5: FastAPI Bridge & Integration**
  - Implement `api/serve.py` and test endpoints with `curl` or Postman.
  - Test end-to-end with Person 2's backend (`USE_STUBS=false`).

