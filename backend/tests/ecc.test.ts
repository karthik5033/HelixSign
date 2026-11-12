import { describe, expect, it } from 'vitest';
import {
  ECC_CODEWORD_BYTES,
  ECC_MAX_ERRORS,
  isValidCodeword,
  rsDecode,
  rsEncode,
} from '@/core/ecc';

const payload = Uint8Array.from([0x00, 0x01, 0x7f, 0x80, 0xab, 0xcd, 0xef, 0xff]);

describe('Reed-Solomon ECC', () => {
  it('encodes 8 data bytes into a valid 16-byte systematic codeword', () => {
    const codeword = rsEncode(payload);
    expect(codeword).toHaveLength(ECC_CODEWORD_BYTES);
    expect([...codeword.slice(0, 8)]).toEqual([...payload]);
    expect(isValidCodeword(codeword)).toBe(true);
  });

  it('round-trips a clean codeword', () => {
    const decoded = rsDecode(rsEncode(payload));
    expect([...decoded.data]).toEqual([...payload]);
    expect(decoded.errorsCorrected).toBe(0);
  });

  it(`corrects up to ${ECC_MAX_ERRORS} byte errors`, () => {
    for (let errorCount = 1; errorCount <= ECC_MAX_ERRORS; errorCount += 1) {
      const codeword = rsEncode(payload);
      for (let i = 0; i < errorCount; i += 1) {
        codeword[i * 2] ^= 0x5a + i;
      }
      const decoded = rsDecode(codeword);
      expect([...decoded.data]).toEqual([...payload]);
      expect(decoded.errorsCorrected).toBe(errorCount);
    }
  });

  it('corrects random error patterns across the whole codeword', () => {
    for (let trial = 0; trial < 50; trial += 1) {
      const codeword = rsEncode(payload);
      const positions = new Set<number>();
      while (positions.size < ECC_MAX_ERRORS) positions.add((trial * 7 + positions.size * 3) % 16);
      for (const position of positions) codeword[position] ^= (trial + position + 1) & 0xff;
      const decoded = rsDecode(codeword);
      expect([...decoded.data]).toEqual([...payload]);
    }
  });

  it('recovers up to 8 byte erasures', () => {
    for (let eraseCount = 1; eraseCount <= 8; eraseCount += 1) {
      const codeword = rsEncode(payload);
      const erasures: number[] = [];
      for (let i = 0; i < eraseCount; i += 1) {
        const position = (i * 2 + 1) % 15;
        erasures.push(position);
        codeword[position] = 0;
      }
      const decoded = rsDecode(codeword, 8, erasures);
      expect([...decoded.data]).toEqual([...payload]);
    }
  });

  it('rejects an unrecoverable error burst', () => {
    const codeword = rsEncode(payload);
    for (let i = 0; i < 9; i += 1) codeword[i] ^= 0xff;
    expect(() => rsDecode(codeword)).toThrow();
  });
});
