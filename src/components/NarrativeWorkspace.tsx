import React, { useCallback, useMemo, useState } from 'react';
import { GuidePanel } from './GuidePanel';
import type { DialogueTree } from '../types';
import type { BaseGameState } from '../types/game-state';
import type { Character } from '../types/characters';
import type { FlagSchema } from '../types/flags';
import { NARRATIVE_ELEMENT } from '../types/narrative';
import type { StoryThread } from '../types/narrative';
import type { NarrativeSelection } from './NarrativeEditor';
import { getInitialSelection } from './NarrativeWorkspace/utils/narrative-workspace-utils';
import { useNarrativeWorkspaceState } from './NarrativeWorkspace/hooks/useNarrativeWorkspaceState';
import { useNarrativeSelection } from './NarrativeWorkspace/hooks/useNarrativeSelection';
import { useStoryletManagement } from './NarrativeWorkspace/hooks/useStoryletManagement';
import { useNarrativeActions } from './NarrativeWorkspace/hooks/useNarrativeActions';
import { NarrativeWorkspaceToolbar } from './NarrativeWorkspace/components/NarrativeWorkspaceToolbar';
import { NarrativeGraphSection } from './NarrativeWorkspace/components/NarrativeGraphSection';
import { DialogueGraphSection } from './NarrativeWorkspace/components/DialogueGraphSection';
import { StoryletsSidebar } from './NarrativeWorkspace/components/StoryletsSidebar';
import { NarrativeContextMenu } from './NarrativeWorkspace/components/NarrativeContextMenu';
import { StoryletContextMenu } from './NarrativeWorkspace/components/StoryletContextMenu';
import { PlayModal } from './NarrativeWorkspace/components/PlayModal';
import { FlagManagerModal } from './NarrativeWorkspace/components/FlagManagerModal';
import { StoryletEditorModal } from './NarrativeWorkspace/components/StoryletEditorModal';
import { PoolEditorModal } from './NarrativeWorkspace/components/PoolEditorModal';

interface NarrativeWorkspaceProps {
  initialThread: StoryThread;
  initialDialogue: DialogueTree;
  flagSchema?: FlagSchema;
  characters?: Record<string, Character>;
  gameState?: BaseGameState;
  className?: string;
  toolbarActions?: React.ReactNode;
}

export function NarrativeWorkspace({
  initialThread,
  initialDialogue,
  flagSchema,
  characters,
  gameState,
  className = '',
  toolbarActions,
}: NarrativeWorkspaceProps) {
  const [selection, setSelection] = useState<NarrativeSelection>(() => getInitialSelection(initialThread));
  const [narrativeContextMenu, setNarrativeContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [activePoolId, setActivePoolId] = useState<string | undefined>(undefined);

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
    scopedDialogue,
  } = useNarrativeSelection({
    thread: workspaceState.thread,
    dialogueTree: workspaceState.dialogueTree,
    selection,
    dialogueScope: workspaceState.dialogueScope,
    storyletFocusId: workspaceState.storyletFocusId,
  });

  const storyletManagement = useStoryletManagement({
    selectedChapter,
    selection,
    activePoolId,
    setActivePoolId,
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
    setActivePoolId,
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

  const handleDialogueChange = useCallback((nextScopedDialogue: DialogueTree) => {
    workspaceState.setDialogueTree(nextScopedDialogue);
  }, [workspaceState]);

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
    }
  }, [workspaceState]);

  const handleStoryletSelect = useCallback((entry: any) => {
    setSelection(prev => ({ ...prev, storyletKey: `${entry.poolId}:${entry.template.id}` }));
    setActivePoolId(entry.poolId);
    workspaceState.setDialogueScope('page');
    workspaceState.setStoryletFocusId(null);
  }, [workspaceState]);

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
    narrativeActions.handleOpenStoryletTemplate(templateId);
  }, [narrativeActions]);

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
            dialogue={workspaceState.dialogueTree}
            scopedDialogue={scopedDialogue}
            selectedPage={selectedPage}
            selectedStoryletEntry={storyletManagement.selectedStoryletEntry}
            dialogueScope={workspaceState.dialogueScope}
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
          onStoryletContextMenu={handleStoryletContextMenuOpen}
          onPoolSelect={setActivePoolId}
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
        dialogue={scopedDialogue}
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
          dialogue={workspaceState.dialogueTree}
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
