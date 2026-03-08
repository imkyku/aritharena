import { generateReachableMatchNumbers } from '@arena/shared';

describe('match target generation', () => {
  it('builds reachable target from start via hidden operations', () => {
    const generated = generateReachableMatchNumbers();

    expect(generated.startNumber).toMatch(/^\d{15}$/);
    expect(generated.targetNumber).toMatch(/^\d{1,14}$/);
    expect(generated.hiddenOperations.length).toBeGreaterThanOrEqual(5);
    expect(generated.hiddenOperations.length).toBeLessThanOrEqual(7);
  });
});
