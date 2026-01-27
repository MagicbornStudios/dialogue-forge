import type { JSX } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { TreeView } from '@lexical/react/LexicalTreeView';

export function NodesView(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  
  return (
    <div className="w-full h-full overflow-auto bg-df-surface">
      <TreeView
        viewClassName="tree-view-output text-df-text-primary"
        treeTypeButtonClassName="debug-treetype-button bg-df-control-hover text-df-text-primary hover:bg-df-control-active border border-df-control-border rounded px-2 py-1 text-xs"
        timeTravelPanelClassName="debug-timetravel-panel bg-df-surface border border-df-control-border"
        timeTravelButtonClassName="debug-timetravel-button bg-df-control-hover text-df-text-primary hover:bg-df-control-active border border-df-control-border rounded px-2 py-1 text-xs"
        timeTravelPanelSliderClassName="debug-timetravel-panel-slider"
        timeTravelPanelButtonClassName="debug-timetravel-panel-button bg-df-control-hover text-df-text-primary hover:bg-df-control-active border border-df-control-border rounded px-2 py-1 text-xs"
        editor={editor}
      />
    </div>
  );
}
