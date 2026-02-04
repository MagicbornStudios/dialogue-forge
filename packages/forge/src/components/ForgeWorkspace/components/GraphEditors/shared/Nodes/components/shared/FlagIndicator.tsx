import React from 'react';
import { getFlagIndicatorProps } from '@magicborn/forge/lib/flag-utils';
import type { FlagSchema } from '@magicborn/forge/types/flags';

interface FlagIndicatorProps {
  flagId: string;
  flagSchema?: FlagSchema;
  className?: string;
}

/**
 * Reusable flag indicator component
 * 
 * Renders a small pill/flag indicator for a given flag ID.
 * Consolidates flag rendering logic from PlayerNode, CharacterNode, and ConditionalNode.
 */
export function FlagIndicator({ flagId, flagSchema, className }: FlagIndicatorProps) {
  const props = getFlagIndicatorProps(flagId, flagSchema, className);
  
  if (!props) return null;
  
  return <span {...props} />;
}