import { z } from 'zod';

export const bigIntStringSchema = z.string().regex(/^\d+$/, 'Expected unsigned integer string');

export function parseBigIntString(value: string, label = 'value'): bigint {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${label} must be a non-negative integer string`);
  }
  return BigInt(value);
}

export function parseSignedBigIntString(value: string, label = 'value'): bigint {
  if (!/^-?\d+$/.test(value)) {
    throw new Error(`${label} must be an integer string`);
  }
  return BigInt(value);
}

export function digitLength(value: bigint): number {
  return value.toString().replace('-', '').length;
}

export function isExactDivision(dividend: bigint, divisor: bigint): boolean {
  if (divisor === 0n) {
    return false;
  }
  return dividend % divisor === 0n;
}

export function absDistanceBigInt(a: bigint, b: bigint): bigint {
  return a >= b ? a - b : b - a;
}
