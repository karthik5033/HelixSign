// HelixSign - Authentic Synthetic Biology, DNA Steganography & Provenance Verification Mock Data
// Based on PRD, TRD & Bio-Steganography Research Literature (E. coli K-12 MG1655, WGAN-GP, Reed-Solomon ECC)

export interface AnalysisRecord {
  id: string;
  name: string;
  datasetName: string;
  specimen: string;
  timestamp: string;
  samplingRate: string;
  predictedClass: "Verified Invariant" | "Adversarial Mutated" | "Naive Tagged" | "Wildtype Control";
  confidence: number;
  f1Score: number;
  accuracy: number;
  rocAuc: number;
  status: "Completed" | "Processing" | "Alert" | "Queued";
  changepointsDetected: number;
  anomalyScore: number;
  embeddingDim: number;
  timeDelay: number;
  h0Features: number;
  h1Features: number;
  persistenceEntropy: number;
  notes: string;
}

export const RECENT_ANALYSES: AnalysisRecord[] = [
  {
    id: "HS-7402",
    name: "lacZ β-Galactosidase (E. coli K-12)",
    datasetName: "E. coli K-12 MG1655 RefSeq CDS (NC_000913.3)",
    specimen: "Construct: pUC19-lacZ (Host: E. coli K-12)",
    timestamp: "2026-11-12 21:40:10 UTC",
    samplingRate: "3,075 nt (1,025 Codons)",
    predictedClass: "Verified Invariant",
    confidence: 0.994,
    f1Score: 1.000,
    accuracy: 0.998,
    rocAuc: 0.505,
    status: "Completed",
    changepointsDetected: 64,
    anomalyScore: 0.14,
    embeddingDim: 3,
    timeDelay: 4,
    h0Features: 64,
    h1Features: 16,
    persistenceEntropy: 0.505,
    notes: "Synonymous codon substitution complete across 64 carrier positions. Reconstructed coding sequence preserves 100% primary amino acid translation with negligible host codon adaptation perturbation (ΔCAI < 0.012).",
  },
  {
    id: "HS-7401",
    name: "GFP Reporter Construct (pGLO)",
    datasetName: "Synthetic Biology BioBrick Standard Registry",
    specimen: "Construct: pGLO-GFP (Host: E. coli K-12)",
    timestamp: "2026-11-12 20:15:33 UTC",
    samplingRate: "717 nt (239 Codons)",
    predictedClass: "Adversarial Mutated",
    confidence: 0.978,
    f1Score: 1.000,
    accuracy: 0.985,
    rocAuc: 0.498,
    status: "Completed",
    changepointsDetected: 32,
    anomalyScore: 0.08,
    embeddingDim: 3,
    timeDelay: 6,
    h0Features: 32,
    h1Features: 8,
    persistenceEntropy: 0.498,
    notes: "Survives 15% synonymous shuffling attack in the Attacker Arena with full 16-byte Reed-Solomon payload recovery.",
  },
  {
    id: "HS-7400",
    name: "SpCas9 Endonuclease (S. pyogenes)",
    datasetName: "CRISPR Genome Editing Vector Library",
    specimen: "Construct: px458-SpCas9 (Host: E. coli Expression)",
    timestamp: "2026-11-12 18:08:14 UTC",
    samplingRate: "4,104 nt (1,368 Codons)",
    predictedClass: "Verified Invariant",
    confidence: 0.991,
    f1Score: 1.000,
    accuracy: 0.992,
    rocAuc: 0.512,
    status: "Completed",
    changepointsDetected: 128,
    anomalyScore: 0.11,
    embeddingDim: 4,
    timeDelay: 5,
    h0Features: 128,
    h1Features: 32,
    persistenceEntropy: 0.512,
    notes: "Multi-tile Reed-Solomon redundancy active across 4 independent segments; tolerates up to 3.5% random point mutations.",
  },
  {
    id: "HS-7399",
    name: "Wildtype E. coli K-12 MG1655 Control",
    datasetName: "NCBI RefSeq Standard Reference Genome",
    specimen: "Reference: MG1655 Wildtype Control",
    timestamp: "2026-11-12 16:30:00 UTC",
    samplingRate: "1,500 nt (500 Codons)",
    predictedClass: "Wildtype Control",
    confidence: 0.998,
    f1Score: 1.000,
    accuracy: 1.000,
    rocAuc: 0.500,
    status: "Completed",
    changepointsDetected: 0,
    anomalyScore: 0.01,
    embeddingDim: 3,
    timeDelay: 3,
    h0Features: 0,
    h1Features: 0,
    persistenceEntropy: 0.500,
    notes: "Wildtype un-watermarked negative control; passes all biological viability and codon adaptation checks.",
  },
  {
    id: "HS-7398",
    name: "mCherry Expression Cassette",
    datasetName: "Synthetic Biology BioBrick Standard Registry",
    specimen: "Construct: pSB1C3-mCherry (Host: E. coli K-12)",
    timestamp: "2026-11-12 14:10:45 UTC",
    samplingRate: "711 nt (237 Codons)",
    predictedClass: "Verified Invariant",
    confidence: 0.982,
    f1Score: 1.000,
    accuracy: 0.988,
    rocAuc: 0.502,
    status: "Completed",
    changepointsDetected: 32,
    anomalyScore: 0.09,
    embeddingDim: 3,
    timeDelay: 5,
    h0Features: 32,
    h1Features: 8,
    persistenceEntropy: 0.502,
    notes: "64-bit cryptographic ownership payload verified with 100% protein identity and zero homopolymer runs over 4 bp.",
  },
];

// Summary Statistics for Overview Dashboard
export const DASHBOARD_STATS = {
  totalAnalyses: 1420,
  activeMonitors: 4,
  datasetsLoaded: 12,
  damageAlertsToday: 0,
  meanAccuracy: 100.0,
  meanRocAuc: 0.505,
  meanDetectionDelayMs: 42,
  precursorsDetectedCount: 64,
};

// Simulated AE Waveform for Preview & Analysis
export function generateAeWaveform(length = 200, isAnomalous = false) {
  const points = [];
  const freq1 = isAnomalous ? 12 : 8;
  const freq2 = isAnomalous ? 24 : 16;
  const decay = isAnomalous ? 0.025 : 0.04;
  const noiseScale = isAnomalous ? 0.08 : 0.04;

  for (let i = 0; i < length; i++) {
    const t = i / (length - 1);
    // AE transient pulse: burst at t=0.2 with exponential decay
    let amp = 0;
    if (i >= 20) {
      const tau = (i - 20) * decay;
      amp =
        Math.exp(-tau) *
        (Math.sin(2 * Math.PI * freq1 * (t - 0.1)) +
          0.4 * Math.sin(2 * Math.PI * freq2 * (t - 0.1)));
    }
    // Deterministic pseudo-random perturbation based on sample index to guarantee SSR/client hydration equality
    const noise = Math.sin(i * 12.9898 + 78.233) * 0.5 * noiseScale;
    points.push({
      time: (i * 0.05).toFixed(2),
      amplitude: parseFloat((amp + noise).toFixed(4)),
      filtered: parseFloat((amp * 0.92).toFixed(4)),
      envelope: parseFloat(Math.max(0, Math.abs(amp) * 1.05).toFixed(4)),
      residual: parseFloat((noise * 1.5).toFixed(4)),
    });
  }
  return points;
}

// 2D/3D Takens Delay Embedding Attractor Coordinates
export function generateTakensAttractor(pointsCount = 180) {
  const points = [];
  for (let i = 0; i < pointsCount; i++) {
    const angle = (i / pointsCount) * 4 * Math.PI;
    const r = 1 + 0.35 * Math.sin(5 * angle);
    // Deterministic chaotic perturbations to guarantee 100% identical SSR & client hydration
    const noiseX = Math.sin(i * 73.1 + 19.7) * 0.04;
    const noiseY = Math.cos(i * 91.3 + 37.2) * 0.04;
    const noiseZ = Math.sin(i * 113.7 + 53.1) * 0.025;
    const x = r * Math.cos(angle) + noiseX;
    const y = r * Math.sin(angle) + noiseY;
    const z = 0.5 * Math.sin(3 * angle) + noiseZ;
    points.push({
      x: parseFloat(x.toFixed(3)),
      y: parseFloat(y.toFixed(3)),
      z: parseFloat(z.toFixed(3)),
      index: i,
    });
  }
  return points;
}

// Persistent Homology Persistence Diagram (Birth vs Death)
export interface PersistencePoint {
  id: string;
  dimension: 0 | 1;
  birth: number;
  death: number;
  persistence: number;
}

export const MOCK_PERSISTENCE_DIAGRAM: PersistencePoint[] = [
  // H0 features (connected components: born at 0, die as complexes merge)
  { id: "h0-1", dimension: 0, birth: 0.0, death: 0.88, persistence: 0.88 },
  { id: "h0-2", dimension: 0, birth: 0.0, death: 0.72, persistence: 0.72 },
  { id: "h0-3", dimension: 0, birth: 0.0, death: 0.54, persistence: 0.54 },
  { id: "h0-4", dimension: 0, birth: 0.0, death: 0.41, persistence: 0.41 },
  { id: "h0-5", dimension: 0, birth: 0.0, death: 0.32, persistence: 0.32 },
  { id: "h0-6", dimension: 0, birth: 0.0, death: 0.28, persistence: 0.28 },
  { id: "h0-7", dimension: 0, birth: 0.0, death: 0.19, persistence: 0.19 },
  { id: "h0-8", dimension: 0, birth: 0.0, death: 0.14, persistence: 0.14 },

  // H1 features (1D topological loops: key damage precursor indicators!)
  { id: "h1-1", dimension: 1, birth: 0.12, death: 0.82, persistence: 0.70 },
  { id: "h1-2", dimension: 1, birth: 0.18, death: 0.75, persistence: 0.57 },
  { id: "h1-3", dimension: 1, birth: 0.25, death: 0.68, persistence: 0.43 },
  { id: "h1-4", dimension: 1, birth: 0.31, death: 0.61, persistence: 0.30 },
  { id: "h1-5", dimension: 1, birth: 0.42, death: 0.59, persistence: 0.17 },
  { id: "h1-6", dimension: 1, birth: 0.51, death: 0.63, persistence: 0.12 },
  { id: "h1-7", dimension: 1, birth: 0.38, death: 0.46, persistence: 0.08 },
  { id: "h1-8", dimension: 1, birth: 0.22, death: 0.29, persistence: 0.07 },
];

// Betti Curves (beta_0, beta_1 over filtration epsilon)
export const MOCK_BETTI_CURVES = [
  { epsilon: 0.0, beta0: 42, beta1: 0 },
  { epsilon: 0.1, beta0: 31, beta1: 2 },
  { epsilon: 0.2, beta0: 18, beta1: 7 },
  { epsilon: 0.3, beta0: 11, beta1: 14 },
  { epsilon: 0.4, beta0: 6, beta1: 19 },
  { epsilon: 0.5, beta0: 3, beta1: 15 },
  { epsilon: 0.6, beta0: 2, beta1: 8 },
  { epsilon: 0.7, beta0: 1, beta1: 3 },
  { epsilon: 0.8, beta0: 1, beta1: 1 },
  { epsilon: 0.9, beta0: 1, beta1: 0 },
];

// BOCD Run-Length & Changepoint Timeline
export const MOCK_BOCD_TIMELINE = [
  { time: "0.0s", probability: 0.02, hazard: 0.004, isChangepoint: false },
  { time: "0.5s", probability: 0.03, hazard: 0.005, isChangepoint: false },
  { time: "1.0s", probability: 0.08, hazard: 0.008, isChangepoint: false },
  { time: "1.4s", probability: 0.92, hazard: 0.412, isChangepoint: true, label: "CP-1 (Carrier Locus Permutation)" },
  { time: "2.0s", probability: 0.05, hazard: 0.006, isChangepoint: false },
  { time: "2.5s", probability: 0.06, hazard: 0.007, isChangepoint: false },
  { time: "3.0s", probability: 0.11, hazard: 0.012, isChangepoint: false },
  { time: "3.8s", probability: 0.89, hazard: 0.388, isChangepoint: true, label: "CP-2 (Reed-Solomon Parity Block)" },
  { time: "4.5s", probability: 0.04, hazard: 0.005, isChangepoint: false },
  { time: "5.0s", probability: 0.07, hazard: 0.009, isChangepoint: false },
  { time: "5.5s", probability: 0.14, hazard: 0.018, isChangepoint: false },
  { time: "6.2s", probability: 0.96, hazard: 0.490, isChangepoint: true, label: "CP-3 (WGAN k-mer Frequency Boundary)" },
  { time: "7.0s", probability: 0.12, hazard: 0.015, isChangepoint: false },
];

// Conv1D Autoencoder Reconstruction Error vs Threshold
export const MOCK_AUTOENCODER_RESIDUALS = [
  { step: 1, error: 0.042, threshold: 0.18, isAnomaly: false },
  { step: 2, error: 0.038, threshold: 0.18, isAnomaly: false },
  { step: 3, error: 0.045, threshold: 0.18, isAnomaly: false },
  { step: 4, error: 0.051, threshold: 0.18, isAnomaly: false },
  { step: 5, error: 0.089, threshold: 0.18, isAnomaly: false },
  { step: 6, error: 0.245, threshold: 0.18, isAnomaly: true }, // Anomaly hit
  { step: 7, error: 0.288, threshold: 0.18, isAnomaly: true },
  { step: 8, error: 0.092, threshold: 0.18, isAnomaly: false },
  { step: 9, error: 0.047, threshold: 0.18, isAnomaly: false },
  { step: 10, error: 0.041, threshold: 0.18, isAnomaly: false },
  { step: 11, error: 0.312, threshold: 0.18, isAnomaly: true }, // Anomaly hit
  { step: 12, error: 0.198, threshold: 0.18, isAnomaly: true },
  { step: 13, error: 0.054, threshold: 0.18, isAnomaly: false },
];

// Model Comparison Matrix: HelixSign vs Direct Codon vs Naive Barcode
export interface ModelBenchmark {
  metric: string;
  helixSign: string | number;
  directCodon: string | number;
  naiveBarcode: string | number;
  unit?: string;
  bestModel: "helixSign" | "directCodon" | "naiveBarcode";
}

export const MODEL_COMPARISON_TABLE: ModelBenchmark[] = [
  { metric: "Protein Identity Preservation", helixSign: "100.0%", directCodon: "91.4%", naiveBarcode: "88.2%", bestModel: "helixSign" },
  { metric: "Detector Stealth (AUC vs XGBoost)", helixSign: "0.505 (Chance)", directCodon: "0.998 (Flagged)", naiveBarcode: "0.985 (Flagged)", bestModel: "helixSign" },
  { metric: "Detector Stealth (AUC vs 1D CNN)", helixSign: "0.498 (Chance)", directCodon: "0.992 (Flagged)", naiveBarcode: "0.979 (Flagged)", bestModel: "helixSign" },
  { metric: "Codon Adaptation Index (CAI)", helixSign: "0.988", directCodon: "0.812", naiveBarcode: "0.745", bestModel: "helixSign" },
  { metric: "Recovery at 1.0% Mutation Noise", helixSign: "99.4%", directCodon: "68.2%", naiveBarcode: "54.1%", bestModel: "helixSign" },
  { metric: "Recovery under Synonymous Shuffle (15%)", helixSign: "94.2%", directCodon: "12.0%", naiveBarcode: "0.0%", bestModel: "helixSign" },
  { metric: "Error Correction Capability", helixSign: "RS(16,8) GF(2^8)", directCodon: "None (Raw)", naiveBarcode: "CRC-32 (Non-correcting)", bestModel: "helixSign" },
  { metric: "Carrier Cryptographic Concealment", helixSign: "Keyed HKDF PRNG", directCodon: "None (Fixed Codebook)", naiveBarcode: "Fixed Non-coding Insert", bestModel: "helixSign" },
  { metric: "Host Expressibility Overhead", helixSign: "0.0% (Zero Toxicity)", directCodon: "High (Codon Skew)", naiveBarcode: "Fatal (Frame Disruption)", bestModel: "helixSign" },
];

// Feature Importance Ranking (Biophysical & Steganographic Metrics)
export const TOPOLOGICAL_FEATURE_IMPORTANCE = [
  { name: "Host Codon Adaptation (ΔCAI)", importance: 0.284, category: "Biophysical" },
  { name: "k-mer MMD Discrepancy (k=3,4)", importance: 0.216, category: "Adversarial" },
  { name: "Reed-Solomon Parity Margin", importance: 0.168, category: "ECC Coding" },
  { name: "Homopolymer Run Length Check", importance: 0.125, category: "Viability" },
  { name: "Local GC Skew Deviation", importance: 0.089, category: "Biophysical" },
  { name: "WGAN Discriminator Logits", importance: 0.064, category: "Stealth" },
  { name: "HKDF Carrier Uniformity", importance: 0.054, category: "Crypto" },
];

// Confusion Matrix for Stealth Detection
export const CONFUSION_MATRIX = [
  { actual: "Wildtype Host", predictedWildtype: 498, predictedHelixSign: 1, predictedNaive: 1, total: 500, accuracy: "99.6%" },
  { actual: "HelixSign Stamped", predictedWildtype: 3, predictedHelixSign: 494, predictedNaive: 3, total: 500, accuracy: "98.8%" },
  { actual: "Naive Tagged", predictedWildtype: 0, predictedHelixSign: 2, predictedNaive: 498, total: 500, accuracy: "99.6%" },
];

// Built-in Genomic CDS Datasets Library
export interface AeDatasetItem {
  id: string;
  name: string;
  source: string;
  citation: string;
  format: string;
  size: string;
  eventsCount: number;
  classes: string[];
  samplingFrequency: string;
  description: string;
  preloaded: boolean;
  status: "Ready" | "Indexed";
}

export const DATASETS_LIBRARY: AeDatasetItem[] = [
  {
    id: "ds-ecoli-k12",
    name: "E. coli K-12 MG1655 Annotated CDS Library",
    source: "NCBI RefSeq (NC_000913.3 / Riley et al.)",
    citation: "doi: 10.1093/nar/gkj089",
    format: "FASTA / GenBank Flatfile",
    size: "4.6 MB",
    eventsCount: 4312,
    classes: ["Metabolic Enzymes", "Transcription Factors", "Membrane Transporters", "Structural Ribosomal"],
    samplingFrequency: "Codon Degeneracy Table 11",
    description: "4,312 annotated protein-coding open reading frames from the standard E. coli K-12 reference strain used as host background.",
    preloaded: true,
    status: "Ready",
  },
  {
    id: "ds-synthetic-biobricks",
    name: "Standard Synthetic Expression Cassettes",
    source: "iGEM Registry of Standard Biological Parts",
    citation: "MIT Synthetic Biology Working Group",
    format: "FASTA / GFF3",
    size: "120 MB",
    eventsCount: 1650,
    classes: ["Reporter Constructs (GFP/RFP)", "CRISPR-Cas Endonucleases", "Synthetic Operons"],
    samplingFrequency: "Standard Bacterial Genetic Code",
    description: "1,650 empirically sequenced synthetic plasmids, promoters, and coding regions with established expression profiles.",
    preloaded: true,
    status: "Ready",
  },
  {
    id: "ds-yeast-s288c",
    name: "Saccharomyces cerevisiae S288C Genome",
    source: "Saccharomyces Genome Database (SGD)",
    citation: "doi: 10.1093/genetics/149.1.35",
    format: "FASTA CDS Sequences",
    size: "12.4 MB",
    eventsCount: 6604,
    classes: ["Eukaryotic Coding Genes", "Intron-Containing CDS", "Mitochondrial Genes"],
    samplingFrequency: "Eukaryotic Translation Table 1",
    description: "Complete yeast coding genome used for multi-host cross-organism validation of the synonymous watermarking engine.",
    preloaded: true,
    status: "Ready",
  },
];

// Pre-generated Provenance & Assessment Reports
export interface AssessmentReport {
  id: string;
  title: string;
  analysisRef: string;
  datasetRef: string;
  dateGenerated: string;
  author: string;
  precursorRisk: "Low" | "Moderate" | "Critical";
  primaryDamageMode: string;
  overallCondition: string;
  fileSize: string;
  f1Score?: number;
  accuracy?: number;
  changepoints?: number;
  h1Loops?: number;
  maxPersistence?: number;
  specimen?: string;
  leadTimeMs?: number;
  auditHash?: string;
}

export const ASSESSMENT_REPORTS: AssessmentReport[] = [
  {
    id: "REP-2026-001",
    title: "Provenance Certificate: lacZ Reporter Construct (E. coli K-12)",
    analysisRef: "HS-7402",
    datasetRef: "E. coli K-12 MG1655 RefSeq CDS",
    dateGenerated: "2026-11-12 21:45 UTC",
    author: "Principal Investigator (ApexBio Laboratory)",
    precursorRisk: "Low",
    primaryDamageMode: "100% Protein Match (Zero Invariant Deviation)",
    overallCondition: "Verified Invariant — 64 carrier codons verified. Full Reed-Solomon codeword recovered with zero errors.",
    fileSize: "1.8 MB (PDF)",
    f1Score: 1.000,
    accuracy: 0.998,
    changepoints: 64,
    h1Loops: 16,
    maxPersistence: 0.505,
    specimen: "lacZ β-Galactosidase (3,075 bp)",
    leadTimeMs: 42,
    auditHash: "SHA-256: 4e91b0c9a41e8f23",
  },
  {
    id: "REP-2026-002",
    title: "Adversarial Red-Team Report: SpCas9 Synonymous Shuffling",
    analysisRef: "HS-7400",
    datasetRef: "CRISPR Genome Editing Vector Library",
    dateGenerated: "2026-11-12 20:20 UTC",
    author: "Lead Computational Biologist",
    precursorRisk: "Critical",
    primaryDamageMode: "Adversarial Codon Shuffling (15% Intensity)",
    overallCondition: "Watermark Resilient — 16-byte RS codeword survived 15% synonymous shuffling with 94.2% recovery.",
    fileSize: "3.2 MB (PDF)",
    f1Score: 1.000,
    accuracy: 0.985,
    changepoints: 128,
    h1Loops: 32,
    maxPersistence: 0.512,
    specimen: "SpCas9 Endonuclease (4,104 bp)",
    leadTimeMs: 58,
    auditHash: "SHA-256: 7f8a42c3e12d90a1",
  },
  {
    id: "REP-2026-003",
    title: "Stealth Biosecurity Evaluation: GFP Expression Vector vs CNN/XGBoost Detectors",
    analysisRef: "HS-7401",
    datasetRef: "Synthetic Biology BioBrick Standard Registry",
    dateGenerated: "2026-11-12 18:15 UTC",
    author: "HelixSign Auto-Assessment Engine",
    precursorRisk: "Moderate",
    primaryDamageMode: "Detector AUC = 0.498 (Random Chance Level)",
    overallCondition: "Stealth Certified — Both k-mer XGBoost and 1D CNN detectors fail to distinguish construct from wildtype host.",
    fileSize: "2.1 MB (PDF)",
    f1Score: 1.000,
    accuracy: 0.992,
    changepoints: 32,
    h1Loops: 8,
    maxPersistence: 0.498,
    specimen: "GFP Reporter (717 bp)",
    leadTimeMs: 36,
    auditHash: "SHA-256: 9b20ce4567df41a9",
  },
  {
    id: "REP-2026-004",
    title: "Channel Noise Robustness: 2.0% Substitution & Indel Stress Test",
    analysisRef: "HS-7402",
    datasetRef: "E. coli K-12 MG1655 RefSeq CDS",
    dateGenerated: "2026-11-12 15:10 UTC",
    author: "Senior Diagnostics Specialist",
    precursorRisk: "Critical",
    primaryDamageMode: "Multi-Generation Evolutionary Drift Simulation",
    overallCondition: "Robustness Verified — 96.7% watermark recovery across 30 simulated evolutionary channel trials.",
    fileSize: "2.8 MB (PDF)",
    f1Score: 1.000,
    accuracy: 0.967,
    changepoints: 64,
    h1Loops: 16,
    maxPersistence: 0.505,
    specimen: "lacZ β-Galactosidase (3,075 bp)",
    leadTimeMs: 44,
    auditHash: "SHA-256: 1a88ee744b207e99",
  },
  {
    id: "REP-2026-005",
    title: "Negative Control Baseline: Unwatermarked E. coli MG1655 Wildtype",
    analysisRef: "HS-7399",
    datasetRef: "NCBI RefSeq Standard Reference Genome",
    dateGenerated: "2026-11-12 12:30 UTC",
    author: "HelixSign Genomic Verifier Pod",
    precursorRisk: "Low",
    primaryDamageMode: "Wildtype Control (Unmodified)",
    overallCondition: "Negative Control Verified — Zero synthetic watermark carrier signatures detected.",
    fileSize: "1.1 MB (PDF)",
    f1Score: 1.000,
    accuracy: 1.000,
    changepoints: 0,
    h1Loops: 0,
    maxPersistence: 0.500,
    specimen: "Wildtype MG1655 (1,500 bp)",
    leadTimeMs: 0,
    auditHash: "SHA-256: 3c55d0899e1a8810",
  },
  {
    id: "REP-2026-006",
    title: "Homopolymer & GC Stability Assessment: mCherry Fluorophore",
    analysisRef: "HS-7398",
    datasetRef: "Synthetic Biology BioBrick Standard Registry",
    dateGenerated: "2026-11-12 10:45 UTC",
    author: "Biochemical Safety Officer",
    precursorRisk: "Moderate",
    primaryDamageMode: "Biophysical Viability Filter (GC% & Homopolymers)",
    overallCondition: "Biosecurity Compliant — Longest homopolymer = 4 bp; GC skew deviation ΔGC = +0.09% within ±5% bounds.",
    fileSize: "2.3 MB (PDF)",
    f1Score: 1.000,
    accuracy: 0.988,
    changepoints: 32,
    h1Loops: 8,
    maxPersistence: 0.502,
    specimen: "mCherry Expression Cassette (711 bp)",
    leadTimeMs: 38,
    auditHash: "SHA-256: 8f44ae921c97a552",
  },
];

