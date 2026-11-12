import { describe, expect, it } from 'vitest';
import { translate } from '@/core/codons';
import { randomMutation } from '@/attacks/mutation';
import { trimEnds } from '@/attacks/trimming';
import { deleteBlock } from '@/attacks/deletion';
import { resynonymizeFraction, shuffleSynonymous } from '@/attacks/synonymous';
import { makeCds } from './helpers';

const sequence = makeCds(240, 3);
const protein = translate(sequence);

describe('attacker arena', () => {
  it('random mutation substitutes bases deterministically', () => {
    const first = randomMutation(sequence, 0.05, 42);
    const second = randomMutation(sequence, 0.05, 42);
    expect(first.sequence).toBe(second.sequence);
    expect(first.mutationsApplied).toBeGreaterThan(0);
    expect(first.sequence).toHaveLength(sequence.length);
    expect(first.sequence).not.toBe(sequence);
  });

  it('trimming removes the requested termini', () => {
    const result = trimEnds(sequence, 30, 21);
    expect(result.sequence).toHaveLength(sequence.length - 51);
    expect(result.sequence).toBe(sequence.slice(30, sequence.length - 21));
    expect(result.mutationsApplied).toBe(51);
  });

  it('deletes a contiguous block', () => {
    const result = deleteBlock(sequence, 90, 60);
    expect(result.sequence).toHaveLength(sequence.length - 60);
    expect(result.sequence.slice(90, 150)).toBe(sequence.slice(150, 210));
    expect(result.mutationsApplied).toBe(60);
  });

  it('synonymous shuffle preserves protein identity', () => {
    const result = shuffleSynonymous(sequence, 0.5, 9);
    expect(result.mutationsApplied).toBeGreaterThan(0);
    expect(translate(result.sequence)).toBe(protein);
  });

  it('resynonymization preserves protein identity', () => {
    const result = resynonymizeFraction(sequence, 0.4, 12);
    expect(result.mutationsApplied).toBeGreaterThan(0);
    expect(translate(result.sequence)).toBe(protein);
  });

  it('does nothing at zero intensity', () => {
    expect(shuffleSynonymous(sequence, 0, 1).mutationsApplied).toBe(0);
    expect(randomMutation(sequence, 0, 1).mutationsApplied).toBe(0);
  });
});
