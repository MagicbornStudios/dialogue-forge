import React from 'react';
import { Flag, HelpCircle, Play } from 'lucide-react';
import { Button } from '@/src/components/ui/button';

interface ForgeWorkspaceToolbarProps {
  onPlayClick: () => void;
  onFlagClick: () => void;
  onGuideClick: () => void;
  counts: {
    actCount: number;
    chapterCount: number;
    pageCount: number;
    characterCount: number;
  };
  toolbarActions?: React.ReactNode;
}

export function ForgeWorkspaceToolbar({
  onPlayClick,
  onFlagClick,
  onGuideClick,
  counts,
  toolbarActions,
}: ForgeWorkspaceToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b border-df-sidebar-border bg-df-base/80 px-3 py-2">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="icon" onClick={onPlayClick} title="Play selected page">
          <Play size={16} />
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={onFlagClick} title="Game state">
          <Flag size={16} />
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={onGuideClick} title="Open guide">
          <HelpCircle size={16} />
        </Button>
      </div>
      <div className="text-[11px] text-df-text-tertiary">
        {counts.actCount} acts · {counts.chapterCount} chapters · {counts.pageCount} pages · {counts.characterCount} characters
      </div>
      <div className="flex items-center gap-2">{toolbarActions}</div>
    </div>
  );
}
