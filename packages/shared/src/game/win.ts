import { absDistanceBigInt, parseBigIntString } from './bigint.js';
import type { WinResolutionInput, WinResolutionResult } from './types.js';

export function resolveClosestWinner(input: WinResolutionInput): WinResolutionResult {
  const target = parseBigIntString(input.target, 'target');
  const aValue = parseBigIntString(input.playerAValue, 'playerAValue');
  const bValue = parseBigIntString(input.playerBValue, 'playerBValue');

  const aDistance = absDistanceBigInt(target, aValue);
  const bDistance = absDistanceBigInt(target, bValue);

  if (aDistance < bDistance) {
    return {
      winnerId: input.playerAId,
      isDraw: false,
      distances: {
        [input.playerAId]: aDistance.toString(),
        [input.playerBId]: bDistance.toString(),
      },
    };
  }

  if (bDistance < aDistance) {
    return {
      winnerId: input.playerBId,
      isDraw: false,
      distances: {
        [input.playerAId]: aDistance.toString(),
        [input.playerBId]: bDistance.toString(),
      },
    };
  }

  return {
    winnerId: null,
    isDraw: true,
    distances: {
      [input.playerAId]: aDistance.toString(),
      [input.playerBId]: bDistance.toString(),
    },
  };
}
