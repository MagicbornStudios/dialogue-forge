'use client';

import React, { createContext, useContext } from 'react';
import type { WriterDataAdapter } from '@magicborn/writer/lib/data-adapter/writer-adapter';

const WriterDataContext = createContext<WriterDataAdapter | null>(null);

export function useWriterDataContext(): WriterDataAdapter | null {
  return useContext(WriterDataContext);
}

export { WriterDataContext };
