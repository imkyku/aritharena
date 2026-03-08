import { calculateElo } from './ratings.service.js';

describe('Elo calculator', () => {
  it('updates ratings with expected direction for win/loss', () => {
    const result = calculateElo(1000, 1000, 0, 0, 1);
    expect(result.newA).toBeGreaterThan(1000);
    expect(result.newB).toBeLessThan(1000);
  });

  it('handles draw symmetrically', () => {
    const result = calculateElo(1200, 1200, 50, 50, 0.5);
    expect(result.newA).toBe(1200);
    expect(result.newB).toBe(1200);
  });
});
