import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { StoryletNode, STORYLET_CATEGORY, StoryletCategory } from '../types/narrative';
import { Repeat, Store, Sword, Users, Scroll, Sparkles, Tag, Clock } from 'lucide-react';
import { LayoutDirection } from '../utils/layout';

interface StoryletNodeData {
  node: StoryletNode;
  isDimmed?: boolean;
  isInPath?: boolean;
  layoutDirection?: LayoutDirection;
}

const CATEGORY_CONFIG: Record<StoryletCategory, { icon: React.ReactNode; color: string; bgColor: string; borderColor: string }> = {
  [STORYLET_CATEGORY.MERCHANT]: {
    icon: <Store size={18} />,
    color: 'text-yellow-400',
    bgColor: 'from-yellow-950/90 to-yellow-900/70',
    borderColor: 'border-yellow-600/60',
  },
  [STORYLET_CATEGORY.DUNGEON]: {
    icon: <Sword size={18} />,
    color: 'text-red-400',
    bgColor: 'from-red-950/90 to-red-900/70',
    borderColor: 'border-red-600/60',
  },
  [STORYLET_CATEGORY.ENCOUNTER]: {
    icon: <Users size={18} />,
    color: 'text-orange-400',
    bgColor: 'from-orange-950/90 to-orange-900/70',
    borderColor: 'border-orange-600/60',
  },
  [STORYLET_CATEGORY.QUEST]: {
    icon: <Scroll size={18} />,
    color: 'text-cyan-400',
    bgColor: 'from-cyan-950/90 to-cyan-900/70',
    borderColor: 'border-cyan-600/60',
  },
  [STORYLET_CATEGORY.AMBIENT]: {
    icon: <Sparkles size={18} />,
    color: 'text-violet-400',
    bgColor: 'from-violet-950/90 to-violet-900/70',
    borderColor: 'border-violet-600/60',
  },
  [STORYLET_CATEGORY.CUSTOM]: {
    icon: <Tag size={18} />,
    color: 'text-slate-400',
    bgColor: 'from-slate-950/90 to-slate-900/70',
    borderColor: 'border-slate-600/60',
  },
};

export function StoryletNodeV2({ data, selected }: NodeProps<StoryletNodeData>) {
  const {
    node,
    isDimmed,
    isInPath,
    layoutDirection = 'TB',
  } = data;

  const isHorizontal = layoutDirection === 'LR';
  const targetPosition = isHorizontal ? Position.Left : Position.Top;
  const sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

  const config = CATEGORY_CONFIG[node.category] || CATEGORY_CONFIG[STORYLET_CATEGORY.CUSTOM];

  const borderClass = selected
    ? `${config.borderColor.replace('/60', '')} shadow-lg`
    : config.borderColor;

  const descriptionPreview = node.description && node.description.length > 60
    ? node.description.slice(0, 60) + '...'
    : node.description;

  return (
    <div
      className={`rounded-xl border-2 border-dashed transition-all duration-300 ${borderClass} ${isInPath ? 'ring-2 ring-purple-400/50' : ''} bg-gradient-to-br ${config.bgColor} min-w-[220px] max-w-[320px] relative overflow-hidden`}
      style={isDimmed ? { opacity: 0.35, filter: 'saturate(0.3)' } : undefined}
    >
      <Handle
        type="target"
        position={targetPosition}
        className="!bg-purple-600 !border-purple-400 !w-4 !h-4 !rounded-full"
      />

      <div className="px-4 py-3 flex items-center gap-3 border-b border-white/10">
        <div className={`w-9 h-9 rounded-lg bg-black/30 border border-white/20 flex items-center justify-center shadow-lg flex-shrink-0 ${config.color}`}>
          {config.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
              {node.category}
            </span>
            {node.repeatable && (
              <span title="Repeatable">
                <Repeat size={10} className="text-white/50" />
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white/90 truncate leading-tight">
            {node.title}
          </h3>
        </div>
      </div>

      <div className="px-4 py-3">
        {descriptionPreview && (
          <p className="text-xs text-white/60 mb-3 leading-relaxed">
            {descriptionPreview}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {node.repeatable && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 border border-white/20">
              <Repeat size={10} className="text-white/70" />
              <span className="text-[10px] text-white/70">Repeatable</span>
            </div>
          )}

          {node.cooldown && node.cooldown > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 border border-white/20">
              <Clock size={10} className="text-white/70" />
              <span className="text-[10px] text-white/70">{node.cooldown}s</span>
            </div>
          )}

          {node.conditions && node.conditions.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-800/40 border border-amber-500/30">
              <span className="text-[10px] text-amber-300">{node.conditions.length} conditions</span>
            </div>
          )}

          {node.priority !== undefined && node.priority > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 border border-white/20">
              <span className="text-[10px] text-white/70">P{node.priority}</span>
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={sourcePosition}
        id="dialogue"
        className="!bg-purple-600 !border-purple-400 !w-4 !h-4 !rounded-full hover:!bg-purple-500"
      />
    </div>
  );
}
