import type { TemplateInputKey } from '../../../shared/types/bindings';

export type TemplateInputs = Partial<Record<TemplateInputKey, unknown>>;

export interface ResolvedBindings {
  resolvedInputs?: Record<string, unknown>;
  missing: TemplateInputKey[];
}

const sortTemplateInputs = (bindings: Record<string, TemplateInputKey>): [string, TemplateInputKey][] => {
  return Object.entries(bindings).sort(([left], [right]) => left.localeCompare(right));
};

export const resolveBindings = (
  bindings: Record<string, TemplateInputKey> | undefined,
  inputs: TemplateInputs,
): ResolvedBindings => {
  if (!bindings) {
    return {
      resolvedInputs: undefined,
      missing: [],
    };
  }

  const resolvedInputs: Record<string, unknown> = {};
  const missing = new Set<TemplateInputKey>();

  sortTemplateInputs(bindings).forEach(([inputName, bindingKey]) => {
    if (Object.prototype.hasOwnProperty.call(inputs, bindingKey)) {
      resolvedInputs[inputName] = inputs[bindingKey];
    } else {
      missing.add(bindingKey);
    }
  });

  return {
    resolvedInputs: Object.keys(resolvedInputs).length > 0 ? resolvedInputs : undefined,
    missing: [...missing].sort(),
  };
};
