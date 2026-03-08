import {
  applyOperation,
  getOperationCost,
  parseOperation,
  recomputeElixir,
  resolveClosestWinner,
} from '@arena/shared';

describe('game core rules', () => {
  it('maps operation costs correctly', () => {
    expect(getOperationCost('add', 9999n)).toBe(1);
    expect(getOperationCost('add', 10_000n)).toBe(2);
    expect(getOperationCost('add', 500_000n)).toBe(3);

    expect(getOperationCost('mul', 2n)).toBe(1);
    expect(getOperationCost('mul', 10n)).toBe(4);

    expect(getOperationCost('div', 2n)).toBe(1);
    expect(getOperationCost('div', 10n)).toBe(5);
  });

  it('accepts legal move and rejects illegal division', () => {
    const legal = parseOperation('div', '2', 1);
    expect(applyOperation(100n, legal)).toBe(50n);

    const illegal = parseOperation('div', '3', 2);
    expect(() => applyOperation(50n, illegal)).toThrow(/Division must be exact/);
  });

  it('regenerates elixir lazily', () => {
    const now = Date.now();
    const recomputed = recomputeElixir(4, now - 6_100, now);
    expect(recomputed.actualElixir).toBe(7);
  });

  it('resolves closest and draw outcomes', () => {
    const closest = resolveClosestWinner({
      target: '100',
      playerAId: 'a',
      playerBId: 'b',
      playerAValue: '90',
      playerBValue: '70',
    });

    expect(closest.winnerId).toBe('a');
    expect(closest.isDraw).toBe(false);

    const draw = resolveClosestWinner({
      target: '100',
      playerAId: 'a',
      playerBId: 'b',
      playerAValue: '90',
      playerBValue: '110',
    });

    expect(draw.winnerId).toBeNull();
    expect(draw.isDraw).toBe(true);
  });
});
