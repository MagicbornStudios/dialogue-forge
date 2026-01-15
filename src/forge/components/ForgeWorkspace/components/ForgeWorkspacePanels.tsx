import React from 'react';
import type { ForgeGraphDoc } from '@/forge/types/forge-graph';
import type { ForgeGameState } from '@/forge/types/forge-game-state';
import type { ForgeCharacter } from '@/forge/types/characters';
import type { FlagSchema } from '@/forge/types/flags';
import { ForgeSidebar } from './ForgeSideBar/ForgeSidebar';
import { ForgeNarrativeGraphEditor } from '@/forge/components/GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor';
import { ForgeStoryletGraphEditor } from '@/forge/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor';

interface SidebarPanelProps {
  className?: string;
}

export function SidebarPanel({ className }: SidebarPanelProps) {
  return (
    <div className={`h-full w-full flex flex-col ${className ?? ''}`}>
      <ForgeSidebar className="flex-1 min-h-0" />
    </div>
  );
}

interface NarrativeEditorPanelProps {
  graph: ForgeGraphDoc | null;
  onChange: (graph: ForgeGraphDoc) => void;
  className?: string;
}

export function NarrativeEditorPanel({ graph, onChange, className }: NarrativeEditorPanelProps) {
  if (!graph) {
    return (
      <div className={`h-full w-full flex items-center justify-center text-df-text-secondary text-sm ${className ?? ''}`}>
        No narrative graph loaded
      </div>
    );
  }

  return (
    <div className={`h-full w-full flex flex-col ${className ?? ''}`}>
      <ForgeNarrativeGraphEditor 
        graph={graph} 
        onChange={onChange} 
        className="h-full w-full" 
      />
    </div>
  );
}

interface StoryletEditorPanelProps {
  graph: ForgeGraphDoc | null;
  onChange: (graph: ForgeGraphDoc) => void;
  flagSchema?: FlagSchema;
  gameState?: ForgeGameState;
  characters?: Record<string, ForgeCharacter>;
  className?: string;
}

export function StoryletEditorPanel({ 
  graph, 
  onChange, 
  flagSchema, 
  gameState, 
  characters,
  className 
}: StoryletEditorPanelProps) {
  if (!graph) {
    return (
      <div className={`h-full w-full flex items-center justify-center text-df-text-secondary text-sm ${className ?? ''}`}>
        No storylet graph loaded
      </div>
    );
  }

  return (
    <div className={`h-full w-full flex flex-col ${className ?? ''}`}>
      <ForgeStoryletGraphEditor
        graph={graph}
        onChange={onChange}
        flagSchema={flagSchema}
        gameState={gameState}
        characters={characters}
        className="h-full w-full"
      />
    </div>
  );
}
