# Contributing to HelixSign

Welcome to the **HelixSign** repository!

To maintain a fast, conflict-free development velocity, all team members and contributors must adhere to our strict monorepo workflow.

---

## 1. Getting Started

1. Read the master [README.md](file:///d:/coding_files/HelixSign/README.md) for architectural and technical context.
2. Read the specific guide for your development area:
   - **Frontend:** [03-FRONTEND_GUIDE.md](file:///d:/coding_files/HelixSign/03-FRONTEND_GUIDE.md)
   - **Backend:** [04-BACKEND_GUIDE.md](file:///d:/coding_files/HelixSign/04-BACKEND_GUIDE.md)
   - **ML & Data:** [05-ML_DATA_GUIDE.md](file:///d:/coding_files/HelixSign/05-ML_DATA_GUIDE.md)
   - **Integration & Monitoring:** [06-MONITORING_AND_INTEGRATION_GUIDE.md](file:///d:/coding_files/HelixSign/06-MONITORING_AND_INTEGRATION_GUIDE.md)
3. Review our [RULES_OF_ENGAGEMENT.md](file:///d:/coding_files/HelixSign/RULES_OF_ENGAGEMENT.md) for the monorepo rules.

---

## 2. Development Workflow

- All work starts on a feature branch derived from `develop`:
  ```bash
  git checkout develop
  git pull origin develop
  git checkout -b feat/<area>/<feature-description>
  ```
- Area tags: `frontend`, `backend`, `ml`, `docs`, `contracts`.
- Work strictly inside your assigned folder (`frontend/`, `backend/`, or `ml/`).
- Test locally before committing.
- Open a Pull Request targeting `develop`.

---

## 3. Pull Request Checklist

Before submitting:
- [ ] No files outside your folder are in the git diff.
- [ ] All sensitive keys, secrets, and environment tokens are excluded.
- [ ] Large model files or datasets are excluded from git.
- [ ] The feature was verified locally with stubs/mocks enabled.

