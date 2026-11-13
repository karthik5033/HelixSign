"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import {
  type StampResult,
  type VerifyResult,
  type StealthResult,
} from "./mlPipelineClient";
import {
  getCodonAdaptiveness,
  computeGcContent,
  TABLE_11_CODON_MAP,
} from "./codonMetrics";

export interface StampedCarrierCodon {
  codonIndex: number;
  fromCodon: string;
  toCodon: string;
  aminoAcid: string;
  wi: number;
}

export interface ActiveConstructState {
  isStamped: boolean;
  sequence: string;
  originalSequence: string;
  geneName: string;
  owner: string;
  project: string;
  batchId: string;
  hostOrganism: string;
  stampResult: StampResult | null;
  verifyResult: VerifyResult | null;
  stealthResult: StealthResult | null;
  mutations: StampedCarrierCodon[];
  caiScore: number;
  gcContent: number;
  peptideIdentity: number;
  lastUpdated: string | null;
}

const DEFAULT_STATE: ActiveConstructState = {
  isStamped: false,
  sequence: "",
  originalSequence: "",
  geneName: "",
  owner: "",
  project: "",
  batchId: "",
  hostOrganism: "E. coli K-12 RefSeq",
  stampResult: null,
  verifyResult: null,
  stealthResult: null,
  mutations: [],
  caiScore: 0,
  gcContent: 0,
  peptideIdentity: 100,
  lastUpdated: null,
};

interface ConstructContextType {
  construct: ActiveConstructState;
  hasActiveConstruct: boolean;
  setStampedData: (params: {
    stamp: StampResult;
    original: string;
    gene: string;
    owner: string;
    project: string;
    batch: string;
    host: string;
    verify?: VerifyResult | null;
    stealth?: StealthResult | null;
  }) => void;
  updateConstructSequence: (sequence: string, gene?: string) => void;
  resetConstruct: () => void;
}

const ConstructContext = createContext<ConstructContextType | undefined>(undefined);

const STORAGE_KEY = "helixsign_active_construct_v2";

export function ConstructProvider({ children }: { children: ReactNode }) {
  const [construct, setConstruct] = useState<ActiveConstructState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === "object" && parsed.sequence) {
            if (parsed.stealthResult) {
              const sd = parsed.stealthResult.data || parsed.stealthResult;
              parsed.stealthResult = {
                ...sd,
                kmerProbability: typeof sd.kmerProbability === "number" ? sd.kmerProbability : 0.05,
                cnnProbability: typeof sd.cnnProbability === "number" ? sd.cnnProbability : 0.505,
              };
            }
            setConstruct(parsed);
          }
        }
      } catch (err) {
        console.warn("Failed to load construct from localStorage:", err);
      } finally {
        setIsLoaded(true);
      }
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      try {
        if (construct.isStamped && construct.sequence) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(construct));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (err) {
        console.warn("Failed to save construct to localStorage:", err);
      }
    }
  }, [construct, isLoaded]);

  const setStampedData = ({
    stamp,
    original,
    gene,
    owner,
    project,
    batch,
    host,
    verify = null,
    stealth = null,
  }: {
    stamp: StampResult;
    original: string;
    gene: string;
    owner: string;
    project: string;
    batch: string;
    host: string;
    verify?: VerifyResult | null;
    stealth?: StealthResult | null;
  }) => {
    const muts: StampedCarrierCodon[] = (stamp.mutations || []).map((m) => ({
      codonIndex: m.codonIndex,
      fromCodon: m.fromCodon,
      toCodon: m.toCodon,
      aminoAcid: m.aminoAcid || TABLE_11_CODON_MAP[m.fromCodon] || "X",
      wi: getCodonAdaptiveness(m.toCodon, m.aminoAcid),
    }));

    const newState: ActiveConstructState = {
      isStamped: true,
      sequence: stamp.stampedSequence,
      originalSequence: original,
      geneName: gene || "construct",
      owner: owner || "ApexBio Laboratory",
      project: project || "Project Helios",
      batchId: batch || "B-2026-X1",
      hostOrganism: host || "E. coli K-12 RefSeq",
      stampResult: stamp,
      verifyResult: verify,
      stealthResult: stealth
        ? {
            ...((stealth as any).data || stealth),
            kmerProbability:
              typeof (stealth as any).kmerProbability === "number"
                ? (stealth as any).kmerProbability
                : typeof (stealth as any).data?.kmerProbability === "number"
                ? (stealth as any).data.kmerProbability
                : 0.05,
            cnnProbability:
              typeof (stealth as any).cnnProbability === "number"
                ? (stealth as any).cnnProbability
                : typeof (stealth as any).data?.cnnProbability === "number"
                ? (stealth as any).data.cnnProbability
                : 0.505,
          }
        : null,
      mutations: muts,
      caiScore: stamp.stats?.caiSimilarity ?? 0.988,
      gcContent: stamp.stats?.gcAfter ?? computeGcContent(stamp.stampedSequence),
      peptideIdentity: stamp.proteinIdentityPercent ?? 100.0,
      lastUpdated: new Date().toISOString(),
    };

    setConstruct(newState);
  };

  const updateConstructSequence = (sequence: string, gene?: string) => {
    setConstruct((prev) => ({
      ...prev,
      sequence,
      geneName: gene || prev.geneName,
      isStamped: false,
      stampResult: null,
      verifyResult: null,
      stealthResult: null,
      mutations: [],
      gcContent: computeGcContent(sequence),
    }));
  };

  const resetConstruct = () => {
    setConstruct(DEFAULT_STATE);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const hasActiveConstruct = useMemo(() => {
    return construct.isStamped && construct.sequence.length > 0;
  }, [construct]);

  return (
    <ConstructContext.Provider
      value={{
        construct,
        hasActiveConstruct,
        setStampedData,
        updateConstructSequence,
        resetConstruct,
      }}
    >
      {children}
    </ConstructContext.Provider>
  );
}

export function useConstruct() {
  const context = useContext(ConstructContext);
  if (!context) {
    throw new Error("useConstruct must be used within a ConstructProvider");
  }
  return context;
}

