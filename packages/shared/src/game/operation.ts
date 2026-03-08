import {
  ADD_SUB_MAX,
  ADD_SUB_MIN,
  DIV_MAX,
  DIV_MIN,
  ELIXIR_CAP,
  MAX_RESULT_DIGITS,
  MUL_MAX,
  MUL_MIN,
} from './constants.js';
import { digitLength, parseBigIntString, isExactDivision } from './bigint.js';
import type { OperationType, ParsedOperationIntent } from './types.js';

const addSubCostRanges = [
  { max: 9_999n, cost: 1 },
  { max: 499_999n, cost: 2 },
  { max: 3_000_000n, cost: 3 },
] as const;

const mulCostRanges = [
  { min: 2n, max: 3n, cost: 1 },
  { min: 4n, max: 6n, cost: 2 },
  { min: 7n, max: 8n, cost: 3 },
  { min: 9n, max: 10n, cost: 4 },
] as const;

const divCostRanges = [
  { min: 2n, max: 3n, cost: 1 },
  { min: 4n, max: 5n, cost: 2 },
  { min: 6n, max: 7n, cost: 3 },
  { min: 8n, max: 9n, cost: 4 },
  { min: 10n, max: 10n, cost: 5 },
] as const;

export class OperationValidationError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
  }
}

export function validateOperationRange(type: OperationType, operand: bigint): boolean {
  if (operand <= 0n) {
    return false;
  }

  if (type === 'add' || type === 'sub') {
    return operand >= ADD_SUB_MIN && operand <= ADD_SUB_MAX;
  }

  if (type === 'mul') {
    return operand >= MUL_MIN && operand <= MUL_MAX;
  }

  return operand >= DIV_MIN && operand <= DIV_MAX;
}

export function parseOperation(type: OperationType, operand: string, seq: number): ParsedOperationIntent {
  const parsedOperand = parseBigIntString(operand, 'operand');
  if (!validateOperationRange(type, parsedOperand)) {
    throw new OperationValidationError('OUT_OF_RANGE', 'Operation operand is outside allowed range');
  }

  return {
    type,
    operand: parsedOperand,
    seq,
  };
}

export function getOperationCost(type: OperationType, operand: bigint): number {
  if (!validateOperationRange(type, operand)) {
    throw new OperationValidationError('OUT_OF_RANGE', 'Operation operand is outside allowed range');
  }

  if (type === 'add' || type === 'sub') {
    const range = addSubCostRanges.find((entry) => operand <= entry.max);
    return range ? range.cost : ELIXIR_CAP;
  }

  if (type === 'mul') {
    const range = mulCostRanges.find((entry) => operand >= entry.min && operand <= entry.max);
    return range ? range.cost : ELIXIR_CAP;
  }

  const range = divCostRanges.find((entry) => operand >= entry.min && operand <= entry.max);
  return range ? range.cost : ELIXIR_CAP;
}

export function applyOperation(current: bigint, operation: ParsedOperationIntent): bigint {
  let next: bigint;

  switch (operation.type) {
    case 'add':
      next = current + operation.operand;
      break;
    case 'sub':
      next = current - operation.operand;
      break;
    case 'mul':
      next = current * operation.operand;
      break;
    case 'div': {
      if (!isExactDivision(current, operation.operand)) {
        throw new OperationValidationError('NON_EXACT_DIVISION', 'Division must be exact without remainder');
      }
      next = current / operation.operand;
      break;
    }
    default:
      throw new OperationValidationError('UNKNOWN_OPERATION', 'Unsupported operation type');
  }

  if (next < 0n) {
    throw new OperationValidationError('NEGATIVE_RESULT', 'Result cannot be negative');
  }

  if (digitLength(next) > MAX_RESULT_DIGITS) {
    throw new OperationValidationError('RESULT_TOO_LARGE', 'Result exceeds maximum allowed digits');
  }

  return next;
}
