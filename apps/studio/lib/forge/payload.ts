'use client';

import { PayloadSDK } from '@payloadcms/sdk';

export const payload = new PayloadSDK({
  baseURL: typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:3000/api',
});
