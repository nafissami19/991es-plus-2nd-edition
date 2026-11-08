/**
 * 32-bit (DEC, HEX, OCT) and 16-bit (BIN) two's complement integer arithmetic
 * and formatting for Base-N mode on Casio fx-991ES PLUS 2nd edition.
 */

import { CalcError, ERRORS } from '../../errors.js';

export const MIN_INT32 = -2147483648n;
export const MAX_INT32 = 2147483647n;
export const MASK32 = 0xFFFFFFFFn;

export const MIN_INT16 = -32768n;
export const MAX_INT16 = 32767n;
export const MASK16 = 0xFFFFn;

export class BaseNValue {
  constructor(val, base = 'DEC') {
    const v = BigInt(val);
    if (base === 'BIN') {
      if (v < MIN_INT16 || v > MAX_INT16) {
        throw new CalcError(ERRORS.MATH);
      }
    } else {
      if (v < MIN_INT32 || v > MAX_INT32) {
        throw new CalcError(ERRORS.MATH);
      }
    }
    this.value = v;
  }

  static fromUnsigned(u, bitWidth = 32) {
    if (bitWidth === 16) {
      const bigU = BigInt(u) & MASK16;
      const signed = bigU >= 0x8000n ? bigU - 0x10000n : bigU;
      return new BaseNValue(signed, 'BIN');
    } else {
      const bigU = BigInt(u) & MASK32;
      const signed = bigU >= 0x80000000n ? bigU - 0x100000000n : bigU;
      return new BaseNValue(signed, 'DEC');
    }
  }

  get unsigned32() {
    return BigInt.asUintN(32, this.value);
  }

  get unsigned16() {
    if (this.value < MIN_INT16 || this.value > MAX_INT16) {
      throw new CalcError(ERRORS.MATH);
    }
    return BigInt.asUintN(16, this.value);
  }

  toDecString() {
    return this.value.toString(10);
  }

  toHexString() {
    return this.unsigned32.toString(16).toUpperCase().padStart(8, '0');
  }

  toOctString() {
    return this.unsigned32.toString(8).padStart(11, '0');
  }

  toBinString() {
    return this.unsigned16.toString(2).padStart(16, '0');
  }

  toBinLines() {
    return [this.toBinString()];
  }

  format(base) {
    switch (base) {
      case 'DEC': return this.toDecString();
      case 'HEX': return this.toHexString();
      case 'OCT': return this.toOctString();
      case 'BIN': return this.toBinString();
      default: return this.toDecString();
    }
  }

  add(other, base = 'DEC') {
    return new BaseNValue(this.value + other.value, base);
  }

  sub(other, base = 'DEC') {
    return new BaseNValue(this.value - other.value, base);
  }

  mul(other, base = 'DEC') {
    return new BaseNValue(this.value * other.value, base);
  }

  div(other, base = 'DEC') {
    if (other.value === 0n) throw new CalcError(ERRORS.MATH);
    return new BaseNValue(this.value / other.value, base);
  }

  neg(base = 'DEC') {
    return new BaseNValue(-this.value, base);
  }

  and(other, isBin = false) {
    if (isBin) {
      return BaseNValue.fromUnsigned((this.unsigned16 & other.unsigned16) & MASK16, 16);
    }
    return BaseNValue.fromUnsigned((this.unsigned32 & other.unsigned32) & MASK32, 32);
  }

  or(other, isBin = false) {
    if (isBin) {
      return BaseNValue.fromUnsigned((this.unsigned16 | other.unsigned16) & MASK16, 16);
    }
    return BaseNValue.fromUnsigned((this.unsigned32 | other.unsigned32) & MASK32, 32);
  }

  xor(other, isBin = false) {
    if (isBin) {
      return BaseNValue.fromUnsigned((this.unsigned16 ^ other.unsigned16) & MASK16, 16);
    }
    return BaseNValue.fromUnsigned((this.unsigned32 ^ other.unsigned32) & MASK32, 32);
  }

  xnor(other, isBin = false) {
    if (isBin) {
      return BaseNValue.fromUnsigned((~(this.unsigned16 ^ other.unsigned16)) & MASK16, 16);
    }
    return BaseNValue.fromUnsigned((~(this.unsigned32 ^ other.unsigned32)) & MASK32, 32);
  }

  not(isBin = false) {
    if (isBin) {
      return BaseNValue.fromUnsigned((~this.unsigned16) & MASK16, 16);
    }
    return BaseNValue.fromUnsigned((~this.unsigned32) & MASK32, 32);
  }
}
