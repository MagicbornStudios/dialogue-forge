'use client';

import React, { createContext, useContext } from 'react';
import type { ThemeDataAdapter } from '@magicborn/theme/workspace/theme-workspace-contracts';

const ThemeDataContext = createContext<ThemeDataAdapter | null>(null);

export function useThemeDataContext(): ThemeDataAdapter | null {
  return useContext(ThemeDataContext);
}

export { ThemeDataContext };
