import {
  START_NUMBER_DIGITS,
  TARGET_MAX_DIGITS,
  TARGET_MIN_DIGITS,
  ADD_SUB_MAX,
  MUL_MAX,
  DIV_MAX,
} from './constants.js';
import { digitLength } from './bigint.js';
import { applyOperation, parseOperation } from './operation.js';
import type { MatchGenerationResult, OperationType, ParsedOperationIntent } from './types.js';

function randomIntInclusive(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBigIntWithDigits(digits: number): bigint {
  if (digits <= 0) {
    throw new Error('digits must be > 0');
  }
  const firstDigit = randomIntInclusive(1, 9).toString();
  const restLength = digits - 1;
  let rest = '';
  for (let i = 0; i < restLength; i += 1) {
    rest += randomIntInclusive(0, 9).toString();
  }
  return BigInt(firstDigit + rest);
}

function weightedOperation(current: bigint): OperationType {
  const options: OperationType[] = ['sub', 'div', 'add', 'mul'];
  if (current < 10n) {
    return 'add';
  }
  return options[randomIntInclusive(0, options.length - 1)];
}

function randomOperand(type: OperationType, current: bigint): bigint {
  switch (type) {
    case 'add':
      return BigInt(randomIntInclusive(1, Number(ADD_SUB_MAX)));
    case 'sub': {
      const upper = current > ADD_SUB_MAX ? ADD_SUB_MAX : current;
      const max = upper > 1n ? Number(upper) : 1;
      return BigInt(randomIntInclusive(1, max));
    }
    case 'mul':
      return BigInt(randomIntInclusive(2, Number(MUL_MAX)));
    case 'div': {
      const divisors: number[] = [];
      for (let i = 2; i <= Number(DIV_MAX); i += 1) {
        if (current % BigInt(i) === 0n) {
          divisors.push(i);
        }
      }
      if (divisors.length === 0) {
        return 2n;
      }
      return BigInt(divisors[randomIntInclusive(0, divisors.length - 1)]);
    }
    default:
      return 1n;
  }
}

export function generateReachableMatchNumbers(): MatchGenerationResult {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const start = randomBigIntWithDigits(START_NUMBER_DIGITS);
    let current = start;
    const sequenceLength = randomIntInclusive(5, 7);
    const operations: ParsedOperationIntent[] = [];

    for (let seq = 1; seq <= sequenceLength; seq += 1) {
      const chosenType = weightedOperation(current);
      const operand = randomOperand(chosenType, current);

      try {
        const operation = parseOperation(chosenType, operand.toString(), seq);
        const next = applyOperation(current, operation);
        if (digitLength(next) > TARGET_MAX_DIGITS && seq === sequenceLength) {
          break;
        }
        current = next;
        operations.push(operation);
      } catch {
        continue;
      }
    }

    const targetDigits = digitLength(current);
    if (
      operations.length >= 5 &&
      targetDigits >= TARGET_MIN_DIGITS &&
      targetDigits <= TARGET_MAX_DIGITS &&
      current > 0n
    ) {
      return {
        startNumber: start.toString(),
        targetNumber: current.toString(),
        hiddenOperations: operations,
      };
    }
  }

  throw new Error('Unable to generate match numbers after retries');
}
