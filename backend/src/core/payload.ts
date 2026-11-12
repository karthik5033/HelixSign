import { constantTimeEqual16, deriveOwnerKey, truncatedHmac16 } from './crypto';

export const PAYLOAD_BYTES = 8;
export const PAYLOAD_BITS = PAYLOAD_BYTES * 8;

export interface OwnershipCodes {
  ownerCode: number;
  projectCode: number;
  batchCode: number;
}

export interface DecodedPayload extends OwnershipCodes {
  mac: number;
}

function assertCode(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 0xffff) {
    throw new RangeError(`${label} must be a uint16 (0-65535), got ${value}`);
  }
}

/**
 * Pack owner/project/batch into 64 bits:
 *
 *   [ owner:16 ][ project:16 ][ batch:16 ][ truncated HMAC:16 ]
 *
 * The MAC is computed over the first 6 bytes with a key derived from the owner
 * code, so verification only needs the master key.
 */
export function packPayload(codes: OwnershipCodes, masterKey: Buffer): Uint8Array {
  const { ownerCode, projectCode, batchCode } = codes;
  assertCode(ownerCode, 'ownerCode');
  assertCode(projectCode, 'projectCode');
  assertCode(batchCode, 'batchCode');

  const buffer = Buffer.alloc(PAYLOAD_BYTES);
  buffer.writeUInt16BE(ownerCode, 0);
  buffer.writeUInt16BE(projectCode, 2);
  buffer.writeUInt16BE(batchCode, 4);

  const ownerKey = deriveOwnerKey(masterKey, ownerCode);
  const mac = truncatedHmac16(ownerKey, buffer.subarray(0, 6));
  buffer.writeUInt16BE(mac, 6);

  return Uint8Array.from(buffer);
}

export function unpackPayload(payload: Uint8Array): DecodedPayload {
  if (payload.length !== PAYLOAD_BYTES) {
    throw new RangeError(`Payload must be ${PAYLOAD_BYTES} bytes, got ${payload.length}`);
  }
  const buffer = Buffer.from(payload);
  return {
    ownerCode: buffer.readUInt16BE(0),
    projectCode: buffer.readUInt16BE(2),
    batchCode: buffer.readUInt16BE(4),
    mac: buffer.readUInt16BE(6),
  };
}

export function verifyPayloadMac(payload: Uint8Array, masterKey: Buffer): boolean {
  try {
    const decoded = unpackPayload(payload);
    const ownerKey = deriveOwnerKey(masterKey, decoded.ownerCode);
    const expected = truncatedHmac16(ownerKey, Buffer.from(payload).subarray(0, 6));
    return constantTimeEqual16(expected, decoded.mac);
  } catch {
    return false;
  }
}

/** Convert bytes to a bit array, most-significant bit first. */
export function bytesToBits(bytes: Uint8Array): number[] {
  const bits: number[] = [];
  for (const byte of bytes) {
    for (let shift = 7; shift >= 0; shift -= 1) {
      bits.push((byte >> shift) & 1);
    }
  }
  return bits;
}

/** Convert an MSB-first bit array to bytes. Throws when the length is not a multiple of 8. */
export function bitsToBytes(bits: readonly number[]): Uint8Array {
  if (bits.length % 8 !== 0) {
    throw new RangeError(`Bit array length must be a multiple of 8, got ${bits.length}`);
  }
  const bytes = new Uint8Array(bits.length / 8);
  for (let i = 0; i < bits.length; i += 1) {
    if (bits[i] !== 0 && bits[i] !== 1) throw new RangeError('Bits must be 0 or 1');
    bytes[i >> 3] |= bits[i] << (7 - (i & 7));
  }
  return bytes;
}

export function repeatBits(bits: readonly number[], times: number): number[] {
  if (!Number.isInteger(times) || times < 1) throw new RangeError('times must be >= 1');
  const output: number[] = [];
  for (let i = 0; i < times; i += 1) output.push(...bits);
  return output;
}

/**
 * Majority-vote tiled codeword bits back into a single 128-bit block.
 * Each tile contributes one estimate per bit position.
 */
export function voteTiles(estimates: readonly number[][], bitsPerTile: number): number[] {
  if (estimates.length === 0) return [];
  const voted: number[] = [];
  for (let bit = 0; bit < bitsPerTile; bit += 1) {
    let sum = 0;
    let count = 0;
    for (const tile of estimates) {
      if (bit < tile.length) {
        sum += tile[bit];
        count += 1;
      }
    }
    voted.push(count > 0 && sum / count > 0.5 ? 1 : 0);
  }
  return voted;
}
