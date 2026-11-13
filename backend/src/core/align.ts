/**
 * Banded global alignment used for registry-assisted extraction after indels
 * or end trimming. Returns one base per reference position; positions that
 * align to a gap are represented by N and treated as erasures by the decoder.
 */

const MATCH = 2;
const MISMATCH = -1;
const GAP = -2;
const NEG = -1_000_000_000;

const DIAG = 0;
const UP = 1;
const LEFT = 2;

function bandedAlignment(
  reference: string,
  query: string,
  band: number,
): { aligned: string[]; refToQuery: (number | null)[]; score: number } {
  const n = reference.length;
  const m = query.length;
  const width = 2 * band + 1;
  const trace = new Int8Array((n + 1) * width).fill(-1);
  let previous = new Int32Array(m + 1).fill(NEG);
  let current = new Int32Array(m + 1).fill(NEG);

  previous[0] = 0;
  trace[0 * width + 0] = LEFT;
  for (let j = 1; j <= Math.min(m, band); j += 1) {
    previous[j] = j * GAP;
    trace[j] = LEFT;
  }

  for (let i = 1; i <= n; i += 1) {
    current.fill(NEG);
    const low = Math.max(0, i - band);
    const high = Math.min(m, i + band);

    if (low === 0) {
      current[0] = i * GAP;
      trace[i * width + 0] = UP;
    }

    const previousLow = Math.max(0, i - 1 - band);
    const previousHigh = Math.min(m, i - 1 + band);

    for (let j = Math.max(1, low); j <= high; j += 1) {
      let best = NEG;
      let direction = -1;

      if (j - 1 >= previousLow && j - 1 <= previousHigh) {
        const score = previous[j - 1] + (reference[i - 1] === query[j - 1] ? MATCH : MISMATCH);
        if (score > best) {
          best = score;
          direction = DIAG;
        }
      }

      if (j >= previousLow && j <= previousHigh) {
        const score = previous[j] + GAP;
        if (score > best) {
          best = score;
          direction = UP;
        }
      }

      if (j - 1 >= low) {
        const score = current[j - 1] + GAP;
        if (score > best) {
          best = score;
          direction = LEFT;
        }
      }

      current[j] = best;
      trace[i * width + (j - low)] = direction;
    }

    const swap = previous;
    previous = current;
    current = swap;
  }

  const score = previous[m];
  if (score <= NEG / 2) {
    throw new Error('Alignment failed: no valid path within band');
  }

  const aligned = new Array<string>(n).fill('N');
  const refToQuery = new Array<number | null>(n).fill(null);
  let i = n;
  let j = m;
  let guard = 0;

  while (i > 0 || j > 0) {
    guard += 1;
    if (guard > n + m + 10) throw new Error('Alignment traceback did not terminate');

    if (i === 0) {
      j -= 1;
      continue;
    }
    if (j === 0) {
      aligned[i - 1] = 'N';
      refToQuery[i - 1] = null;
      i -= 1;
      continue;
    }

    const low = Math.max(0, i - band);
    const direction = trace[i * width + (j - low)];

    if (direction === DIAG) {
      aligned[i - 1] = query[j - 1];
      refToQuery[i - 1] = j - 1;
      i -= 1;
      j -= 1;
    } else if (direction === UP) {
      aligned[i - 1] = 'N';
      refToQuery[i - 1] = null;
      i -= 1;
    } else if (direction === LEFT) {
      j -= 1;
    } else {
      throw new Error('Alignment traceback encountered an invalid cell');
    }
  }

  return { aligned, refToQuery, score };
}

export interface DetailedAlignment {
  alignedSequence: string;
  refToQuery: (number | null)[];
  score: number;
}

/**
 * Align query to reference and return detailed alignment info with coordinate mapping.
 */
export function alignToReferenceDetailed(
  reference: string,
  query: string,
  initialBand = 64,
): DetailedAlignment {
  const ref = reference.toUpperCase();
  const qry = query.toUpperCase();

  if (ref === qry) {
    return {
      alignedSequence: ref,
      refToQuery: Array.from({ length: ref.length }, (_, i) => i),
      score: ref.length * MATCH,
    };
  }

  const lengthDelta = Math.abs(ref.length - qry.length);
  let band = Math.max(initialBand, lengthDelta + 32);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const result = bandedAlignment(ref, qry, Math.min(band, Math.max(ref.length, qry.length)));
      return {
        alignedSequence: result.aligned.join(''),
        refToQuery: result.refToQuery,
        score: result.score,
      };
    } catch {
      band *= 2;
      if (band > Math.max(ref.length, qry.length) + 32) break;
    }
  }

  throw new Error('Unable to align suspect sequence to reference; indel load too high');
}

/**
 * Map reference codon positions to nucleotide start offsets in the query sequence.
 * Codons ruptured or deleted by indels are set to null (explicit erasures).
 */
export function mapCarrierOffsets(
  refToQuery: readonly (number | null)[],
  carrierPositions: readonly number[],
): (number | null)[] {
  return carrierPositions.map((pos) => {
    const r0 = pos * 3;
    const r1 = r0 + 1;
    const r2 = r0 + 2;
    const q0 = refToQuery[r0];
    const q1 = refToQuery[r1];
    const q2 = refToQuery[r2];
    if (q0 !== null && q1 !== null && q2 !== null && q1 === q0 + 1 && q2 === q1 + 1) {
      return q0;
    }
    return null;
  });
}

/**
 * Align query to reference and return bases in reference coordinates. A larger
 * band is retried automatically when an aggressive indel pattern falls outside
 * the first attempt.
 */
export function alignToReference(reference: string, query: string, initialBand = 64): string {
  return alignToReferenceDetailed(reference, query, initialBand).alignedSequence;
}

/** Fraction of reference bases that aligned to an identical base. */
export function alignmentIdentity(reference: string, alignedReference: string): number {
  if (reference.length === 0) return 0;
  let identical = 0;
  for (let i = 0; i < reference.length; i += 1) {
    if (alignedReference[i] === reference[i]) identical += 1;
  }
  return (identical / reference.length) * 100;
}
