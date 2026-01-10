import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { GuidePanel } from '../GamePlayer/components/GuidePanel';
import type { DialogueTree } from '../../types';
import type { BaseGameState } from '../../types/game-state';
import type { Character } from '../../types/characters';
import type { FlagSchema } from '../../types/flags';
import { NARRATIVE_ELEMENT } from '../../types/narrative';
import type { StoryThread } from '../../types/narrative';
import { getInitialSelection } from './utils/narrative-workspace-utils';
import { useNarrativeWorkspaceState } from './hooks/useNarrativeWorkspaceState';
import { useNarrativeSelection } from './hooks/useNarrativeSelection';
import { useStoryletManagement } from './hooks/useStoryletManagement';
import { useNarrativeActions } from './hooks/useNarrativeActions';
import { NarrativeWorkspaceToolbar } from './components/NarrativeWorkspaceToolbar';
import { NarrativeGraphSection } from './components/NarrativeGraphSection';
import { DialogueGraphSection } from './components/DialogueGraphSection';
import { StoryletsSidebar } from './components/StoryletsSidebar';
import { NarrativeContextMenu } from './components/NarrativeContextMenu';
import { StoryletContextMenu } from './components/StoryletContextMenu';
import { PlayModal } from './components/PlayModal';
import { FlagManagerModal } from './components/FlagManagerModal';
import { StoryletEditorModal } from './components/StoryletEditorModal';
import { PoolEditorModal } from './components/PoolEditorModal';
import {
  ForgeUIStoreProvider,
  createForgeUIStore,
  useForgeUIStore,
} from '@/src/components/forge/store/forge-ui-store';
import type { DialogueForgeEvent } from '@/src/components/forge/events/events';
import { createEvent } from '@/src/components/forge/events/events';

interface NarrativeWorkspaceProps {
  initialThread?: StoryThread;
  initialDialogue?: DialogueTree;
  flagSchema?: FlagSchema;
  characters?: Record<string, Character>;
  gameState?: BaseGameState;
  className?: string;
  toolbarActions?: React.ReactNode;
  onEvent?: (event: DialogueForgeEvent) => void;
  resolveDialogue?: (dialogueId: string) => Promise<DialogueTree>;
}

export function NarrativeWorkspace({
  initialThread,
  initialDialogue,
  flagSchema,
  characters,
  gameState,
  className = '',
  toolbarActions,
  onEvent,
  resolveDialogue,
}: NarrativeWorkspaceProps) {
  const storeRef = useRef<ReturnType<typeof createForgeUIStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createForgeUIStore(getInitialSelection(initialThread));
  }

  return (
    <ForgeUIStoreProvider store={storeRef.current}>
      <NarrativeWorkspaceInner
        initialThread={initialThread}
        initialDialogue={initialDialogue}
        flagSchema={flagSchema}
        characters={characters}
        gameState={gameState}
        className={className}
        toolbarActions={toolbarActions}
        onEvent={onEvent}
      />
    </ForgeUIStoreProvider>
  );
}

function NarrativeWorkspaceInner({
  initialThread,
  initialDialogue,
  flagSchema,
  characters,
  gameState,
  className = '',
  toolbarActions,
  onEvent,
  resolveDialogue,
}: NarrativeWorkspaceProps) {
  const selection = useForgeUIStore(state => state.narrativeGraph.selection);
  const setSelection = useForgeUIStore(state => state.actions.setNarrativeSelection);
  const narrativeContextMenu = useForgeUIStore(state => state.narrativeGraph.contextMenu);
  const setNarrativeContextMenu = useForgeUIStore(state => state.actions.setNarrativeContextMenu);
  const activePoolId = useForgeUIStore(state => state.storylets.activePoolId);
  const setActivePoolId = useForgeUIStore(state => state.actions.setActivePoolId);
  const activeDialogueTab = useForgeUIStore(state => state.dialogueGraph.activeTab);
  const setActiveDialogueTab = useForgeUIStore(state => state.actions.setDialogueTab);
  const pageDialogueId = useForgeUIStore(state => state.dialogueGraph.pageDialogueId);
  const setPageDialogueId = useForgeUIStore(state => state.actions.setPageDialogueId);
  const storyletDialogueId = useForgeUIStore(state => state.dialogueGraph.storyletDialogueId);
  const setStoryletDialogueId = useForgeUIStore(state => state.actions.setStoryletDialogueId);

  const dispatch = useCallback(
    (event: DialogueForgeEvent) => {
      onEvent?.(event);
    },
    [onEvent]
  );

  const workspaceState = useNarrativeWorkspaceState({
    initialThread,
    initialDialogue,
    flagSchema,
    gameState,
  });

  const {
    selectedAct,
    selectedChapter,
    selectedPage,
  } = useNarrativeSelection({
    thread: workspaceState.thread,
    dialogueTree: workspaceState.dialogueTree,
    selection,
    dialogueScope: workspaceState.dialogueScope,
    storyletFocusId: workspaceState.storyletFocusId,
  });

  const dialogueCacheRef = useRef<Map<string, DialogueTree>>(
    initialDialogue 
      ? new Map([[initialDialogue.id, initialDialogue]])
      : new Map()
  );
  const [, forceRerender] = React.useState(0);

  const getCachedDialogue = useCallback((dialogueId: string | null): DialogueTree | null => {
    if (!dialogueId) return null;
    return dialogueCacheRef.current.get(dialogueId) ?? null;
  }, []);

  const ensureDialogue = useCallback(async (dialogueId: string, reason: 'page' | 'storyletTemplate') => {
    if (dialogueCacheRef.current.has(dialogueId)) return;
    if (!resolveDialogue) return;
    dispatch(createEvent('dialogue.openRequested', { dialogueId, reason }));
    const tree = await resolveDialogue(dialogueId);
    dialogueCacheRef.current.set(dialogueId, tree);
    forceRerender(v => v + 1);
  }, [dispatch, resolveDialogue]);

  const storyletManagement = useStoryletManagement({
    selectedChapter,
    selection,
    activePoolId: activePoolId ?? undefined,
    setActivePoolId: next => setActivePoolId(next ?? null),
  });

  const narrativeActions = useNarrativeActions({
    thread: workspaceState.thread,
    setThread: workspaceState.setThread,
    dialogueTree: workspaceState.dialogueTree,
    selectedAct,
    selectedChapter,
    selectedPage,
    activePool: storyletManagement.activePool,
    setSelection,
    setDialogueScope: workspaceState.setDialogueScope,
    setStoryletFocusId: workspaceState.setStoryletFocusId,
    setActivePoolId: (next: string | null | undefined) => setActivePoolId(next ?? null),
    setEditingStoryletId: storyletManagement.setEditingStoryletId,
  });

  const resolvedCharacters = workspaceState.activeGameState.characters ?? characters ?? {};
  const counts = useMemo(() => {
    const actCount = workspaceState.thread.acts.length;
    const chapterCount = workspaceState.thread.acts.reduce((sum, act) => sum + act.chapters.length, 0);
    const pageCount = workspaceState.thread.acts.reduce(
      (sum, act) => sum + act.chapters.reduce((acc, chapter) => acc + chapter.pages.length, 0),
      0
    );
    const characterCount = Object.keys(resolvedCharacters).length;
    return { actCount, chapterCount, pageCount, characterCount };
  }, [resolvedCharacters, workspaceState.thread.acts]);

  const activeEditingDialogueId =
    activeDialogueTab === 'storyletTemplate'
      ? (storyletDialogueId ?? null)
      : (pageDialogueId ?? null);
  const activeEditingDialogue = getCachedDialogue(activeEditingDialogueId);

  const pageDialogueIdEffective = pageDialogueId ?? selectedPage?.dialogueId ?? null;
  const pageDialogue = getCachedDialogue(pageDialogueIdEffective);

  const handleDialogueChange = useCallback((nextDialogue: DialogueTree) => {
    // If there's an active editing dialogue ID, update the cache
    if (activeEditingDialogueId) {
      dialogueCacheRef.current.set(activeEditingDialogueId, nextDialogue);
      forceRerender(v => v + 1);
      dispatch(createEvent('dialogue.changed', { dialogueId: activeEditingDialogueId, dialogue: nextDialogue, reason: 'edit' }));
    } else {
      // If there's no active editing dialogue ID, update the workspace state directly
      // This handles the case when creating nodes in an empty dialogue
      workspaceState.setDialogueTree(nextDialogue);
      // Also dispatch the event so it can be handled by event handlers
      const dialogueId = nextDialogue.id || 'new-dialogue';
      dispatch(createEvent('dialogue.changed', { dialogueId, dialogue: nextDialogue, reason: 'edit' }));
    }
  }, [activeEditingDialogueId, dispatch, workspaceState]);

  const handleNarrativeElementSelect = useCallback((elementType: any, elementId: string) => {
                  if (elementType === NARRATIVE_ELEMENT.ACT) {
      const act = workspaceState.thread.acts.find(item => item.id === elementId);
                    setSelection(prev => ({
                      ...prev,
                      actId: elementId,
                      chapterId: act?.chapters[0]?.id,
                      pageId: act?.chapters[0]?.pages[0]?.id,
                    }));
      workspaceState.setDialogueScope('page');
      workspaceState.setStoryletFocusId(null);
      dispatch(createEvent('narrative.select', { elementType: 'act', elementId }));
                  }
                  if (elementType === NARRATIVE_ELEMENT.CHAPTER) {
      const actForChapter = workspaceState.thread.acts.find(act =>
                      act.chapters.some(item => item.id === elementId)
                    );
                    const chapter = actForChapter?.chapters.find(item => item.id === elementId);
                    setSelection(prev => ({
                      ...prev,
                      actId: actForChapter?.id ?? prev.actId,
                      chapterId: elementId,
                      pageId: chapter?.pages[0]?.id,
                    }));
      workspaceState.setDialogueScope('page');
      workspaceState.setStoryletFocusId(null);
      dispatch(createEvent('narrative.select', { elementType: 'chapter', elementId }));
                  }
                  if (elementType === NARRATIVE_ELEMENT.PAGE) {
      const actForPage = workspaceState.thread.acts.find(act =>
                      act.chapters.some(chapter => chapter.pages.some(page => page.id === elementId))
                    );
                    const chapterForPage = actForPage?.chapters.find(chapter =>
                      chapter.pages.some(page => page.id === elementId)
                    );
                    setSelection(prev => ({
                      ...prev,
                      actId: actForPage?.id ?? prev.actId,
                      chapterId: chapterForPage?.id ?? prev.chapterId,
                      pageId: elementId,
                    }));
      workspaceState.setDialogueScope('page');
      workspaceState.setStoryletFocusId(null);
      dispatch(createEvent('narrative.select', { elementType: 'page', elementId }));
    }
  }, [dispatch, setSelection, workspaceState]);

  const handleStoryletSelect = useCallback((entry: any) => {
                          setSelection(prev => ({ ...prev, storyletKey: `${entry.poolId}:${entry.template.id}` }));
                          setActivePoolId(entry.poolId);
    workspaceState.setDialogueScope('page');
    workspaceState.setStoryletFocusId(null);
  }, [setActivePoolId, setSelection, workspaceState]);

  const handleStoryletEdit = useCallback((entry: any) => {
    storyletManagement.setEditingStoryletId(entry.template.id);
    setActivePoolId(entry.poolId);
  }, [storyletManagement]);

  const handleStoryletContextMenuOpen = useCallback((event: React.MouseEvent, entry: any) => {
                          event.preventDefault();
    storyletManagement.setStoryletContextMenu({
                            x: event.clientX,
                            y: event.clientY,
                            entry,
                          });
  }, [storyletManagement]);

  const handleOpenStoryletTemplate = useCallback((templateId: string) => {
    const template = selectedChapter?.storyletTemplates?.find(item => item.id === templateId);
    if (!template?.dialogueId) return;
    setStoryletDialogueId(template.dialogueId);
    setActiveDialogueTab('storyletTemplate');
    dispatch(createEvent('storyletTemplate.openRequested', { templateId, dialogueId: template.dialogueId }));
    ensureDialogue(template.dialogueId, 'storyletTemplate');
  }, [dispatch, ensureDialogue, selectedChapter?.storyletTemplates, setActiveDialogueTab, setStoryletDialogueId]);

  useEffect(() => {
    if (!selectedPage?.dialogueId) return;
    setPageDialogueId(selectedPage.dialogueId);
    setActiveDialogueTab('page');
    ensureDialogue(selectedPage.dialogueId, 'page');
  }, [ensureDialogue, selectedPage?.dialogueId, setActiveDialogueTab, setPageDialogueId]);

  const playTitle = selectedPage?.title ?? 'Play Page';
  const playSubtitle = selectedPage?.summary ?? 'Preview the dialogue for this page.';

  return (
    <div
      className={`flex h-full w-full flex-col ${className}`}
      onMouseDown={() => {
        setNarrativeContextMenu(null);
        storyletManagement.setStoryletContextMenu(null);
      }}
    >
      <NarrativeWorkspaceToolbar
        onPlayClick={() => workspaceState.setShowPlayModal(true)}
        onFlagClick={() => {
          if (workspaceState.activeFlagSchema) {
            workspaceState.setShowFlagManager(true);
          }
        }}
        onGuideClick={() => workspaceState.setShowGuide(true)}
        counts={counts}
        toolbarActions={toolbarActions}
      />

      <div className="flex min-h-0 flex-1 gap-2 p-2">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <NarrativeGraphSection
            thread={workspaceState.thread}
            dialogueTree={workspaceState.dialogueTree}
            narrativeViewMode={workspaceState.narrativeViewMode}
            showNarrativeMiniMap={workspaceState.showNarrativeMiniMap}
            onViewModeChange={workspaceState.setNarrativeViewMode}
            onToggleMiniMap={() => workspaceState.setShowNarrativeMiniMap(prev => !prev)}
            onPaneContextMenu={event => {
              event.preventDefault();
              setNarrativeContextMenu({
                x: event.clientX,
                y: event.clientY,
              });
            }}
            onPaneClick={() => setNarrativeContextMenu(null)}
            onSelectElement={handleNarrativeElementSelect}
          />

          <DialogueGraphSection
            dialogue={activeEditingDialogue ?? workspaceState.dialogueTree}
            scopedDialogue={activeEditingDialogue ?? workspaceState.dialogueTree}
            selectedPage={selectedPage}
            selectedStoryletEntry={storyletManagement.selectedStoryletEntry}
            activeTab={activeDialogueTab}
            onTabChange={tab => {
              setActiveDialogueTab(tab);
              dispatch(createEvent('ui.tabChanged', { scope: 'dialoguePanel', tab }));
            }}
            storyletTabEnabled={!!storyletDialogueId}
            dialogueViewMode={workspaceState.dialogueViewMode}
            showDialogueMiniMap={workspaceState.showDialogueMiniMap}
            flagSchema={workspaceState.activeFlagSchema}
            characters={resolvedCharacters}
            onDialogueChange={handleDialogueChange}
            onViewModeChange={workspaceState.setDialogueViewMode}
            onToggleMiniMap={() => workspaceState.setShowDialogueMiniMap(prev => !prev)}
          />
      </div>

        <StoryletsSidebar
          storyletTab={storyletManagement.storyletTab}
          storyletSearch={storyletManagement.storyletSearch}
          poolSearch={storyletManagement.poolSearch}
          filteredStoryletEntries={storyletManagement.filteredStoryletEntries}
          filteredPools={storyletManagement.filteredPools}
          selection={selection}
          activePool={storyletManagement.activePool}
          onTabChange={storyletManagement.setStoryletTab}
          onStoryletSearchChange={storyletManagement.setStoryletSearch}
          onPoolSearchChange={storyletManagement.setPoolSearch}
          onAddStorylet={narrativeActions.handleAddStorylet}
          onAddPool={narrativeActions.handleAddStoryletPool}
          onStoryletSelect={handleStoryletSelect}
          onStoryletEdit={handleStoryletEdit}
          onStoryletOpenDialogue={entry => {
            handleStoryletSelect(entry);
            handleOpenStoryletTemplate(entry.template.id);
          }}
          onStoryletContextMenu={handleStoryletContextMenuOpen}
          onPoolSelect={poolId => setActivePoolId(poolId ?? null)}
          onPoolEdit={storyletManagement.setEditingPoolId}
        />
        </div>

      {narrativeContextMenu && (
        <NarrativeContextMenu
          x={narrativeContextMenu.x}
          y={narrativeContextMenu.y}
          onAddAct={narrativeActions.handleAddAct}
          onAddChapter={narrativeActions.handleAddChapter}
          onAddPage={narrativeActions.handleAddPage}
          canAddChapter={!!selectedAct}
          canAddPage={!!selectedChapter}
          onClose={() => setNarrativeContextMenu(null)}
        />
      )}

      {storyletManagement.storyletContextMenu && (
        <StoryletContextMenu
          x={storyletManagement.storyletContextMenu.x}
          y={storyletManagement.storyletContextMenu.y}
          entry={storyletManagement.storyletContextMenu.entry}
          onLoadDialogue={() => {
              setSelection(prev => ({
                ...prev,
              storyletKey: `${storyletManagement.storyletContextMenu!.entry.poolId}:${storyletManagement.storyletContextMenu!.entry.template.id}`,
            }));
            handleOpenStoryletTemplate(storyletManagement.storyletContextMenu!.entry.template.id);
            storyletManagement.setStoryletContextMenu(null);
          }}
          onEditMetadata={() => {
            storyletManagement.setEditingStoryletId(storyletManagement.storyletContextMenu!.entry.template.id);
            storyletManagement.setStoryletContextMenu(null);
          }}
          onClose={() => storyletManagement.setStoryletContextMenu(null)}
        />
      )}

      <PlayModal
        isOpen={workspaceState.showPlayModal}
        onClose={() => workspaceState.setShowPlayModal(false)}
        dialogue={pageDialogue ?? workspaceState.dialogueTree}
        flagSchema={workspaceState.activeFlagSchema}
        gameStateFlags={workspaceState.activeGameState?.flags}
        narrativeThread={workspaceState.thread}
        title={playTitle}
        subtitle={playSubtitle}
      />

      {workspaceState.showFlagManager && workspaceState.activeFlagSchema && (
        <FlagManagerModal
          isOpen={workspaceState.showFlagManager}
          onClose={() => workspaceState.setShowFlagManager(false)}
          flagSchema={workspaceState.activeFlagSchema}
          dialogue={pageDialogue ?? workspaceState.dialogueTree}
          activeGameState={workspaceState.activeGameState}
          resolvedCharacters={resolvedCharacters}
          onUpdateFlagSchema={workspaceState.setActiveFlagSchema}
          onUpdateGameState={workspaceState.setActiveGameState}
        />
      )}

      <GuidePanel isOpen={workspaceState.showGuide} onClose={() => workspaceState.setShowGuide(false)} />

      {storyletManagement.editingStoryletEntry && (
        <StoryletEditorModal
          isOpen={!!storyletManagement.editingStoryletEntry}
          entry={storyletManagement.editingStoryletEntry}
          onClose={() => storyletManagement.setEditingStoryletId(null)}
          onUpdateTemplate={narrativeActions.handleStoryletTemplateUpdate}
          onUpdateMember={narrativeActions.handleStoryletMemberUpdate}
        />
      )}

      {storyletManagement.editingPool && (
        <PoolEditorModal
          isOpen={!!storyletManagement.editingPool}
          pool={storyletManagement.editingPool}
          onClose={() => storyletManagement.setEditingPoolId(null)}
          onUpdate={(poolId, updates) => {
            narrativeActions.handleStoryletPoolUpdate(poolId, updates);
            if (updates.id && updates.id !== poolId) {
              if (activePoolId === poolId) {
                setActivePoolId(updates.id);
              }
              if (storyletManagement.editingPoolId === poolId) {
                storyletManagement.setEditingPoolId(updates.id);
              }
            }
          }}
        />
      )}
    </div>
  );
}

// Export as DialogueForge for public API
export { NarrativeWorkspace as DialogueForge };
