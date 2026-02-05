'use client';

import React, { createContext, useContext } from 'react';
import type { ForgeDataAdapter } from '@magicborn/forge/adapters/forge-data-adapter';

const ForgeDataContext = createContext<ForgeDataAdapter | null>(null);

export function useForgeDataContext(): ForgeDataAdapter | null {
  return useContext(ForgeDataContext);
}

export { ForgeDataContext };
