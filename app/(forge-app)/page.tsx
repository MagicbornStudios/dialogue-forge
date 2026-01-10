'use client';

import { NarrativeWorkspace as DialogueForge } from '@magicborn/dialogue-forge/src/components/NarrativeWorkspace/NarrativeWorkspace';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { ProjectSwitcher } from '@/components/ProjectSwitcher';
import { useForgeEventHandlersWithDefaults } from '@/app/lib/forge-event-handlers';
import { 
  useWorkspaceData, 
  useThreadWithAllData,
  useThreads,
  useDialogues,
  useFlagSchemas,
  useGameStates,
} from '@/app/lib/forge/queries';
import {
  prepareThreadData,
  prepareDialogueData,
  prepareFlagSchemaData,
  prepareCharactersData,
  prepareGameStateData,
} from '@/app/lib/forge/transformers';
import { useMemo, useState, useEffect } from 'react';
import type { DialogueTree, StoryThread } from '@magicborn/dialogue-forge/src/types';
import { NODE_TYPE } from '@magicborn/dialogue-forge/src/types/constants';
import { exampleFlagSchema } from '@magicborn/dialogue-forge/src/types/flags';

// Tell Next.js this page is static (no dynamic params/searchParams)
export const dynamic = 'force-static';

// Dummy fallback data for development when queries fail
const createFallbackDialogue = (): DialogueTree => ({
  id: 'fallback-dialogue',
  title: 'Fallback Dialogue',
  startNodeId: 'node-1',
  nodes: {
    'node-1': {
      id: 'node-1',
      type: NODE_TYPE.NPC,
      content: 'Hello! This is fallback data. There was an error loading data from PayloadCMS.',
      nextNodeId: 'node-2',
      x: 0,
      y: 0,
    },
    'node-2': {
      id: 'node-2',
      type: NODE_TYPE.PLAYER,
      content: '',
      choices: [
        {
          id: 'choice-1',
          text: 'Continue',
          nextNodeId: undefined,
        },
      ],
      x: 0,
      y: 150,
    },
  },
});

const createFallbackThread = (): StoryThread => ({
  id: 'fallback-thread',
  title: 'Fallback Thread',
  summary: 'Fallback thread data used when PayloadCMS queries fail',
  acts: [
    {
      id: 'fallback-act',
      title: 'Fallback Act',
      summary: 'Fallback act',
      chapters: [
        {
          id: 'fallback-chapter',
          title: 'Fallback Chapter',
          summary: 'Fallback chapter',
          pages: [
            {
              id: 'fallback-page',
              title: 'Fallback Page',
              summary: 'Fallback page',
              dialogueId: 'fallback-dialogue',
            },
          ],
        },
      ],
    },
  ],
});

export default function DialogueForgeApp() {
  // State for selected project
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  
  // Query first thread for project
  // const threadsQuery = useThreads(selectedProjectId || undefined)
  // const threadId = useMemo(() => threadsQuery.data?.[0]?.id || null, [threadsQuery.data])
  
  // Query first dialogue for project
  // const dialoguesQuery = useDialogues(selectedProjectId || undefined)
  // const dialogueId = useMemo(() => dialoguesQuery.data?.[0]?.id || null, [dialoguesQuery.data])
  
  // Query first flag schema for project
  // const flagSchemasQuery = useFlagSchemas(selectedProjectId || undefined)
  // const flagSchemaId = useMemo(() => flagSchemasQuery.data?.[0]?.id || null, [flagSchemasQuery.data])
  
  // Query authored game state for thread
  // const gameStatesQuery = useGameStates(
  //   threadId ? { threadId, type: 'AUTHORED' } : undefined
  // )
  // const gameStateId = useMemo(() => gameStatesQuery.data?.[0]?.id || null, [gameStatesQuery.data])
  
  // // Query all workspace data from PayloadCMS using extracted IDs
  // const workspaceData = useWorkspaceData(threadId, dialogueId, flagSchemaId, gameStateId)
  
  // // Get thread with all nested data
  // const threadData = useThreadWithAllData(threadId)
  
  // // Prepare/transform PayloadCMS data for forge component
  // const preparedData = useMemo(() => {
  //   if (workspaceData.isLoading || threadData?.isLoading) {
  //     return null
  //   }
    
    // Prepare thread data with nested structure
  //   const preparedThread = threadData?.thread && threadData.acts && threadData.chapters && threadData.pages
  //     ? prepareThreadData(
  //         threadData.thread,
  //         threadData.acts,
  //         threadData.chapters,
  //         threadData.pages,
  //         threadData.storyletTemplates,
  //         threadData.storyletPools
  //       )
  //     : null
    
  //   // Prepare dialogue data
  //   const preparedDialogue = workspaceData.dialogue
  //     ? prepareDialogueData(workspaceData.dialogue)
  //     : null
    
  //   // Prepare flag schema data
  //   const preparedFlagSchema = workspaceData.flagSchema
  //     ? prepareFlagSchemaData(workspaceData.flagSchema)
  //     : null
    
  //   // Prepare characters data
  //   const preparedCharacters = workspaceData.characters.length > 0
  //     ? prepareCharactersData(workspaceData.characters)
  //     : {}
    
  //   // Prepare game state data with characters
  //   const preparedGameState = workspaceData.gameState && workspaceData.characters.length > 0
  //     ? prepareGameStateData(workspaceData.gameState, workspaceData.characters)
  //     : undefined
    
  //   return {
  //     thread: preparedThread,
  //     dialogue: preparedDialogue,
  //     flagSchema: preparedFlagSchema,
  //     characters: preparedCharacters,
  //     gameState: preparedGameState,
  //   }
  // }, [workspaceData, threadData])
  
  // Log prepared data for verification (remove in production)
  // useEffect(() => {
  //   if (preparedData) {
  //     console.log('Prepared workspace data from PayloadCMS:', preparedData)
  //     console.log('Workspace data loading state:', workspaceData.isLoading)
  //     console.log('Workspace data error:', workspaceData.error)
  //   }
  // }, [preparedData, workspaceData.isLoading, workspaceData.error])
  
  // Check if we have required data
  // Check loading states from all queries (initial ID queries + workspace data queries)
  // const isLoading = 
  //   threadsQuery.isLoading ||
  //   dialoguesQuery.isLoading ||
  //   flagSchemasQuery.isLoading ||
  //   gameStatesQuery.isLoading ||
  //   workspaceData.isLoading ||
  //   threadData?.isLoading;
  
  // const hasError = 
  //   threadsQuery.isError ||
  //   dialoguesQuery.isError ||
  //   flagSchemasQuery.isError ||
  //   gameStatesQuery.isError ||
  //   workspaceData.isError ||
  //   threadData?.isError;
  
  // const hasRequiredData = preparedData?.dialogue && preparedData?.thread;

  // Set up event handlers with PayloadCMS integration
  // const onEvent = useForgeEventHandlersWithDefaults({
  //   dialogueOptions: {
  //     changed: {
  //       debounceMs: 500,
  //       onSaved: (dialogue) => {
  //         console.log('Dialogue saved:', dialogue.id);
  //       },
  //       onError: (error) => {
  //         console.error('Failed to save dialogue:', error);
  //       },
  //     },
  //     openRequested: {
  //       onError: (error) => {
  //         console.error('Failed to open dialogue:', error);
  //       },
  //     },
  //   },
  //   storyletOptions: {
  //     openRequested: {
  //       onError: (error) => {
  //         console.error('Failed to open storylet template:', error);
  //       },
  //     },
  //   },
  //   overrides: {
  //     // You can override specific handlers here if needed
  //   },
  // });

  // // Show loading state
  // if (isLoading) {
  //   return (
  //     <div className="w-full h-screen flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
  //         <div className="text-lg font-semibold mb-2">Loading workspace data...</div>
  //         <div className="text-sm text-muted-foreground">Fetching data from PayloadCMS</div>
  //       </div>
  //     </div>
  //   );
  // }

  // // Get fallback dummy data
  // const fallbackDialogue = useMemo(() => createFallbackDialogue(), []);
  // const fallbackThread = useMemo(() => createFallbackThread(), []);

  // // Determine which data to use (real data or fallback)
  // const finalDialogue = preparedData?.dialogue || fallbackDialogue;
  // const finalThread = preparedData?.thread || fallbackThread;
  // const finalFlagSchema = preparedData?.flagSchema || exampleFlagSchema;
  // const finalCharacters = preparedData?.characters && Object.keys(preparedData.characters).length > 0 
  //   ? preparedData.characters 
  //   : undefined;
  // const finalGameState = preparedData?.gameState;

  // // Show message if required data is missing (but still render with fallback)
  // const shouldShowDataWarning = !hasRequiredData && !hasError;

  // Render component with real PayloadCMS data or fallback dummy data
  return (
    <div className="w-full h-screen flex flex-col">
      {/* Project Switcher Header */}
      <ProjectSwitcher
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
      />
      
      {/* Error banner - show if there's an error but still render with fallback data */}
      {/* {hasError && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2">
          <div className="text-sm text-destructive font-semibold">
            Error loading workspace data from PayloadCMS
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {workspaceData.error?.message || threadData?.error?.message || 'Failed to load data from PayloadCMS. Using fallback data for development.'}
          </div>
        </div>
      )} */}
      
      {/* Warning banner - show if data is missing but no error */}
      {/* {shouldShowDataWarning && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2">
          <div className="text-sm text-yellow-700 dark:text-yellow-400 font-semibold">
            No workspace data available
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {selectedProjectId 
              ? 'This project has no threads or dialogues yet. Create them in the forge.'
              : 'Please select or create a project to get started.'}
          </div>
        </div>
      )} */}

      <div className="flex-1 w-full min-h-0">
        <DialogueForge
          className="h-full"
          toolbarActions={<ThemeSwitcher />}
        />
      </div>
    </div>
  );
}
