import type { ForgeDataAdapter } from '@/src/components/forge/forge-data-adapter/forge-data-adapter';
import { makePayloadForgeAdapter } from '@/app/lib/forge/data-adapter/payload-forge-adapter';

export function makePayloadWriterAdapter(opts?: {
  baseUrl?: string;
}): ForgeDataAdapter {
  return makePayloadForgeAdapter(opts);
}
