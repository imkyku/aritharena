import { describe, expect, it } from 'vitest';
import { getOperationCost, parseOperation } from '@arena/shared';

describe('operation cost mapping', () => {
  it('computes addition ranges correctly', () => {
    const op1 = parseOperation('add', '1', 1);
    const op2 = parseOperation('add', '10000', 2);
    const op3 = parseOperation('add', '500000', 3);

    expect(getOperationCost(op1.type, op1.operand)).toBe(1);
    expect(getOperationCost(op2.type, op2.operand)).toBe(2);
    expect(getOperationCost(op3.type, op3.operand)).toBe(3);
  });
});
