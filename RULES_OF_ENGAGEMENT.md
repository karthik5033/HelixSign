# HelixSign - Team Rules of Engagement & Code of Conduct

**Applies to:** Person 1 (Frontend), Person 2 (Backend), Person 3 (ML & Data)  
**Goal:** Eliminate merge conflicts, prevent breaking changes, and enforce clean parallel delivery.

---

## 1. The Three Sacred Laws of the Monorepo

### Law 1: Absolute Directory Sovereignty
Every team member has exclusive write authority over their assigned folder:
- **`frontend/**`** $\to$ Owned exclusively by **Person 1**.
- **`backend/**`** $\to$ Owned exclusively by **Person 2**.
- **`ml/**`** $\to$ Owned exclusively by **Person 3**.

> 🛑 **Zero Cross-Folder Commits:** A Git commit or Pull Request originating from your feature branch must **never** contain changes to files outside your directory. If a file in another directory needs changing, request that area's owner to make it or submit a separate, isolated PR.

### Law 2: The Contract is Frozen Law
- **`contracts/api-spec.json`** and **`contracts/fixtures/`** represent the frozen treaty between services.
- **Rule:** No single developer may modify `contracts/` unilaterally.
- **Amendment Procedure:** If an endpoint requires a new field or schema change:
  1. Post the proposed schema diff in team chat.
  2. Obtain written agreement from both the calling party and the serving party.
  3. Merge the schema change into `develop` first before either side writes code depending on it.

### Law 3: Zero-Dependency Development
Never block your progress waiting for another teammate:
- **Frontend Lead:** Must build and test screens against `NEXT_PUBLIC_USE_MOCKS=true`.
- **Backend Lead:** Must build and test API handlers against `USE_STUBS=true`.
- **ML Lead:** Must train, validate, and evaluate offline using test FASTA sequences before integrating the FastAPI server.

---

## 2. Git Branching & PR Protocol

### Branch Structure
```
main (Production / Public Demo)
  ▲
  │ (Only merged when full demo passes integration tests)
develop (Integration Branch - Protected)
  ▲
  ├── feat/frontend/<feature-name> (Person 1)
  ├── feat/backend/<feature-name>  (Person 2)
  └── feat/ml/<feature-name>       (Person 3)
```

### Git Rules
1. **Never Branch Off Someone Else’s Branch:** Always branch directly from latest `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/<your-role>/<feature-name>
   ```
2. **Daily Rebase / Merge from `develop`:** Before pushing code, sync with upstream `develop` to resolve any integration divergence early:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout feat/<your-role>/<feature-name>
   git merge develop
   ```
3. **Squash or Clean Commits:** Use conventional commit syntax:
   - `feat(frontend): add codon diff visualizer component`
   - `feat(backend): implement 16-byte Reed-Solomon framing`
   - `feat(ml): train k-mer XGBoost detector`
   - `docs: update API contracts for stress test`
   - `fix(backend): correct HKDF salt calculation`

---

## 3. Secret Management & Large File Bans

1. **Credentials Ban:**
   - Never commit `.env`, `.env.local`, API keys, Supabase service keys, or private salts.
   - Use `.env.example` with sanitized placeholders.
2. **Binary Weights Ban:**
   - Git is not an object store. Do **NOT** commit model weights (`*.pt`, `*.onnx`, `*.bin`), virtual environments (`.venv/`, `node_modules/`), or raw bulk genomic datasets (`*.tar.gz`, `*.fasta` > 5MB).
   - Large assets belong in Hugging Face Hub, Google Drive, or are fetched via download scripts.

---

## 4. Definition of Done (DoD) for PRs

Before requesting a review to merge into `develop`:
- [ ] Code is formatted and linted cleanly (`npm run lint` / `flake8`).
- [ ] No files outside your assigned directory are modified.
- [ ] Mock / stub fallback is verified working.
- [ ] No secrets or large binary files are included in git diff.
- [ ] Pull request description links to the corresponding PRD feature (F1 through F7).
