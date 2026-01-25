import React, { useCallback, useMemo, useState } from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath, getBezierPath, Position } from 'reactflow';
import type { ForgeReactFlowEdge, ForgeReactFlowNode, ForgeNodeType } from '@/forge/types/forge-graph';
import { edgeColorFor } from '@/forge/lib/utils/forge-edge-styles';
import { EdgePulseAnimation, LoopIndicator, LoopArrowMarker } from '../Nodes/components/shared/EdgeSVGElements';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';
import { useForgeEditorActions } from '@/forge/lib/graph-editor/hooks/useForgeEditorActions';

interface EdgeContextMenuData {
  insertElementTypes?: Array<{ type: ForgeNodeType; label: string }>; // Data only, not callback
  sourceNode?: ForgeReactFlowNode;
  sourceType?: string; // Legacy support for narrative elements
}

function getChoiceIndex(sourceHandle?: string | null): number | null {
  if (!sourceHandle) return null;
  if (sourceHandle.startsWith('choice-')) {
    const idx = parseInt(sourceHandle.replace('choice-', ''), 10);
    return Number.isFinite(idx) ? idx : null;
  }
  if (sourceHandle.startsWith('block-')) {
    const idx = parseInt(sourceHandle.replace('block-', ''), 10);
    return Number.isFinite(idx) ? idx : null;
  }
  return null;
}

export const ForgeEdge = React.memo(function ForgeEdge({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  selected,
  data,
  ...props
}: EdgeProps) {
  // Access sourceHandle from props (may not be in EdgeProps type but exists at runtime)
  const sourceHandle = (props as any).sourceHandle ?? data?.sourceHandle;
  const [hovered, setHovered] = useState(false);
  
  const isBackEdge = data?.isBackEdge ?? false;
  const menuData = data as EdgeContextMenuData | undefined;
  const sourceNode = menuData?.sourceNode;
  const choiceIndex = useMemo(
    () => getChoiceIndex(sourceHandle ?? data?.sourceHandle ?? null),
    [sourceHandle, data?.sourceHandle],
  );
  const dataChoiceIndex = choiceIndex !== null ? ((choiceIndex % 5) + 5) % 5 : null;
  const isChoiceHandle = dataChoiceIndex !== null;
  
  // Get edge color using centralized function
  const edge = useMemo(
    () => ({ sourceHandle: sourceHandle ?? data?.sourceHandle } as ForgeReactFlowEdge),
    [sourceHandle, data?.sourceHandle],
  );
  const baseColor = useMemo(() => edgeColorFor(edge, sourceNode), [edge, sourceNode]);
  const edgeColor = isChoiceHandle ? 'var(--edge-color)' : baseColor;
  
  // Use smooth step path for angular look (like the horizontal example)
  // For back edges, use bezier for a more curved appearance
  const [edgePath, labelX, labelY] = useMemo(() => {
    if (isBackEdge) {
      return getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        curvature: 0.5,
      });
    }
    return getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition: sourcePosition || Position.Bottom,
      targetX,
      targetY,
      targetPosition: targetPosition || Position.Top,
      borderRadius: 8,
    });
  }, [isBackEdge, sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition]);

  const isSelected = selected || hovered;
  const isDimmed = data?.isDimmed ?? false;
  const isInPath = data?.isInPathToSelected ?? false;
  const draftData = data as { isDraftAdded?: boolean; isDraftUpdated?: boolean } | undefined;
  const isDraft = draftData?.isDraftAdded || draftData?.isDraftUpdated;
  
  // Determine stroke color - use vibrant green on hover/selected
  const strokeColor = isDimmed 
    ? 'var(--color-df-edge-dimmed)' 
    : (hovered || selected)
      ? 'var(--color-df-edge-default-hover)'
      : isBackEdge 
        ? 'var(--color-df-edge-loop)' 
        : edgeColor;

  const draftStrokeColor = isDraft ? 'var(--color-df-warning)' : strokeColor;
  
  const strokeWidth = isSelected || isInPath ? 4 : 3;
  const opacity = isDimmed ? 0.4 : (isSelected || isInPath ? 1 : 0.9);
  
  // Add glow effect when hovered or in path (only if not dimmed)
  const glowColor = isDraft ? 'var(--color-df-warning)' : (isBackEdge ? 'var(--color-df-edge-loop)' : edgeColor);
  const filter = (hovered || isInPath || isDraft) && !isDimmed 
    ? `drop-shadow(0 0 8px ${glowColor})`
    : !isDimmed
    ? `drop-shadow(0 0 2px ${glowColor})`
    : undefined;

  // For pulse animation
  const pulseColor = isBackEdge ? 'var(--color-df-edge-loop)' : edgeColor;
  const shouldAnimate = isInPath;
  
  // Loop arrow color
  const loopArrowColor = 'var(--color-df-edge-loop)';

  // Use actions instead of callbacks
  const actions = useForgeEditorActions();
  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);
  const handleDeleteEdge = useCallback(() => actions.deleteEdge(id), [actions, id]);
  
  const insertElementTypes = menuData?.insertElementTypes;
  const hasContextMenu = !!insertElementTypes && insertElementTypes.length > 0;
  const edgeStyle = useMemo(() => ({
    stroke: draftStrokeColor,
    strokeWidth,
    opacity,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    filter,
    // Dashed line for back edges
    strokeDasharray: isBackEdge ? '8 4' : undefined,
  }), [draftStrokeColor, strokeWidth, opacity, filter, isBackEdge]);

  const edgeContent = (
    <>
      {/* Invisible wider path for easier clicking and hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ cursor: 'pointer', pointerEvents: 'all' as React.CSSProperties['pointerEvents'] }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      <BaseEdge 
        id={id} 
        path={edgePath}
        style={edgeStyle}
        markerEnd={isBackEdge ? `url(#loop-arrow-${id})` : 'url(#react-flow__arrowclosed)'}
      />
      {/* Loop indicator icon for back edges */}
      <LoopIndicator 
        x={labelX} 
        y={labelY} 
        color={strokeColor} 
        visible={isBackEdge} 
      />
      {/* Pulsing forward animation - only if edge is in path to selected node */}
      <EdgePulseAnimation 
        path={edgePath} 
        color={pulseColor} 
        visible={shouldAnimate} 
      />
      {/* Define marker for back edge */}
      <LoopArrowMarker 
        id={`loop-arrow-${id}`} 
        color={loopArrowColor} 
        visible={isBackEdge} 
      />
    </>
  );

  if (!hasContextMenu) {
    return (
      <g
        data-choice-index={dataChoiceIndex ?? undefined}
        className={isChoiceHandle
          ? `forge-choice-edge${isDimmed ? ' is-dimmed' : ''}${isBackEdge ? ' is-loop' : ''}${isDraft ? ' is-draft' : ''}`
          : `forge-edge${isDraft ? ' is-draft' : ''}`}
      >
        {edgeContent}
      </g>
    );
  }

  // Calculate midpoint for insert operations (if needed)
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <g
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          data-choice-index={dataChoiceIndex ?? undefined}
          className={isChoiceHandle
            ? `forge-choice-edge${isDimmed ? ' is-dimmed' : ''}${isBackEdge ? ' is-loop' : ''}${isDraft ? ' is-draft' : ''}`
            : `forge-edge${isDraft ? ' is-draft' : ''}`}
        >
          {edgeContent}
        </g>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-52">
        {insertElementTypes && insertElementTypes.length > 0 && (
          <>
            {insertElementTypes.map(({ type, label }) => (
              <ContextMenuItem
                key={type}
                onSelect={() => actions.insertNodeOnEdge(id, type, midX, midY)}
              >
                Insert {label}
              </ContextMenuItem>
            ))}
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem
          onSelect={handleDeleteEdge}
          className="text-destructive focus:text-destructive"
        >
          Delete edge
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

ForgeEdge.displayName = 'ForgeEdge';
