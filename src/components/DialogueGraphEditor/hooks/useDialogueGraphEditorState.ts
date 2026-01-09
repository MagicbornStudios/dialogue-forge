import { useState, useRef } from 'react';
import { ViewMode } from '../../../types';
import { VIEW_MODE } from '../../../types/constants';
import { LayoutDirection } from '../../../utils/layout';

export function useDialogueGraphEditorState(
  initialViewMode: ViewMode = VIEW_MODE.GRAPH,
  controlledViewMode?: ViewMode,
  onViewModeChange?: (mode: ViewMode) => void
) {
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>(initialViewMode);
  const viewMode = controlledViewMode ?? internalViewMode;
  
  const setViewMode = (mode: ViewMode) => {
    if (controlledViewMode === undefined) {
      setInternalViewMode(mode);
    }
    onViewModeChange?.(mode);
  };

  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>('TB');
  const [autoOrganize, setAutoOrganize] = useState<boolean>(false);
  const [showPathHighlight, setShowPathHighlight] = useState<boolean>(true);
  const [showBackEdges, setShowBackEdges] = useState<boolean>(true);
  const [showLayoutMenu, setShowLayoutMenu] = useState<boolean>(false);
  const directUpdateRef = useRef<string | null>(null);
  const lastWheelClickRef = useRef<number>(0);

  return {
    viewMode,
    setViewMode,
    layoutDirection,
    setLayoutDirection,
    autoOrganize,
    setAutoOrganize,
    showPathHighlight,
    setShowPathHighlight,
    showBackEdges,
    setShowBackEdges,
    showLayoutMenu,
    setShowLayoutMenu,
    directUpdateRef,
    lastWheelClickRef,
  };
}
