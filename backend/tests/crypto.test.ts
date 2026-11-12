import { describe, expect, it } from 'vitest';
import { buildCarrierLayout } from '@/core/carrier';
import { deriveCarrierKey, deriveOwnerKey } from '@/core/crypto';
import { ECC_CODEWORD_BITS } from '@/core/ecc';
import { makeCds, makeMasterKey } from './helpers';

const masterKey = makeMasterKey();
const sequence = makeCds(240, 11);

describe('HKDF key derivation and carrier selection', () => {
  it('derives deterministic per-owner keys', () => {
    const first = deriveOwnerKey(masterKey, 42);
    const second = deriveOwnerKey(masterKey, 42);
    const other = deriveOwnerKey(masterKey, 43);
    expect([...first]).toEqual([...second]);
    expect([...first]).not.toEqual([...other]);
    expect(first).toHaveLength(32);
  });

  it('derives different carrier keys for different lengths', () => {
    const a = deriveCarrierKey(masterKey, 600);
    const b = deriveCarrierKey(masterKey, 603);
    expect([...a]).not.toEqual([...b]);
  });

  it('selects a deterministic, unique set of carrier codons', () => {
    const first = buildCarrierLayout(sequence, masterKey);
    const second = buildCarrierLayout(sequence, masterKey);
    expect(first.positions).toEqual(second.positions);
    expect(first.positions.length).toBe(first.eligibleCodons);
    expect(first.positions.length).toBeGreaterThanOrEqual(ECC_CODEWORD_BITS);
    expect(first.tiles).toBeGreaterThanOrEqual(1);
    expect(new Set(first.positions).size).toBe(first.positions.length);
    for (const position of first.positions) {
      expect(position).toBeGreaterThanOrEqual(0);
      expect(position).toBeLessThan(sequence.length / 3);
    }
  });

  it('changes positions when the master key changes', () => {
    const first = buildCarrierLayout(sequence, masterKey);
    const second = buildCarrierLayout(sequence, Buffer.from('33'.repeat(32), 'hex'));
    expect(first.tiles).toBe(second.tiles);
    expect(first.positions).not.toEqual(second.positions);
  });

  it('throws a capacity error for a short construct', () => {
    expect(() => buildCarrierLayout(`ATG${'GCC'.repeat(10)}TAA`, masterKey)).toThrow(
      /eligible codons/i,
    );
  });
});
