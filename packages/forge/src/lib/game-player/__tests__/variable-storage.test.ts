import { describe, expect, it } from 'vitest';
import {
  createInMemoryVariableStorage,
  InMemoryVariableStorage,
} from '@magicborn/forge/lib/game-player/variable-storage';

describe('InMemoryVariableStorage', () => {
  it('reads and writes values', () => {
    const storage = createInMemoryVariableStorage({ quest_started: true });
    expect(storage.get('quest_started')).toBe(true);

    storage.set('gold', 10);
    expect(storage.get('gold')).toBe(10);
  });

  it('resets to an explicit snapshot', () => {
    const storage = new InMemoryVariableStorage({ a: true, b: 2 });
    storage.reset({ c: 'ready' });
    expect(storage.snapshot()).toEqual({ c: 'ready' });
  });
});
