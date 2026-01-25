import type { TemplateInputKey } from '@/shared/types/bindings';

export interface VideoTemplateOverrides {
  inputs?: Partial<Record<TemplateInputKey, unknown>>;
  frameInputs?: Record<string, Partial<Record<TemplateInputKey, unknown>>>;
}
