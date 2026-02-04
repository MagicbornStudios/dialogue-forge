'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          error: 'bg-red-600 text-white border-red-700',
          success: 'bg-green-600 text-white border-green-700',
          warning: 'bg-yellow-600 text-white border-yellow-700',
          info: 'bg-blue-600 text-white border-blue-700',
        },
      }}
    />
  );
}
