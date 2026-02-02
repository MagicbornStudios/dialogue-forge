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
import { FORGE_NODE_TYPE, NARRATIVE_FORGE_NODE_TYPE, type ForgeNodeType } from '@/forge/types/forge-graph';
import { useForgeWorkspaceStore } from '@/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { useNodeDrag } from '@/forge/components/ForgeWorkspace/hooks/useNodeDrag';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { cn } from '@/shared/lib/utils';
import { FORGE_NODE_TYPE_LABELS } from '@/forge/types/ui-constants';
import { SectionHeader } from './SectionHeader';

/**
 * Get the CSS color variable for a node type's icon
 */
function getNodeIconColor(nodeType: ForgeNodeType): string {
  const colorMap: Record<ForgeNodeType, string> = {
    [FORGE_NODE_TYPE.CHARACTER]: 'var(--editor-npc-border)',
    [FORGE_NODE_TYPE.PLAYER]: 'var(--editor-player-border)',
    [FORGE_NODE_TYPE.CONDITIONAL]: 'var(--editor-conditional-border)',
    [FORGE_NODE_TYPE.ACT]: '#8b5cf6', // Purple
    [FORGE_NODE_TYPE.CHAPTER]: '#06b6d4', // Cyan
    [FORGE_NODE_TYPE.PAGE]: '#22c55e', // Green
    [FORGE_NODE_TYPE.DETOUR]: '#a78bfa', // Light purple
    [FORGE_NODE_TYPE.STORYLET]: 'var(--editor-npc-border)', // Use NPC color
    [FORGE_NODE_TYPE.JUMP]: '#f472b6', // Pink
    [FORGE_NODE_TYPE.END]: '#9ca3af', // Gray
  };
  return colorMap[nodeType] || 'var(--editor-muted-foreground)';
}

/**
 * Create a colored icon component for a node type
 */
function ColoredNodeIcon({ nodeType, icon }: { nodeType: ForgeNodeType; icon: React.ReactNode }) {
  const color = getNodeIconColor(nodeType);
  if (React.isValidElement(icon)) {
    return (
      <div className="shrink-0" style={{ color }}>
        {React.cloneElement(icon as React.ReactElement<any>, { 
          size: 14,
          className: cn((icon as React.ReactElement<any>).props?.className, 'shrink-0')
        })}
      </div>
    );
  }
  return <div className="shrink-0" style={{ color }}>{icon}</div>;
}

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
  
  // Determine focused editor context
  const focusedEditor = useForgeWorkspaceStore((s) => s.focusedEditor);
  
  // Determine which node types to show based on focused editor
  const allowedNodeTypes = useMemo(() => {
    if (focusedEditor === 'narrative') {
      // Narrative editor: show narrative node types
      return Object.values(NARRATIVE_FORGE_NODE_TYPE);
    } else if (focusedEditor === 'storylet') {
      // Storylet editor: show storylet node types
      return [
        FORGE_NODE_TYPE.CHARACTER,
        FORGE_NODE_TYPE.PLAYER,
        FORGE_NODE_TYPE.CONDITIONAL,
        FORGE_NODE_TYPE.STORYLET,
        FORGE_NODE_TYPE.DETOUR,
      ];
    }
    // Default: show all when no editor is focused
    return Object.values(FORGE_NODE_TYPE);
  }, [focusedEditor]);

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
        <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {categoryLabels[category]}
        </div>
        <div className="space-y-0.5">
          {nodes.map((nodeInfo) => (
            <Tooltip key={nodeInfo.type}>
              <TooltipTrigger asChild>
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, nodeInfo.type)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 text-xs cursor-grab active:cursor-grabbing',
                    'text-muted-foreground hover:bg-muted hover:text-foreground',
                    'transition-colors rounded',
                    focusedEditor === 'narrative' && 'border-l-1 border-l-[var(--editor-info)]',
                    focusedEditor === 'storylet' && 'border-l-1 border-l-[var(--editor-edge-choice)]'
                  )}
                >
                  <ColoredNodeIcon nodeType={nodeInfo.type} icon={nodeInfo.icon} />
                  <span className="font-medium">{nodeInfo.label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{FORGE_NODE_TYPE_LABELS[nodeInfo.type]}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('flex h-full w-full flex-col', className)}>
      <SectionHeader
        title="Nodes"
        icon={<Layers size={14} />}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search nodes..."
        focusedEditor={focusedEditor}
      />

      {/* Node list */}
      <div className="flex-1 overflow-y-auto py-1">
        {Object.entries(filteredNodes).map(([category, nodes]) =>
          renderCategory(category, nodes)
        )}
        {Object.values(filteredNodes).every((nodes) => nodes.length === 0) && (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            {searchQuery ? 'No nodes found' : 'No nodes available'}
          </div>
        )}
      </div>
    </div>
  );
}
