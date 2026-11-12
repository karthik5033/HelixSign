import type { AttackResult } from './mutation';

/**
 * Delete a contiguous block. Indices are nucleotide coordinates; the caller is
 * responsible for choosing an in-frame start when protein preservation matters.
 */
export function deleteBlock(sequence: string, start: number, lengthBases: number): AttackResult {
  const upper = sequence.toUpperCase();
  const safeStart = Math.max(0, Math.min(upper.length - 1, Math.floor(start)));
  const safeLength = Math.max(0, Math.min(upper.length - safeStart, Math.floor(lengthBases)));
  return {
    sequence: upper.slice(0, safeStart) + upper.slice(safeStart + safeLength),
    mutationsApplied: safeLength,
  };
}
