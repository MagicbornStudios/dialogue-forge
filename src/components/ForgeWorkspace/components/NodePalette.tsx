'use client';

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  FileText,
  File,
  User,
  Users,
  GitBranch,
  ArrowRightLeft,
  Layers,
  ArrowRight,
  CircleStop,
} from 'lucide-react';
import { FORGE_NODE_TYPE, NARRATIVE_FORGE_NODE_TYPE, type ForgeNodeType } from '@/src/types/forge/forge-graph';
import { useForgeWorkspaceStore } from '../store/forge-workspace-store';
import { useNodeDrag } from '../hooks/useNodeDrag';
import { SearchInput } from './SearchInput';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/src/components/ui/tooltip';
import { cn } from '@/src/lib/utils';

interface NodeTypeInfo {
  type: ForgeNodeType;
  label: string;
  icon: React.ReactNode;
  category: 'dialogue' | 'structure' | 'logic';
  description: string;
}

const NODE_TYPE_INFO: Record<ForgeNodeType, NodeTypeInfo> = {
  [FORGE_NODE_TYPE.ACT]: {
    type: FORGE_NODE_TYPE.ACT,
    label: 'Act',
    icon: <BookOpen size={14} />,
    category: 'structure',
    description: 'Top-level narrative structure',
  },
  [FORGE_NODE_TYPE.CHAPTER]: {
    type: FORGE_NODE_TYPE.CHAPTER,
    label: 'Chapter',
    icon: <FileText size={14} />,
    category: 'structure',
    description: 'Chapter container',
  },
  [FORGE_NODE_TYPE.PAGE]: {
    type: FORGE_NODE_TYPE.PAGE,
    label: 'Page',
    icon: <File size={14} />,
    category: 'structure',
    description: 'Page container',
  },
  [FORGE_NODE_TYPE.PLAYER]: {
    type: FORGE_NODE_TYPE.PLAYER,
    label: 'Player',
    icon: <User size={14} />,
    category: 'dialogue',
    description: 'Player choice node',
  },
  [FORGE_NODE_TYPE.CHARACTER]: {
    type: FORGE_NODE_TYPE.CHARACTER,
    label: 'Character',
    icon: <Users size={14} />,
    category: 'dialogue',
    description: 'Character dialogue node',
  },
  [FORGE_NODE_TYPE.CONDITIONAL]: {
    type: FORGE_NODE_TYPE.CONDITIONAL,
    label: 'Conditional',
    icon: <GitBranch size={14} />,
    category: 'logic',
    description: 'Conditional branching',
  },
  [FORGE_NODE_TYPE.DETOUR]: {
    type: FORGE_NODE_TYPE.DETOUR,
    label: 'Detour',
    icon: <ArrowRightLeft size={14} />,
    category: 'structure',
    description: 'Call another graph',
  },
  [FORGE_NODE_TYPE.STORYLET]: {
    type: FORGE_NODE_TYPE.STORYLET,
    label: 'Storylet',
    icon: <Layers size={14} />,
    category: 'structure',
    description: 'Storylet reference',
  },
  [FORGE_NODE_TYPE.JUMP]: {
    type: FORGE_NODE_TYPE.JUMP,
    label: 'Jump',
    icon: <ArrowRight size={14} />,
    category: 'logic',
    description: 'Jump to another node',
  },
  [FORGE_NODE_TYPE.END]: {
    type: FORGE_NODE_TYPE.END,
    label: 'End',
    icon: <CircleStop size={14} />,
    category: 'structure',
    description: 'End node',
  },
};

interface NodePaletteProps {
  className?: string;
}

export function NodePalette({ className }: NodePaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { setDraggedNodeType } = useNodeDrag();
  
  // Determine active editor context
  const activeNarrativeGraphId = useForgeWorkspaceStore((s) => s.activeNarrativeGraphId);
  const activeStoryletGraphId = useForgeWorkspaceStore((s) => s.activeStoryletGraphId);
  
  // Determine which node types to show
  const allowedNodeTypes = useMemo(() => {
    if (activeNarrativeGraphId) {
      // Narrative graph: show narrative node types
      return Object.values(NARRATIVE_FORGE_NODE_TYPE);
    } else if (activeStoryletGraphId) {
      // Storylet graph: show storylet node types
      return [
        FORGE_NODE_TYPE.CHARACTER,
        FORGE_NODE_TYPE.PLAYER,
        FORGE_NODE_TYPE.CONDITIONAL,
        FORGE_NODE_TYPE.STORYLET,
        FORGE_NODE_TYPE.DETOUR,
      ];
    }
    // Default: show all
    return Object.values(FORGE_NODE_TYPE);
  }, [activeNarrativeGraphId, activeStoryletGraphId]);

  // Filter and group nodes
  const filteredNodes = useMemo(() => {
    const allNodes = allowedNodeTypes
      .map((type) => NODE_TYPE_INFO[type])
      .filter((info) =>
        info.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        info.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

    // Group by category
    const grouped: Record<string, NodeTypeInfo[]> = {
      dialogue: [],
      structure: [],
      logic: [],
    };

    allNodes.forEach((node) => {
      grouped[node.category].push(node);
    });

    return grouped;
  }, [allowedNodeTypes, searchQuery]);

  const handleDragStart = (e: React.DragEvent, nodeType: ForgeNodeType) => {
    setDraggedNodeType(nodeType);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/reactflow', nodeType);
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedNodeType(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const renderCategory = (category: string, nodes: NodeTypeInfo[]) => {
    if (nodes.length === 0) return null;

    const categoryLabels: Record<string, string> = {
      dialogue: 'Dialogue',
      structure: 'Structure',
      logic: 'Logic',
    };

    return (
      <div key={category} className="mb-3">
        <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-df-text-tertiary">
          {categoryLabels[category]}
        </div>
        <div className="space-y-0.5">
          {nodes.map((nodeInfo) => (
            <TooltipProvider key={nodeInfo.type}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, nodeInfo.type)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 text-xs cursor-grab active:cursor-grabbing',
                      'text-df-text-secondary hover:bg-df-control-hover hover:text-df-text-primary',
                      'hover:border-l-2 hover:border-[var(--color-df-border-hover)]',
                      'transition-colors rounded'
                    )}
                  >
                    <div className="text-df-text-tertiary shrink-0">{nodeInfo.icon}</div>
                    <span className="font-medium">{nodeInfo.label}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{nodeInfo.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('flex h-full w-full flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-df-sidebar-border">
        <div className="flex items-center gap-1.5">
          <Layers size={14} className="text-df-text-tertiary" />
          <span className="text-xs font-medium text-df-text-secondary">Nodes</span>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 py-1.5 border-b border-df-sidebar-border">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search nodes..."
        />
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto py-1">
        {Object.entries(filteredNodes).map(([category, nodes]) =>
          renderCategory(category, nodes)
        )}
        {Object.values(filteredNodes).every((nodes) => nodes.length === 0) && (
          <div className="px-3 py-6 text-center text-xs text-df-text-tertiary">
            {searchQuery ? 'No nodes found' : 'No nodes available'}
          </div>
        )}
      </div>
    </div>
  );
}
