import React from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';

interface ListPanelProps {
  title: string;
  subtitle: string;
  onAdd?: () => void;
  addButtonLabel?: string;
  extraActions?: React.ReactNode;
  children: React.ReactNode;
}

export function ListPanel({
  title,
  subtitle,
  onAdd,
  addButtonLabel,
  extraActions,
  children,
}: ListPanelProps) {
  return (
    <section className="bg-[#10101a] border border-[#1f1f2e] rounded-lg overflow-hidden flex flex-col">
      <div className="px-3 py-2 border-b border-[#1f1f2e] flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">{subtitle}</p>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {extraActions}
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="p-1.5 bg-[#e94560] hover:bg-[#d63850] text-white rounded"
              title={addButtonLabel ?? `Add ${title}`}
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

interface ListItemProps {
  title: string;
  subtitle?: string;
  badge?: string;
  selected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function ListItem({
  title,
  subtitle,
  badge,
  selected,
  onSelect,
  onMoveUp,
  onMoveDown,
}: ListItemProps) {
  return (
    <div
      className={`border rounded-lg p-2 transition-colors flex items-center justify-between gap-2 ${
        selected
          ? 'border-[#e94560] bg-[#1a1a2a]'
          : 'border-[#232336] bg-[#12121a] hover:border-[#35354a]'
      }`}
    >
      <button type="button" onClick={onSelect} className="flex-1 text-left">
        <div className="text-sm text-white font-medium truncate">{title}</div>
        <div className="flex items-center gap-2">
          {subtitle && <div className="text-[10px] text-gray-500 font-mono truncate">{subtitle}</div>}
          {badge && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#0f0f18] border border-[#2a2a3e] text-gray-400">
              {badge}
            </span>
          )}
        </div>
      </button>
      <div className="flex flex-col gap-1">
        <button type="button" onClick={onMoveUp} className="text-gray-500 hover:text-white">
          <ChevronUp size={14} />
        </button>
        <button type="button" onClick={onMoveDown} className="text-gray-500 hover:text-white">
          <ChevronDown size={14} />
        </button>
      </div>
    </div>
  );
}

interface DetailFieldProps {
  label: string;
  children: React.ReactNode;
}

export function DetailField({ label, children }: DetailFieldProps) {
  return (
    <label className="text-[10px] text-gray-500 uppercase">
      <span>{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
