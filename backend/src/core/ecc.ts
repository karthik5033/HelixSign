/**
 * Reed-Solomon codec over GF(2^8) for 8 data bytes + 8 parity bytes.
 *
 * The implementation follows the standard systematic RS construction:
 * primitive polynomial x^8 + x^4 + x^3 + x^2 + 1 (0x11d), generator alpha = 2,
 * first consecutive root alpha^0. It corrects up to 4 symbol errors per
 * 16-byte codeword (or up to 8 erasures).
 */

const PRIMITIVE_POLYNOMIAL = 0x11d;
const FIELD_SIZE = 255;

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint16Array(256);

let value = 1;
for (let i = 0; i < FIELD_SIZE; i += 1) {
  GF_EXP[i] = value;
  GF_LOG[value] = i;
  value <<= 1;
  if (value & 0x100) value ^= PRIMITIVE_POLYNOMIAL;
}
for (let i = FIELD_SIZE; i < GF_EXP.length; i += 1) {
  GF_EXP[i] = GF_EXP[i - FIELD_SIZE];
}
GF_LOG[0] = 0;

export const ECC_DATA_BYTES = 8;
export const ECC_PARITY_BYTES = 8;
export const ECC_CODEWORD_BYTES = ECC_DATA_BYTES + ECC_PARITY_BYTES;
export const ECC_CODEWORD_BITS = ECC_CODEWORD_BYTES * 8;
export const ECC_MAX_ERRORS = Math.floor(ECC_PARITY_BYTES / 2);

function gfAdd(a: number, b: number): number {
  return a ^ b;
}

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function gfDiv(a: number, b: number): number {
  if (b === 0) throw new RangeError('Division by zero in GF(2^8)');
  if (a === 0) return 0;
  return GF_EXP[GF_LOG[a] + FIELD_SIZE - GF_LOG[b]];
}

function gfPow(base: number, exponent: number): number {
  if (base === 0) return 0;
  const normalized = ((exponent % FIELD_SIZE) + FIELD_SIZE) % FIELD_SIZE;
  return GF_EXP[(GF_LOG[base] * normalized) % FIELD_SIZE];
}

function gfInverse(valueToInvert: number): number {
  if (valueToInvert === 0) throw new RangeError('0 has no multiplicative inverse');
  return GF_EXP[FIELD_SIZE - GF_LOG[valueToInvert]];
}

/** Polynomials are stored highest-degree first. */
function polyScale(poly: readonly number[], scalar: number): number[] {
  return poly.map((coefficient) => gfMul(coefficient, scalar));
}

function polyAdd(a: readonly number[], b: readonly number[]): number[] {
  const length = Math.max(a.length, b.length);
  const result = new Array<number>(length).fill(0);
  for (let i = 0; i < length; i += 1) {
    const ai = i - (length - a.length);
    const bi = i - (length - b.length);
    result[i] = gfAdd(ai >= 0 ? a[ai] : 0, bi >= 0 ? b[bi] : 0);
  }
  return result;
}

function polyMul(a: readonly number[], b: readonly number[]): number[] {
  const result = new Array<number>(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i += 1) {
    for (let j = 0; j < b.length; j += 1) {
      result[i + j] = gfAdd(result[i + j], gfMul(a[i], b[j]));
    }
  }
  return result;
}

/** Long division; returns [quotient, remainder]. */
function polyDiv(dividend: readonly number[], divisor: readonly number[]): [number[], number[]] {
  const output = [...dividend];
  for (let i = 0; i < dividend.length - (divisor.length - 1); i += 1) {
    const coefficient = output[i];
    if (coefficient !== 0) {
      for (let j = 1; j < divisor.length; j += 1) {
        output[i + j] = gfAdd(output[i + j], gfMul(divisor[j], coefficient));
      }
    }
  }
  const separator = divisor.length - 1;
  return [output.slice(0, output.length - separator), output.slice(output.length - separator)];
}

function polyEval(poly: ArrayLike<number>, x: number): number {
  let result = 0;
  for (let i = 0; i < poly.length; i += 1) {
    result = gfAdd(gfMul(result, x), poly[i]);
  }
  return result;
}

const generatorCache = new Map<number, number[]>();

function generatorPolynomial(nsym: number): number[] {
  const cached = generatorCache.get(nsym);
  if (cached) return cached;
  let generator = [1];
  for (let i = 0; i < nsym; i += 1) {
    generator = polyMul(generator, [1, gfPow(2, i)]);
  }
  generatorCache.set(nsym, generator);
  return generator;
}

export function rsEncode(data: Uint8Array, nsym = ECC_PARITY_BYTES): Uint8Array {
  if (data.length + nsym > 255) {
    throw new RangeError('Codeword does not fit in GF(2^8)');
  }
  const generator = generatorPolynomial(nsym);
  const message = [...data, ...new Array<number>(nsym).fill(0)];

  for (let i = 0; i < data.length; i += 1) {
    const coefficient = message[i];
    if (coefficient !== 0) {
      for (let j = 1; j < generator.length; j += 1) {
        message[i + j] = gfAdd(message[i + j], gfMul(generator[j], coefficient));
      }
    }
  }

  return Uint8Array.from([...data, ...message.slice(data.length)]);
}

function syndromes(message: Uint8Array, nsym: number): number[] {
  return [0, ...Array.from({ length: nsym }, (_, i) => polyEval(message, gfPow(2, i)))];
}

function forneySyndromes(synd: readonly number[], positions: readonly number[], nmess: number): number[] {
  const reversed = positions.map((position) => nmess - 1 - position);
  const fsynd = synd.slice(1);
  for (const position of reversed) {
    const x = gfPow(2, position);
    for (let j = 0; j < fsynd.length - 1; j += 1) {
      fsynd[j] = gfAdd(gfMul(fsynd[j], x), fsynd[j + 1]);
    }
  }
  return fsynd;
}

function findErrorLocator(synd: readonly number[], nsym: number, eraseCount = 0): number[] {
  let errLoc = [1];
  let oldLoc = [1];
  const syndShift = synd.length > nsym ? synd.length - nsym : 0;

  for (let i = 0; i < nsym - eraseCount; i += 1) {
    const k = i + syndShift;
    let delta = synd[k] ?? 0;
    for (let j = 1; j < errLoc.length; j += 1) {
      delta = gfAdd(delta, gfMul(errLoc[errLoc.length - (j + 1)], synd[k - j] ?? 0));
    }

    oldLoc = [...oldLoc, 0];
    if (delta !== 0) {
      if (oldLoc.length > errLoc.length) {
        const newLoc = polyScale(oldLoc, delta);
        oldLoc = polyScale(errLoc, gfInverse(delta));
        errLoc = newLoc;
      }
      errLoc = polyAdd(errLoc, polyScale(oldLoc, delta));
    }
  }

  while (errLoc.length > 0 && errLoc[0] === 0) errLoc.shift();
  const errors = errLoc.length - 1;
  if ((errors - eraseCount) * 2 + eraseCount > nsym) {
    throw new Error('Too many errors to correct');
  }
  return errLoc;
}

function findErrors(errLoc: readonly number[], nmess: number): number[] {
  const errors = errLoc.length - 1;
  const positions: number[] = [];
  for (let i = 0; i < nmess; i += 1) {
    if (polyEval(errLoc, gfPow(2, i)) === 0) {
      positions.push(nmess - 1 - i);
    }
  }
  if (positions.length !== errors) {
    throw new Error('Could not locate all errors');
  }
  return positions;
}

function findErrataLocator(coefPos: readonly number[]): number[] {
  let errataLocator = [1];
  for (const position of coefPos) {
    errataLocator = polyMul(errataLocator, polyAdd([1], [gfPow(2, position), 0]));
  }
  return errataLocator;
}

function findErrorEvaluator(synd: readonly number[], errLoc: readonly number[], nsym: number): number[] {
  const product = polyMul(synd, errLoc);
  const divisor = [1, ...new Array<number>(nsym + 1).fill(0)];
  const [, remainder] = polyDiv(product, divisor);
  return remainder;
}

function correctErrata(message: Uint8Array, synd: readonly number[], errPos: readonly number[]): Uint8Array {
  const output = Uint8Array.from(message);
  const coefPos = errPos.map((position) => message.length - 1 - position);
  const errLoc = findErrataLocator(coefPos);
  const errEval = findErrorEvaluator([...synd].reverse(), errLoc, errLoc.length - 1);

  const xValues = coefPos.map((position) => gfPow(2, position));
  const errorMagnitudes = new Array<number>(message.length).fill(0);

  for (let i = 0; i < xValues.length; i += 1) {
    const xi = xValues[i];
    const xiInverse = gfInverse(xi);

    let errLocPrime = 1;
    for (let j = 0; j < xValues.length; j += 1) {
      if (j !== i) {
        errLocPrime = gfMul(errLocPrime, gfAdd(1, gfMul(xiInverse, xValues[j])));
      }
    }

    let y = polyEval(errEval, xiInverse);
    y = gfMul(gfPow(xi, 1), y);
    errorMagnitudes[errPos[i]] = gfDiv(y, errLocPrime);
  }

  for (let i = 0; i < output.length; i += 1) {
    output[i] = gfAdd(output[i], errorMagnitudes[i]);
  }
  return output;
}

export interface RsDecodeResult {
  data: Uint8Array;
  codeword: Uint8Array;
  errorsCorrected: number;
}

/**
 * Decode a systematic RS codeword. Throws when the error pattern is beyond the
 * correction capability of the parity bytes.
 *
 * `erasures` lists byte positions known to be unreliable. With 8 parity bytes
 * the decoder can recover up to 8 erasures.
 */
export function rsDecode(
  codeword: Uint8Array,
  nsym = ECC_PARITY_BYTES,
  erasures: readonly number[] = [],
): RsDecodeResult {
  if (codeword.length > 255) throw new RangeError('Codeword does not fit in GF(2^8)');
  if (codeword.length <= nsym) throw new RangeError('Codeword shorter than parity length');

  const message = Uint8Array.from(codeword);
  const erasePositions = [...new Set(erasures)].filter(
    (position) => Number.isInteger(position) && position >= 0 && position < message.length,
  );
  if (erasePositions.length > nsym) {
    throw new Error('Too many erasures to correct');
  }
  for (const position of erasePositions) message[position] = 0;

  const synd = syndromes(message, nsym);

  if (synd.every((coefficient) => coefficient === 0)) {
    return {
      data: message.slice(0, message.length - nsym),
      codeword: message,
      errorsCorrected: 0,
    };
  }

  const fsynd = forneySyndromes(synd, erasePositions, message.length);
  const errLoc = findErrorLocator(fsynd, nsym, erasePositions.length);
  const errPos = findErrors([...errLoc].reverse(), message.length);
  const errataPositions = [...new Set([...erasePositions, ...errPos])];
  const corrected = correctErrata(message, synd, errataPositions);

  const verification = syndromes(corrected, nsym);
  if (!verification.every((coefficient) => coefficient === 0)) {
    throw new Error('Reed-Solomon decoding failed: residual syndromes');
  }

  return {
    data: corrected.slice(0, corrected.length - nsym),
    codeword: corrected,
    errorsCorrected: errPos.length + erasePositions.length,
  };
}

/** Debug/helper: verify whether a codeword is a valid RS codeword. */
export function isValidCodeword(codeword: Uint8Array, nsym = ECC_PARITY_BYTES): boolean {
  return syndromes(codeword, nsym).every((coefficient) => coefficient === 0);
}
