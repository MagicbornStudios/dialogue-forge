/**
 * Character Types
 * 
 * Defines character data structure for dialogue nodes
 */

export interface ForgeCharacter {
  id: string;
  name: string;
  avatar?: string | number | null; // URL, path, or numeric ID to avatar image
  description?: string;
  meta?: unknown; // Additional character metadata
  // Additional character metadata can be added here
  [key: string]: any; // Allow extensibility
}

