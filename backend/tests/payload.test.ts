import { describe, expect, it } from 'vitest';
import { bytesToBits, bitsToBytes, packPayload, unpackPayload, verifyPayloadMac } from '@/core/payload';
import { makeMasterKey } from './helpers';

const masterKey = makeMasterKey();
const codes = { ownerCode: 0x1234, projectCode: 0xabcd, batchCode: 0x0001 };

describe('64-bit payload', () => {
  it('packs codes into 8 bytes and unpacks them', () => {
    const payload = packPayload(codes, masterKey);
    expect(payload).toHaveLength(8);
    const decoded = unpackPayload(payload);
    expect(decoded.ownerCode).toBe(codes.ownerCode);
    expect(decoded.projectCode).toBe(codes.projectCode);
    expect(decoded.batchCode).toBe(codes.batchCode);
  });

  it('validates the truncated HMAC', () => {
    const payload = packPayload(codes, masterKey);
    expect(verifyPayloadMac(payload, masterKey)).toBe(true);
    expect(verifyPayloadMac(payload, Buffer.from('22'.repeat(32), 'hex'))).toBe(false);
  });

  it('rejects tampered payload bytes', () => {
    const payload = packPayload(codes, masterKey);
    payload[2] ^= 0xff;
    expect(verifyPayloadMac(payload, masterKey)).toBe(false);
  });

  it('round-trips bits MSB-first', () => {
    const bytes = Uint8Array.from([0b10100001, 0b00011110]);
    expect(bitsToBytes(bytesToBits(bytes))).toEqual(bytes);
  });

  it('rejects out-of-range codes', () => {
    expect(() => packPayload({ ...codes, ownerCode: 70000 }, masterKey)).toThrow();
    expect(() => packPayload({ ...codes, projectCode: -1 }, masterKey)).toThrow();
  });
});
