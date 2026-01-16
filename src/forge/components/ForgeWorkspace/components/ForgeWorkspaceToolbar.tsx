import React from 'react';
import { Flag, HelpCircle, Play, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useForgeWorkspaceStore } from '../store/forge-workspace-store';

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
  const panelLayout = useForgeWorkspaceStore((s) => s.panelLayout);
  const togglePanel = useForgeWorkspaceStore((s) => s.actions.togglePanel);

  return (
    <div className="flex items-center justify-between border-b border-border bg-background/80 px-3 py-2">
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
        <div className="h-4 w-px bg-border mx-1" />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => togglePanel('sidebar')}
          title={panelLayout.sidebar.visible ? 'Hide sidebar' : 'Show sidebar'}
        >
          {panelLayout.sidebar.visible ? <Eye size={16} /> : <EyeOff size={16} />}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => togglePanel('narrativeEditor')}
          title={panelLayout.narrativeEditor.visible ? 'Hide narrative editor' : 'Show narrative editor'}
        >
          {panelLayout.narrativeEditor.visible ? <Eye size={16} /> : <EyeOff size={16} />}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => togglePanel('storyletEditor')}
          title={panelLayout.storyletEditor.visible ? 'Hide storylet editor' : 'Show storylet editor'}
        >
          {panelLayout.storyletEditor.visible ? <Eye size={16} /> : <EyeOff size={16} />}
        </Button>
      </div>
      <div className="text-[11px] text-muted-foreground">
        {counts.actCount} acts · {counts.chapterCount} chapters · {counts.pageCount} pages · {counts.characterCount} characters
      </div>
      <div className="flex items-center gap-2">{toolbarActions}</div>
    </div>
  );
}
