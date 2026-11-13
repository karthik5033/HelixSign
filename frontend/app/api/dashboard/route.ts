import { NextResponse } from "next/server";
import { RECENT_ANALYSES, DASHBOARD_STATS, AnalysisRecord } from "@/lib/echosenseData";

// Mathematical b-value calculation: b = (n * log10(e)) / (sum(ln(Ai / Amin)))
function computeGutenbergRichterBValue(amplitudesDb: number[], minDb = 40): number {
  if (amplitudesDb.length === 0) return 1.5;
  const filtered = amplitudesDb.filter((a) => a >= minDb);
  if (filtered.length === 0) return 1.5;
  const sumLn = filtered.reduce((acc, a) => acc + Math.log(a / minDb), 0);
  if (sumLn === 0) return 1.5;
  const b = (filtered.length * Math.LOG10E) / sumLn;
  return parseFloat(Math.max(0.5, Math.min(2.5, b)).toFixed(3));
}

// Felicity ratio calculation: FR = P_onset / P_previous_max
function computeFelicityRatio(loadOnsetKn: number, loadPreviousMaxKn: number): { fr: number; isDamaged: boolean } {
  if (loadPreviousMaxKn <= 0) return { fr: 1.0, isDamaged: false };
  const fr = parseFloat((loadOnsetKn / loadPreviousMaxKn).toFixed(3));
  return {
    fr,
    isDamaged: fr < 0.95, // Kaiser effect violation threshold
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const regime = searchParams.get("regime") || "cyclic";

  // 1. Dynamic aggregations computed from active records
  const totalAnalyses = RECENT_ANALYSES.length;
  const alertRecords = RECENT_ANALYSES.filter((a) => a.status === "Alert");
  const meanAccuracy = parseFloat(
    (RECENT_ANALYSES.reduce((acc, a) => acc + a.accuracy, 0) / totalAnalyses * 100).toFixed(1)
  );
  const meanF1 = parseFloat(
    (RECENT_ANALYSES.reduce((acc, a) => acc + a.f1Score, 0) / totalAnalyses).toFixed(3)
  );
  const meanRocAuc = parseFloat(
    (RECENT_ANALYSES.reduce((acc, a) => acc + a.rocAuc, 0) / totalAnalyses).toFixed(3)
  );
  const totalChangepoints = RECENT_ANALYSES.reduce((acc, a) => acc + a.changepointsDetected, 0);

  // 2. DNA Steganography & Mutagenic Stress Progression Data
  let progressionData = [];
  if (regime === "pcr") {
    progressionData = [
      { step: "Cycle 5", recoveryRate: 100, mutationRate: 0.05, caiScore: 98.8 },
      { step: "Cycle 15", recoveryRate: 100, mutationRate: 0.22, caiScore: 98.8 },
      { step: "Cycle 25", recoveryRate: 100, mutationRate: 0.65, caiScore: 98.7 },
      { step: "Cycle 35", recoveryRate: 100, mutationRate: 1.35, caiScore: 98.6 },
      { step: "Cycle 45", recoveryRate: 100, mutationRate: 2.40, caiScore: 98.5 },
    ];
  } else if (regime === "adversarial") {
    progressionData = [
      { step: "5% Shuffle", recoveryRate: 100, mutationRate: 5.0, caiScore: 98.8 },
      { step: "10% Shuffle", recoveryRate: 100, mutationRate: 10.0, caiScore: 98.5 },
      { step: "15% Shuffle", recoveryRate: 100, mutationRate: 15.0, caiScore: 98.2 },
      { step: "20% Shuffle", recoveryRate: 100, mutationRate: 20.0, caiScore: 97.8 },
      { step: "25% Shuffle", recoveryRate: 98.4, mutationRate: 25.0, caiScore: 97.2 },
    ];
  } else {
    // Default: Evolutionary passages
    progressionData = [
      { block: "Gen 30", recoveryRate: 100, mutationRate: 0.1, caiScore: 98.8 },
      { block: "Gen 60", recoveryRate: 100, mutationRate: 0.2, caiScore: 98.8 },
      { block: "Gen 120", recoveryRate: 100, mutationRate: 0.5, caiScore: 98.7 },
      { block: "Gen 180", recoveryRate: 100, mutationRate: 0.9, caiScore: 98.7 },
      { block: "Gen 240", recoveryRate: 100, mutationRate: 1.4, caiScore: 98.6 },
      { block: "Gen 300", recoveryRate: 100, mutationRate: 1.8, caiScore: 98.6 },
    ];
  }

  // 3. Monitored construct health states & provenance evaluation
  const specimenHealth = [
    {
      id: "construct-lacz",
      name: "pUC19-lacZ (3,075 bp)",
      runRef: "HS-7402",
      status: "VERIFIED",
      severity: "nominal",
      felicityRatio: 1.0,
      bValue: 0.988,
      changepoints: 64,
      h1PersistentLoops: 16,
      description: "64 carrier codons verified. 0 alterations. ΔCAI: +0.002. RS Parity valid.",
    },
    {
      id: "construct-cas9",
      name: "px458-SpCas9 (4,104 bp)",
      runRef: "HS-7400",
      status: "PROTECTED",
      severity: "nominal",
      felicityRatio: 1.0,
      bValue: 0.982,
      changepoints: 128,
      h1PersistentLoops: 32,
      description: "Multi-tile Reed-Solomon redundancy active across 4 independent segments; tolerates up to 3.5% mutations.",
    },
    {
      id: "construct-gfp",
      name: "pGLO-GFP (717 bp)",
      runRef: "HS-7401",
      status: "RESILIENT",
      severity: "info",
      felicityRatio: 1.0,
      bValue: 0.990,
      changepoints: 32,
      h1PersistentLoops: 8,
      description: "Nanopore R10.4.1 / Illumina NovaSeq verified. Sub-1s decode latency.",
    },
  ];

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    metrics: {
      totalAnalyses: 248, // Platform lifetime total
      activeMonitors: 3,
      meanAccuracy,
      meanF1,
      meanRocAuc,
      damageAlertsToday: alertRecords.length,
      totalChangepoints,
      meanLeadTimeMs: 340,
      currentBValue: 0.78, // Critical shear block indicator
      kaiserViolation: true,
    },
    regime,
    progressionData,
    specimenHealth,
    recentAnalyses: RECENT_ANALYSES,
  });
}

