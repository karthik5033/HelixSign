# Security & Dual-Use Policy: HelixSign

## 1. Ethical Stance & Biosecurity Compliance

HelixSign is created to provide **transparent provenance, authenticity verification, and intellectual property protection** for synthetic biology and life-science researchers.

- **Non-Goal:** HelixSign is explicitly **not** designed or targeted for covert communication, hiding unauthorized genetic modifications, or evading biosecurity DNA synthesis screening.
- **Biosecurity Alignment:** HelixSign supports synthesis screening protocols. Carrier codon selections and watermark structures are consent-based and detectable by authorized keyholders.
- **No Secret Algorithm Reliance:** The security of HelixSign relies on standard cryptographic principles (keyed pseudorandom placement with HKDF and authenticated MACs), not on security through obscurity.

---

## 2. Secrets & Key Management

- **Master Keys:** The system uses master secrets (`MASTER_KEY`) to derive per-owner seeds.
- **Client Security:** Private keys, carrier codon indices, and internal embedding states must **never** be transmitted to the frontend browser or included in public API responses.
- **Environment Sanitation:** Production and development secrets must live strictly within environment variables on isolated backends.

---

## 3. Reporting Security Vulnerabilities

If you discover a security vulnerability or biological safety concern regarding watermark manipulation, please report it privately to the repository owners instead of opening a public GitHub issue.
