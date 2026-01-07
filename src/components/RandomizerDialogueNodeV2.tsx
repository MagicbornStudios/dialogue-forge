import React, { useEffect, useRef, useState } from 'react';
import { Handle, Position, NodeProps, useUpdateNodeInternals } from 'reactflow';
import { Shuffle, Hash, Flag, Play, GitBranch } from 'lucide-react';
import { DialogueNode } from '../types';
import { LayoutDirection } from '../utils/layout';
import { RandomizerBranch } from '../types/narrative';

interface RandomizerNodeData {
  node: DialogueNode;
  isDimmed?: boolean;
  isInPath?: boolean;
  layoutDirection?: LayoutDirection;
  isStartNode?: boolean;
  isEndNode?: boolean;
}

const RANDOMIZER_COLORS = ['#e94560', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b'];

export function RandomizerDialogueNodeV2({ data, selected }: NodeProps<RandomizerNodeData>) {
  const { node, isDimmed, isInPath, layoutDirection = 'TB', isStartNode, isEndNode } = data;
  const branches = node.randomizerBranches || [];
  const updateNodeInternals = useUpdateNodeInternals();
  const headerRef = useRef<HTMLDivElement>(null);
  const branchRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [handlePositions, setHandlePositions] = useState<number[]>([]);

  const isHorizontal = layoutDirection === 'LR';
  const targetPosition = isHorizontal ? Position.Left : Position.Top;

  useEffect(() => {
    if (headerRef.current && branches.length > 0) {
      const positions: number[] = [];
      const headerHeight = headerRef.current.offsetHeight;
      let cumulativeHeight = headerHeight;

      branches.forEach((_branch: RandomizerBranch, idx: number) => {
        const branchEl = branchRefs.current[idx];
        if (branchEl) {
          const branchHeight = branchEl.offsetHeight;
          positions.push(cumulativeHeight + branchHeight / 2);
          cumulativeHeight += branchHeight;
        } else {
          const estimatedHeight = 36;
          positions.push(cumulativeHeight + estimatedHeight / 2);
          cumulativeHeight += estimatedHeight;
        }
      });

      setHandlePositions(positions);
      setTimeout(() => {
        updateNodeInternals(node.id);
      }, 0);
    }
  }, [branches.length, node.id, updateNodeInternals]);

  const borderClass = selected
    ? 'border-df-player-selected shadow-lg shadow-df-glow'
    : isStartNode
      ? 'border-df-start shadow-md'
      : isEndNode
        ? 'border-df-end shadow-md'
        : 'border-df-player-border';

  const headerBgClass = isStartNode
    ? 'bg-df-start-bg'
    : isEndNode
      ? 'bg-df-end-bg'
      : 'bg-df-player-header';

  return (
    <div
      className={`rounded-lg border-2 transition-all duration-300 ${borderClass} ${isInPath ? 'border-df-player-selected/70' : ''} bg-df-player-bg min-w-[320px] max-w-[450px] relative overflow-hidden`}
      style={isDimmed ? { opacity: 0.35, filter: 'saturate(0.3)' } : undefined}
    >
      <Handle
        type="target"
        position={targetPosition}
        className="!bg-df-control-bg !border-df-control-border !w-4 !h-4 !rounded-full"
      />

      <div
        ref={headerRef}
        className={`${headerBgClass} border-b-2 border-df-player-border px-3 py-2.5 flex items-center gap-3 relative`}
      >
        <div className="w-14 h-14 rounded-full bg-df-player-bg border-[3px] border-df-player-border flex items-center justify-center text-3xl shadow-lg flex-shrink-0">
          <Shuffle size={20} className="text-df-player-selected" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-df-text-primary truncate leading-tight">Randomizer</h3>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-df-base/50 border border-df-control-border" title={`Node ID: ${node.id}`}>
            <Hash size={12} className="text-df-text-secondary" />
            <span className="text-[10px] font-mono text-df-text-secondary">{node.id}</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded bg-df-player-selected/20 border border-df-player-selected/50" title="Randomizer Node">
            <Shuffle size={14} className="text-df-player-selected" />
            <span className="text-[10px] font-semibold text-df-player-selected">RANDOMIZER</span>
          </div>
        </div>

        {isStartNode && (
          <div className="absolute top-1 right-1 bg-df-start text-df-text-primary text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-lg z-20">
            <Play size={8} fill="currentColor" /> START
          </div>
        )}
        {isEndNode && (
          <div className="absolute top-1 right-1 bg-df-end text-df-text-primary text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-lg z-20">
            <Flag size={8} /> END
          </div>
        )}
      </div>

      <div className="px-4 py-3">
        {branches.length === 0 ? (
          <div className="text-xs text-df-text-secondary bg-df-elevated border border-df-control-border rounded px-3 py-2 text-center">
            No randomizer branches yet.
          </div>
        ) : (
          <div className="space-y-2">
            {branches.map((branch, idx) => {
              const color = RANDOMIZER_COLORS[idx % RANDOMIZER_COLORS.length];
              const label = branch.label || `Branch ${idx + 1}`;

              return (
                <div
                  key={branch.id}
                  ref={el => {
                    branchRefs.current[idx] = el;
                  }}
                  className="relative bg-df-elevated border border-df-control-border rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-df-base text-df-text-primary font-semibold">
                      {label}
                    </span>
                    {branch.weight !== undefined && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-df-player-selected/20 text-df-player-selected border border-df-player-selected/40 font-semibold">
                        wt {branch.weight}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-df-text-secondary space-y-1">
                    {branch.nextNodeId ? (
                      <div className="flex items-center gap-1">
                        <GitBranch size={12} className="text-df-player-selected" />
                        <span className="font-mono">{branch.nextNodeId}</span>
                      </div>
                    ) : (
                      <div className="text-df-text-tertiary">No target node</div>
                    )}
                    {branch.storyletPoolId && (
                      <div className="text-[10px] text-df-text-secondary font-mono">Pool: {branch.storyletPoolId}</div>
                    )}
                  </div>

                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`branch-${idx}`}
                    style={{
                      top: `${handlePositions[idx] || 0}px`,
                      right: -8,
                      borderColor: color,
                    }}
                    className="!bg-df-control-bg !border-2 !w-3 !h-3 !rounded-full hover:!border-df-player-selected hover:!bg-df-player-selected/20"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
