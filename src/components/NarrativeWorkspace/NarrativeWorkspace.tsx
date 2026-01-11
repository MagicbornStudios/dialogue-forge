import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { GuidePanel } from '../shared/GuidePanel';
import type { DialogueTree } from '../../types';
import type { BaseGameState } from '../../types/game-state';
import type { Character } from '../../types/characters';
import type { FlagSchema } from '../../types/flags';
import { NARRATIVE_ELEMENT } from '../../types/narrative';
import type { StoryThread } from '../../types/narrative';
import { getInitialSelection } from './utils/narrative-workspace-utils';
import { useNarrativeSelection } from './hooks/useNarrativeSelection';
import { useStoryletManagement } from './hooks/useStoryletManagement';
import { useNarrativeActions } from './hooks/useNarrativeActions';
import { NarrativeWorkspaceToolbar } from './components/NarrativeWorkspaceToolbar';
import { NarrativeGraphSection } from './components/NarrativeGraphSection';
import { DialogueGraphSection } from './components/DialogueGraphSection';
import { StoryletsSidebar } from './components/StoryletsSidebar';
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
import {
  NarrativeWorkspaceStoreProvider,
  createNarrativeWorkspaceStore,
  useNarrativeWorkspaceStore,
  type EventSink,
} from './store/narrative-workspace-store';
import { setupNarrativeWorkspaceSubscriptions } from './store/subscriptions';
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
  const uiStoreRef = useRef<ReturnType<typeof createForgeUIStore> | null>(null);
  const domainStoreRef = useRef<ReturnType<typeof createNarrativeWorkspaceStore> | null>(null);
  
  if (!uiStoreRef.current) {
    uiStoreRef.current = createForgeUIStore(getInitialSelection(initialThread));
  }

  if (!domainStoreRef.current) {
    const eventSink: EventSink = {
      emit: (event) => onEvent?.(event),
    };
    domainStoreRef.current = createNarrativeWorkspaceStore(
      {
        initialThread,
        initialDialogue,
        flagSchema,
        gameState,
        resolveDialogue,
      },
      eventSink
    );

    // Setup subscriptions for side-effect events
    setupNarrativeWorkspaceSubscriptions(domainStoreRef.current, uiStoreRef.current, eventSink);
  }

  return (
    <ForgeUIStoreProvider store={uiStoreRef.current}>
      <NarrativeWorkspaceStoreProvider store={domainStoreRef.current}>
        <NarrativeWorkspaceInner
          initialThread={initialThread}
          initialDialogue={initialDialogue}
          flagSchema={flagSchema}
          characters={characters}
          gameState={gameState}
          className={className}
          toolbarActions={toolbarActions}
          onEvent={onEvent}
          resolveDialogue={resolveDialogue}
        />
      </NarrativeWorkspaceStoreProvider>
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
  // Context menu is now handled internally by NarrativeGraphEditor
  const activePoolId = useForgeUIStore(state => state.storylets.activePoolId);
  const setActivePoolId = useForgeUIStore(state => state.actions.setActivePoolId);
  const activeDialogueTab = useForgeUIStore(state => state.dialogueGraph.activeTab);
  const setActiveDialogueTab = useForgeUIStore(state => state.actions.setDialogueTab);
  const pageDialogueId = useForgeUIStore(state => state.dialogueGraph.pageDialogueId);
  const setPageDialogueId = useForgeUIStore(state => state.actions.setPageDialogueId);
  const storyletDialogueId = useForgeUIStore(state => state.dialogueGraph.storyletDialogueId);
  const setStoryletDialogueId = useForgeUIStore(state => state.actions.setStoryletDialogueId);

  // Get state from domain store
  const thread = useNarrativeWorkspaceStore(state => state.thread);
  const activeFlagSchema = useNarrativeWorkspaceStore(state => state.activeFlagSchema);
  const activeGameState = useNarrativeWorkspaceStore(state => state.activeGameState);
  const dialogueScope = useNarrativeWorkspaceStore(state => state.dialogueScope);
  const storyletFocusId = useNarrativeWorkspaceStore(state => state.storyletFocusId);
  const setThread = useNarrativeWorkspaceStore(state => state.actions.setThread);
  const setDialogue = useNarrativeWorkspaceStore(state => state.actions.setDialogue);
  const setDialogueScope = useNarrativeWorkspaceStore(state => state.actions.setDialogueScope);
  const setStoryletFocusId = useNarrativeWorkspaceStore(state => state.actions.setStoryletFocusId);
  const setActiveFlagSchema = useNarrativeWorkspaceStore(state => state.actions.setActiveFlagSchema);
  const setActiveGameState = useNarrativeWorkspaceStore(state => state.actions.setActiveGameState);
  const setShowPlayModal = useForgeUIStore(state => state.actions.setShowPlayModal);
  const setShowFlagManager = useForgeUIStore(state => state.actions.setShowFlagManager);
  const setShowGuide = useForgeUIStore(state => state.actions.setShowGuide);
  const narrativeViewMode = useForgeUIStore(state => state.narrativeGraph.viewMode);
  const setNarrativeViewMode = useForgeUIStore(state => state.actions.setNarrativeViewMode);
  const showNarrativeMiniMap = useForgeUIStore(state => state.narrativeGraph.showMiniMap);
  const dialogueViewMode = useForgeUIStore(state => state.dialogueGraph.viewMode);
  const setDialogueViewMode = useForgeUIStore(state => state.actions.setDialogueViewMode);
  const showDialogueMiniMap = useForgeUIStore(state => state.dialogueGraph.showMiniMap);
  const toggleNarrativeMiniMap = useForgeUIStore(state => state.actions.toggleNarrativeMiniMap);
  const toggleDialogueMiniMap = useForgeUIStore(state => state.actions.toggleDialogueMiniMap);
  const showPlayModal = useForgeUIStore(state => state.modals.showPlayModal);
  const showFlagManager = useForgeUIStore(state => state.modals.showFlagManager);
  const showGuide = useForgeUIStore(state => state.modals.showGuide);

  const {
    selectedAct,
    selectedChapter,
    selectedPage,
  } = useNarrativeSelection({
    thread,
    dialogueTree: undefined, // We'll get dialogue from store by ID
    selection,
    dialogueScope,
    storyletFocusId,
  });

  const storyletManagement = useStoryletManagement({
    selectedChapter,
    selection,
    activePoolId: activePoolId ?? undefined,
    setActivePoolId: next => setActivePoolId(next ?? null),
  });

  // Get dialogue from domain store
  const activeEditingDialogueId =
    activeDialogueTab === 'storyletTemplate'
      ? (storyletDialogueId ?? null)
      : (pageDialogueId ?? null);
  const activeEditingDialogue = useNarrativeWorkspaceStore(state => 
    activeEditingDialogueId 
      ? state.dialogue.byId[activeEditingDialogueId] ?? null
      : null
  );

  const pageDialogueIdEffective = pageDialogueId ?? selectedPage?.dialogueId ?? null;
  const pageDialogue = useNarrativeWorkspaceStore(state => 
    pageDialogueIdEffective 
      ? state.dialogue.byId[pageDialogueIdEffective] ?? null
      : null
  );

  // Get default dialogue tree for fallback
  const defaultDialogueTree = useNarrativeWorkspaceStore(state => {
    const firstDialogueId = Object.keys(state.dialogue.byId)[0];
    return firstDialogueId ? state.dialogue.byId[firstDialogueId] : null;
  });

  const narrativeActions = useNarrativeActions({
    thread,
    setThread,
    dialogueTree: defaultDialogueTree ?? { id: 'empty', title: 'Empty', startNodeId: '', nodes: {} },
    selectedAct,
    selectedChapter,
    selectedPage,
    activePool: storyletManagement.activePool,
    setSelection,
    setDialogueScope,
    setStoryletFocusId,
    setActivePoolId: (next: string | null | undefined) => setActivePoolId(next ?? null),
    setEditingStoryletId: storyletManagement.setEditingStoryletId,
  });

  const resolvedCharacters = activeGameState.characters ?? characters ?? {};
  const counts = useMemo(() => {
    const actCount = thread.acts.length;
    const chapterCount = thread.acts.reduce((sum, act) => sum + act.chapters.length, 0);
    const pageCount = thread.acts.reduce(
      (sum, act) => sum + act.chapters.reduce((acc, chapter) => acc + chapter.pages.length, 0),
      0
    );
    const characterCount = Object.keys(resolvedCharacters).length;
    return { actCount, chapterCount, pageCount, characterCount };
  }, [resolvedCharacters, thread.acts]);

  const handleDialogueChange = useCallback((nextDialogue: DialogueTree) => {
    // If there's an active editing dialogue ID, update the store
    if (activeEditingDialogueId) {
      setDialogue(activeEditingDialogueId, nextDialogue);
      // Event is emitted automatically in setDialogue action
    } else {
      // If there's no active editing dialogue ID, create a new entry
      const dialogueId = nextDialogue.id || 'new-dialogue';
      setDialogue(dialogueId, nextDialogue);
      // Event is emitted automatically in setDialogue action
    }
  }, [activeEditingDialogueId, setDialogue]);

  const handleNarrativeElementSelect = useCallback((elementType: any, elementId: string) => {
    if (elementType === NARRATIVE_ELEMENT.ACT) {
      const act = thread.acts.find(item => item.id === elementId);
      setSelection(prev => ({
        ...prev,
        actId: elementId,
        chapterId: act?.chapters[0]?.id,
        pageId: act?.chapters[0]?.pages[0]?.id,
      }));
      setDialogueScope('page');
      setStoryletFocusId(null);
      onEvent?.(createEvent('narrative.select', { elementType: 'act', elementId }));
    }
    if (elementType === NARRATIVE_ELEMENT.CHAPTER) {
      const actForChapter = thread.acts.find(act =>
        act.chapters.some(item => item.id === elementId)
      );
      const chapter = actForChapter?.chapters.find(item => item.id === elementId);
      setSelection(prev => ({
        ...prev,
        actId: actForChapter?.id ?? prev.actId,
        chapterId: elementId,
        pageId: chapter?.pages[0]?.id,
      }));
      setDialogueScope('page');
      setStoryletFocusId(null);
      onEvent?.(createEvent('narrative.select', { elementType: 'chapter', elementId }));
    }
    if (elementType === NARRATIVE_ELEMENT.PAGE) {
      const actForPage = thread.acts.find(act =>
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
      setDialogueScope('page');
      setStoryletFocusId(null);
      onEvent?.(createEvent('narrative.select', { elementType: 'page', elementId }));
    }
  }, [onEvent, setSelection, thread, setDialogueScope, setStoryletFocusId]);

  const handleStoryletSelect = useCallback((entry: any) => {
    setSelection(prev => ({ ...prev, storyletKey: `${entry.poolId}:${entry.template.id}` }));
    setActivePoolId(entry.poolId);
    setDialogueScope('page');
    setStoryletFocusId(null);
  }, [setActivePoolId, setSelection, setDialogueScope, setStoryletFocusId]);

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
    onEvent?.(createEvent('storyletTemplate.openRequested', { templateId, dialogueId: template.dialogueId }));
    // Dialogue loading is handled by subscription
  }, [onEvent, selectedChapter?.storyletTemplates, setActiveDialogueTab, setStoryletDialogueId]);

  useEffect(() => {
    if (!selectedPage?.dialogueId) return;
    setPageDialogueId(selectedPage.dialogueId);
    setActiveDialogueTab('page');
    // Dialogue loading is handled by subscription
  }, [selectedPage?.dialogueId, setActiveDialogueTab, setPageDialogueId]);

  const playTitle = selectedPage?.title ?? 'Play Page';
  const playSubtitle = selectedPage?.summary ?? 'Preview the dialogue for this page.';

  return (
    <div
      className={`flex h-full w-full flex-col ${className}`}
      onMouseDown={() => {
        // Context menu is handled internally by NarrativeGraphEditor
        storyletManagement.setStoryletContextMenu(null);
      }}
    >
      <NarrativeWorkspaceToolbar
        onPlayClick={() => setShowPlayModal(true)}
        onFlagClick={() => {
          if (activeFlagSchema) {
            setShowFlagManager(true);
          }
        }}
        onGuideClick={() => setShowGuide(true)}
        counts={counts}
        toolbarActions={toolbarActions}
      />

      <div className="flex min-h-0 flex-1 gap-2 p-2">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <NarrativeGraphSection
            thread={thread}
            dialogueTree={defaultDialogueTree ?? { id: 'empty', title: 'Empty', startNodeId: '', nodes: {} }}
            narrativeViewMode={narrativeViewMode}
            showNarrativeMiniMap={showNarrativeMiniMap}
            onViewModeChange={setNarrativeViewMode}
            onToggleMiniMap={toggleNarrativeMiniMap}
            onPaneContextMenu={event => {
              // Context menu is handled internally by NarrativeGraphEditor
              event.preventDefault();
            }}
            onPaneClick={() => {
              // Context menu is handled internally by NarrativeGraphEditor
            }}
            onSelectElement={handleNarrativeElementSelect}
            onThreadChange={setThread}
          />

          <DialogueGraphSection
            dialogue={activeEditingDialogue ?? defaultDialogueTree ?? { id: 'empty', title: 'Empty', startNodeId: '', nodes: {} }}
            scopedDialogue={activeEditingDialogue ?? defaultDialogueTree ?? { id: 'empty', title: 'Empty', startNodeId: '', nodes: {} }}
            selectedPage={selectedPage}
            selectedStoryletEntry={storyletManagement.selectedStoryletEntry}
            activeTab={activeDialogueTab}
            onTabChange={tab => {
              setActiveDialogueTab(tab);
              onEvent?.(createEvent('ui.tabChanged', { scope: 'dialoguePanel', tab }));
            }}
            storyletTabEnabled={!!storyletDialogueId}
            dialogueViewMode={dialogueViewMode}
            showDialogueMiniMap={showDialogueMiniMap}
            flagSchema={activeFlagSchema}
            characters={resolvedCharacters}
            onDialogueChange={handleDialogueChange}
            onViewModeChange={setDialogueViewMode}
            onToggleMiniMap={toggleDialogueMiniMap}
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

      {/* Context menu is now handled internally by NarrativeGraphEditor */}

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
        isOpen={showPlayModal}
        onClose={() => setShowPlayModal(false)}
        dialogue={pageDialogue ?? defaultDialogueTree ?? { id: 'empty', title: 'Empty', startNodeId: '', nodes: {} }}
        flagSchema={activeFlagSchema}
        gameStateFlags={activeGameState?.flags}
        narrativeThread={thread}
        title={playTitle}
        subtitle={playSubtitle}
      />

      {showFlagManager && activeFlagSchema && (
        <FlagManagerModal
          isOpen={showFlagManager}
          onClose={() => setShowFlagManager(false)}
          flagSchema={activeFlagSchema}
          dialogue={pageDialogue ?? defaultDialogueTree ?? { id: 'empty', title: 'Empty', startNodeId: '', nodes: {} }}
          activeGameState={activeGameState}
          resolvedCharacters={resolvedCharacters}
          onUpdateFlagSchema={setActiveFlagSchema}
          onUpdateGameState={setActiveGameState}
        />
      )}

      <GuidePanel isOpen={showGuide} onClose={() => setShowGuide(false)} />

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
