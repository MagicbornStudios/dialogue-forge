import type { ForgeFlagValue } from '@magicborn/shared/types/forge-game-state';

export interface VariableStorage {
  get(name: string): ForgeFlagValue | undefined;
  set(name: string, value: ForgeFlagValue): void;
  snapshot(): Record<string, ForgeFlagValue>;
  reset(next?: Record<string, ForgeFlagValue>): void;
}

export class InMemoryVariableStorage implements VariableStorage {
  private readonly values: Record<string, ForgeFlagValue>;

  constructor(initialValues: Record<string, ForgeFlagValue> = {}) {
    this.values = { ...initialValues };
  }

  get(name: string): ForgeFlagValue | undefined {
    return this.values[name];
  }

  set(name: string, value: ForgeFlagValue): void {
    this.values[name] = value;
  }

  snapshot(): Record<string, ForgeFlagValue> {
    return { ...this.values };
  }

  reset(next: Record<string, ForgeFlagValue> = {}): void {
    Object.keys(this.values).forEach((key) => {
      delete this.values[key];
    });
    Object.assign(this.values, next);
  }
}

export function createInMemoryVariableStorage(
  initialValues: Record<string, ForgeFlagValue> = {}
): VariableStorage {
  return new InMemoryVariableStorage(initialValues);
}
