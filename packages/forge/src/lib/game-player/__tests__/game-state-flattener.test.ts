import { describe, expect, it } from 'vitest';
import { extractFlagsFromGameState } from '@magicborn/forge/lib/game-player/game-state-flattener';

describe('game-state-flattener includeFalsyNumbers', () => {
  const gameState = {
    flags: {
      started: true,
    },
    player: {
      gold: 0,
      hp: 42,
      alive: true,
      nickname: '',
    },
  };

  it('drops numeric zero by default', () => {
    const flags = extractFlagsFromGameState(gameState);
    expect(flags.player_gold).toBeUndefined();
    expect(flags.player_hp).toBe(42);
  });

  it('keeps numeric zero when includeFalsyNumbers is true', () => {
    const flags = extractFlagsFromGameState(gameState, {
      includeFalsyNumbers: true,
    });
    expect(flags.player_gold).toBe(0);
    expect(flags.player_hp).toBe(42);
    expect(flags.player_nickname).toBeUndefined();
  });
});
