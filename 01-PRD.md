# 01 - Product Requirements Document (PRD): GeneStamp

Version: 0.1 (draft)
Owners: whole team (Frontend lead drives edits)
Related docs: 02-TRD.md, 03-TEAM-SPLIT.md, 04-API-CONTRACT.md, 05-GIT-WORKFLOW.md

---

## 1. Summary
GeneStamp is a web app that hides a short, error-corrected ownership ID inside the synonymous codon choices of an engineered gene. The stamped gene codes for the exact same protein, statistically looks like native host DNA, and survives mutations. The app also lets users test the stamp: a detector checks how visible it is, and an attack arena checks how hard it is to destroy. A registry supports tracing a suspect sequence back to its owner.

One-line pitch: an invisible, damage-resistant ownership stamp for engineered DNA, with built-in proof that it is hard to find and hard to remove.

## 2. Problem
- Labs, biotech startups and seed/crop developers build valuable constructs and strains.
- When a sample leaks or is copied, proving ownership is difficult.
- Obvious tag sequences are easy to spot and cut out.
- Random inserted DNA can harm the host organism.
- Organisms mutate over generations, so naive tags degrade.

## 3. Target Users
- Primary: research labs and biotech startups who want to tag their own constructs.
- Secondary: hackathon judges and reviewers evaluating the idea (the demo must be self-explanatory).
- Not targeted: anyone wanting covert messaging or evasion of biosecurity screening (see Section 11).

## 4. Goals
1. A user can stamp a gene, and the app proves the protein is unchanged.
2. A user can recover the ID from a stamped sequence even after mutations.
3. The app shows, with numbers, that the stamp is harder to detect than a naive tag.
4. The app lets anyone attack a stamp and shows whether it survives.
5. The app can match a suspect sequence to a registry entry.
6. Everything is deployed and demoable on a public URL.

## 5. Non-Goals
- No wet-lab validation in this project (stated openly; listed as next milestone).
- No bulk file storage in DNA.
- No claim of being the first DNA watermark (prior art exists; see Section 6).
- No user accounts or payments. A simple demo identity (owner name) is enough.

## 6. Positioning vs Prior Art
Known related work (from a quick search; verify before citing): 2012 gene watermarking via steganography in synthetic genes, digital signatures for plasmids (Peccoud lab, 2020), DNAMark and CentralMark (NeurIPS 2025) for DNA from language models, SynthID Bio for AI-designed proteins.

What this project adds:
- Stealth that is measured against trained detectors, not just claimed.
- Robustness that is measured against an interactive attack suite.
- A usable product layer (stamp, verify, trace, registry) for ordinary labs.
- Adversarially trained realism on top of a function-preserving encoder.

## 7. Features and Priorities
Priority key: P0 must ship, P1 should ship, P2 nice to have.

### F1. Stamp (P0)
User enters owner name, project, batch and pastes a coding sequence.
Acceptance criteria:
- Returns a stamped sequence downloadable as FASTA.
- Shows protein identity of 100% (original vs stamped translation, side by side).
- Highlights which codons changed.
- Shows stats: GC content before/after, codon usage similarity to host, longest homopolymer.
- Shows capacity used vs available; clear error if the gene is too short.
- Saves the stamp to the registry.

### F2. Verify (P0)
User pastes or uploads a suspect sequence.
Acceptance criteria:
- Returns one of: verified, partially recovered, not found.
- On success shows owner, project, batch, number of errors corrected and a confidence score.
- Works when a realistic fraction of substitutions has been introduced.

### F3. Stealth Check (P0)
Acceptance criteria:
- Shows detector scores for the stamped sequence next to a naive-tagged version of the same payload.
- Naive version is clearly flagged; stamped version scores near chance.
- Shows a summary of AUC numbers from offline evaluation.

### F4. Stress Lab (P0)
Acceptance criteria:
- Slider for substitution rate and indel rate (0.1% to 5%).
- Runs repeated trials and reports recovery rate.
- Shows a curve of recovery rate vs noise level.
- Honestly shows where recovery starts failing.

### F5. Attacker Arena (P1)
Acceptance criteria:
- User picks an attack (random mutation, trim ends, delete block, shuffle synonymous codons, re-synonymize a fraction).
- App shows the attacked sequence, whether the protein is still intact, and whether the stamp survived.
- Shows the break-point: how much attack is needed to destroy the stamp.

### F6. Forensic Trace (P1)
Acceptance criteria:
- User uploads a suspect (possibly mutated) sequence.
- App returns top matches from the registry with similarity, confidence and suspected tampered regions.

### F7. Registry (P0 minimal, P1 full)
- P0: every stamp is stored with timestamp, owner, project, batch and sequence hash.
- P1: a browsable registry page and a detail page per stamp.

### F8. Evolution Simulator (P2)
- Simulates many generations of mutation with periodic repair and shows a timeline until the stamp breaks.

### F9. Attack Leaderboard (P2)
- Ranks attacks by how little change was needed to break the stamp.

## 8. Input Rules (shared by all screens)
- Alphabet: A, C, G, T only (case-insensitive; normalized to uppercase).
- Length: multiple of 3 for coding sequences.
- Recommended minimum length for full payload: roughly 600 nt. Shorter inputs return a capacity error with how many bits are missing.
- Maximum length for the demo: 3000 nt (keeps responses fast).
- Host organism: E. coli K-12 for MVP.

## 9. Success Metrics (for the demo and the paper)
- Protein identity after stamping: 100% on all test genes.
- Naive tag detector AUC near 1.0, GeneStamp near 0.5 on the held-out detector.
- Full ID recovery at or above 95% at 1% substitution noise (target; adjust after measuring).
- Stamp round trip (stamp then verify) under 3 seconds on the deployed backend.
- Demo runs end to end without errors on the public URL.

## 10. Demo Script (3 to 4 minutes)
1. Stamp a real E. coli gene. Show the protein match proof and highlighted codons.
2. Stealth Check: naive tag flagged, GeneStamp near chance.
3. Stress Lab: raise the noise and show recovery, then show where it fails.
4. Attacker Arena: run two or three attacks live.
5. Forensic Trace: upload a mutated "stolen" sample and identify the owner.
6. Close on registry and an honest limitations slide.

## 11. Ethics and Dual-Use Stance
- Stealth could in principle help hide synthetic sequences from screening. The product is framed as consent-based traceability that works alongside biosecurity screening, not against it.
- Marketing language avoids "undetectable" and "covert". Use "hard to find and strip without knowing the key".
- Keys are required for stamp placement; the app does not publish a way to locate stamps without a key.
- The limitations section states that heavy synonymous recoding can erase a stamp.

## 12. Risks
- ML scope: GAN training may not converge in time. Mitigation: ship a rule-based realism step first, add the learned refiner as a drop-in upgrade behind the same interface.
- Indel handling is the hardest robustness case. Mitigation: decision spike early (see TRD), and be honest in the demo about current limits.
- Integration conflicts between three people. Mitigation: contract-first workflow (04-API-CONTRACT.md) and folder ownership (05-GIT-WORKFLOW.md).
- Free-tier hosting cold starts. Mitigation: warm-up ping before the demo, small CPU-friendly models.

## 13. Out of Scope / Future
- Wet-lab validation with a lab or synthesis partner.
- Support for more host organisms.
- Plasmid-wide tagging beyond coding regions.
- Integration with synthesis provider screening pipelines.
