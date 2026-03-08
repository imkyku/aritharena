import { ELIXIR_CAP, ELIXIR_REGEN_INTERVAL_MS } from './constants.js';

export interface RecomputedElixir {
  actualElixir: number;
  regenSteps: number;
  regenAnchor: number;
}

export function recomputeElixir(
  storedElixir: number,
  lastElixirUpdateAt: number,
  nowMs: number,
): RecomputedElixir {
  if (storedElixir >= ELIXIR_CAP) {
    return {
      actualElixir: ELIXIR_CAP,
      regenSteps: 0,
      regenAnchor: nowMs,
    };
  }

  const elapsed = Math.max(0, nowMs - lastElixirUpdateAt);
  const regenSteps = Math.floor(elapsed / ELIXIR_REGEN_INTERVAL_MS);
  const actualElixir = Math.min(ELIXIR_CAP, storedElixir + regenSteps);

  return {
    actualElixir,
    regenSteps,
    regenAnchor: lastElixirUpdateAt + regenSteps * ELIXIR_REGEN_INTERVAL_MS,
  };
}

export function spendElixir(
  storedElixir: number,
  lastElixirUpdateAt: number,
  cost: number,
  nowMs: number,
): { storedElixir: number; lastElixirUpdateAt: number; actualElixirBeforeSpend: number } {
  const recomputed = recomputeElixir(storedElixir, lastElixirUpdateAt, nowMs);

  if (recomputed.actualElixir < cost) {
    throw new Error('INSUFFICIENT_ELIXIR');
  }

  return {
    actualElixirBeforeSpend: recomputed.actualElixir,
    storedElixir: recomputed.actualElixir - cost,
    lastElixirUpdateAt: recomputed.regenAnchor,
  };
}
