'use client';

import { useState, useCallback } from 'react';
import { DialogueEditorV2 } from '@magicborn/dialogue-forge/src/components/DialogueEditorV2';
import { FlagManager } from '@magicborn/dialogue-forge/src/components/FlagManager';
import { GuidePanel } from '@magicborn/dialogue-forge/src/components/GuidePanel';
import { FlagSchema, exampleFlagSchema } from '@magicborn/dialogue-forge/src/types/flags';
import { DialogueTree } from '@magicborn/dialogue-forge/src/types';
import { exportToYarn } from '@magicborn/dialogue-forge/src/lib/yarn-converter';
import { 
  listExamples, 
  getExampleDialogue, 
  listDemoFlagSchemas,
  getDemoFlagSchema,
  getExampleCharacters
} from '@magicborn/dialogue-forge/src/examples';
import { Play, Layout, FileText } from 'lucide-react';
import { ThemeSwitcher } from '../components/ThemeSwitcher';

type ViewMode = 'graph' | 'yarn' | 'play';

// Tell Next.js this page is static (no dynamic params/searchParams)
export const dynamic = 'force-static';

// Demo examples - these are specific to the demo app
const demoDialogues: Record<string, DialogueTree> = {
  'mysterious-stranger': {
    id: 'mysterious-stranger',
    title: 'Demo: The Mysterious Stranger',
    startNodeId: 'start',
    nodes: {
      'start': {
        id: 'start',
        type: 'npc',
        characterId: 'stranger',
        speaker: 'Stranger', // Fallback
        x: 300,
        y: 100,
        content: "You find yourself at a crossroads. A cloaked figure emerges from the shadows.",
        nextNodeId: 'greeting',
      },
      'greeting': {
        id: 'greeting',
        type: 'npc',
        characterId: 'stranger',
        speaker: 'Stranger', // Fallback
        x: 300,
        y: 200,
        content: "\"Traveler... I've been waiting for you. What brings you to these lands?\"",
        nextNodeId: 'first_choice',
      },
      'first_choice': {
        id: 'first_choice',
        type: 'player',
        content: '',
        x: 300,
        y: 300,
        choices: [
          {
            id: 'choice_treasure',
            text: "I seek the legendary treasure.",
            nextNodeId: 'treasure_response',
            conditions: [
              { flag: 'reputation', operator: 'greater_equal', value: 0 },
            ],
          },
          {
            id: 'choice_knowledge',
            text: "I'm searching for ancient knowledge.",
            nextNodeId: 'knowledge_response',
            conditions: [
              { flag: 'reputation', operator: 'greater_equal', value: 0 },
            ],
          },
          {
            id: 'choice_high_rep',
            text: "I am a hero of this land!",
            nextNodeId: 'high_rep_response',
            conditions: [
              { flag: 'reputation', operator: 'greater_than', value: 50 },
            ],
          },
        ],
      },
      'treasure_response': {
        id: 'treasure_response',
        type: 'npc',
        characterId: 'stranger',
        speaker: 'Stranger', // Fallback
        x: 200,
        y: 450,
        content: "\"Many have sought the same. Take this map—it shows the entrance to the catacombs.\"",
        nextNodeId: undefined,
      },
      'knowledge_response': {
        id: 'knowledge_response',
        type: 'npc',
        characterId: 'stranger',
        speaker: 'Stranger', // Fallback
        x: 400,
        y: 450,
        content: "\"A seeker of truth... Take this tome. It contains the riddles you must solve.\"",
        nextNodeId: undefined,
      },
      'high_rep_response': {
        id: 'high_rep_response',
        type: 'npc',
        characterId: 'stranger',
        speaker: 'Stranger', // Fallback
        x: 500,
        y: 450,
        content: "\"Ah, a hero! Your reputation precedes you. I have something special for you...\"",
        nextNodeId: undefined,
        setFlags: ['reputation'],
      },
    },
  },
  'tavern-quest': {
    id: 'tavern-quest',
    title: 'Demo: Tavern Quest',
    startNodeId: 'enter_tavern',
    nodes: {
      'enter_tavern': {
        id: 'enter_tavern',
        type: 'npc',
        speaker: 'Narrator',
        x: 300,
        y: 50,
        content: "You push open the heavy wooden door and enter the Rusty Dragon tavern.",
        nextNodeId: 'bartender_greet',
      },
      'bartender_greet': {
        id: 'bartender_greet',
        type: 'npc',
        characterId: 'bartender',
        speaker: 'Bartender', // Fallback
        x: 300,
        y: 150,
        content: "\"Welcome, stranger! What can I get ya? We've got ale, mead, or if you're looking for work, I might have something.\"",
        nextNodeId: 'tavern_choice',
      },
      'tavern_choice': {
        id: 'tavern_choice',
        type: 'player',
        content: '',
        x: 300,
        y: 280,
        choices: [
          { id: 'order_ale', text: "I'll have an ale.", nextNodeId: 'drink_ale' },
          { id: 'ask_work', text: "What kind of work?", nextNodeId: 'work_info' },
          { id: 'look_around', text: "I'll just look around.", nextNodeId: 'observe_tavern' },
          { 
            id: 'vip_entrance', 
            text: "I'm a VIP member.",
            nextNodeId: 'vip_response',
            conditions: [
              { flag: 'reputation', operator: 'greater_than', value: 75 },
            ],
          },
        ],
      },
      'drink_ale': {
        id: 'drink_ale',
        type: 'npc',
        characterId: 'bartender',
        speaker: 'Bartender', // Fallback
        x: 100,
        y: 420,
        content: "\"Coming right up!\" He slides a frothy mug across the bar.",
        nextNodeId: undefined,
      },
      'work_info': {
        id: 'work_info',
        type: 'npc',
        characterId: 'bartender',
        speaker: 'Bartender', // Fallback
        x: 300,
        y: 420,
        content: "\"Rats in the cellar. Big ones. I'll pay 10 gold if you clear 'em out.\"",
        nextNodeId: 'accept_quest',
      },
      'accept_quest': {
        id: 'accept_quest',
        type: 'player',
        content: '',
        x: 300,
        y: 550,
        choices: [
          { id: 'accept', text: "I'll do it.", nextNodeId: 'quest_accepted' },
          { id: 'decline', text: "Not interested." },
        ],
      },
      'quest_accepted': {
        id: 'quest_accepted',
        type: 'npc',
        characterId: 'bartender',
        speaker: 'Bartender', // Fallback
        x: 300,
        y: 680,
        content: "\"Great! The cellar door is in the back. Good luck!\"",
        nextNodeId: undefined,
      },
      'observe_tavern': {
        id: 'observe_tavern',
        type: 'npc',
        characterId: 'narrator',
        speaker: 'Narrator', // Fallback
        x: 500,
        y: 420,
        content: "You notice a hooded figure in the corner, watching you intently...",
        nextNodeId: undefined,
      },
      'vip_response': {
        id: 'vip_response',
        type: 'npc',
        characterId: 'bartender',
        speaker: 'Bartender', // Fallback
        x: 600,
        y: 420,
        content: "\"Of course! Right this way to the VIP lounge. Your reputation grants you access.\"",
        nextNodeId: undefined,
      },
    },
  },
};

// Enhanced flag schema with reputation for demo examples
const demoFlagSchema: FlagSchema = {
  ...exampleFlagSchema,
  flags: [
    ...exampleFlagSchema.flags,
    {
      id: 'reputation',
      name: 'Reputation',
      type: 'stat',
      description: 'Player reputation score',
      defaultValue: 0,
    },
  ],
};

export default function DialogueForgeDemo() {
  const [dialogueTree, setDialogueTree] = useState<DialogueTree>(demoDialogues['mysterious-stranger']);
  const [flagSchema, setFlagSchema] = useState<FlagSchema>(demoFlagSchema);
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const characters = getExampleCharacters(); // Get example characters
  
  // Panel states
  const [showFlagManager, setShowFlagManager] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showExamplePicker, setShowExamplePicker] = useState(false);

  const handleExportYarn = useCallback(() => {
    const yarn = exportToYarn(dialogueTree);
    const blob = new Blob([yarn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dialogueTree.title.replace(/\s+/g, '_')}.yarn`;
    a.click();
    URL.revokeObjectURL(url);
  }, [dialogueTree]);

  const handleLoadExample = useCallback((exampleId: string) => {
    // Try demo examples first
    if (demoDialogues[exampleId]) {
      setDialogueTree(demoDialogues[exampleId]);
      setShowExamplePicker(false);
      return;
    }
    // Try package examples
    const example = getExampleDialogue(exampleId);
    if (example) {
      setDialogueTree(example);
    }
    setShowExamplePicker(false);
  }, []);

  const handleLoadFlagSchema = useCallback((schemaId: string) => {
    const schema = getDemoFlagSchema(schemaId);
    if (schema) {
      setFlagSchema(schema);
    }
  }, []);

  // Get all available examples
  const allExamples = [
    ...Object.keys(demoDialogues),
    ...listExamples()
  ].filter((v, i, a) => a.indexOf(v) === i); // unique

  const allFlagSchemas = listDemoFlagSchemas();

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex-shrink-0 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Dialogue Forge Editor</h1>
            <p className="text-zinc-400 text-sm">
              Create interactive dialogues with a visual node-based editor. Export to Yarn Spinner format.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <div className="w-px h-6 bg-zinc-700" />
            <button
              onClick={() => setShowExamplePicker(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
            >
              Load Example
            </button>
            <div className="w-px h-6 bg-zinc-700" />
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-[#12121a] border border-[#2a2a3e] rounded-lg p-1">
              <button
                onClick={() => setViewMode('graph')}
                className={`px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-1.5 ${
                  viewMode === 'graph'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Graph Editor"
              >
                <Layout size={14} />
                <span className="hidden sm:inline">Editor</span>
              </button>
              <button
                onClick={() => setViewMode('play')}
                className={`px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-1.5 ${
                  viewMode === 'play'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Play Dialogue"
              >
                <Play size={14} />
                <span className="hidden sm:inline">Play</span>
              </button>
            </div>
            <button
              onClick={() => setShowExamplePicker(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
            >
              Load Example
            </button>
          </div>
        </div>
      </div>

      {/* Editor/Player */}
      <div className="flex-1 w-full min-h-0">
        <DialogueEditorV2
          dialogue={dialogueTree}
          onChange={setDialogueTree}
          onExportYarn={handleExportYarn}
          flagSchema={flagSchema}
          characters={characters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          className="w-full h-full"
          onOpenFlagManager={() => setShowFlagManager(true)}
          onOpenGuide={() => setShowGuide(true)}
        />
      </div>

      {/* Flag Manager Modal */}
      {showFlagManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#0d0d14] border border-[#2a2a3e] rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <FlagManager
              flagSchema={flagSchema}
              dialogue={dialogueTree}
              onUpdate={setFlagSchema}
              onClose={() => setShowFlagManager(false)}
            />
          </div>
        </div>
      )}

      {/* Guide Panel */}
      <GuidePanel
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
      />

      {/* Example Picker Modal */}
      {showExamplePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#0d0d14] border border-[#2a2a3e] rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Load Example Dialogue</h2>
              <button
                onClick={() => setShowExamplePicker(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Demo Examples</h3>
              {Object.entries(demoDialogues).map(([id, dialogue]) => (
                <button
                  key={id}
                  onClick={() => handleLoadExample(id)}
                  className="w-full text-left px-4 py-3 bg-[#12121a] hover:bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg transition-colors"
                >
                  <div className="font-medium text-white">{dialogue.title}</div>
                  <div className="text-xs text-gray-400">
                    {Object.keys(dialogue.nodes).length} nodes
                  </div>
                </button>
              ))}
              
              {listExamples().length > 0 && (
                <>
                  <h3 className="text-sm font-medium text-gray-400 mt-4 mb-2">Package Examples</h3>
                  {listExamples().map((id) => (
                    <button
                      key={id}
                      onClick={() => handleLoadExample(id)}
                      className="w-full text-left px-4 py-3 bg-[#12121a] hover:bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg transition-colors"
                    >
                      <div className="font-medium text-white">{id}</div>
                    </button>
                  ))}
                </>
              )}
            </div>

            {allFlagSchemas.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#2a2a3e]">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Flag Schemas</h3>
                <div className="flex flex-wrap gap-2">
                  {allFlagSchemas.map((id) => (
                    <button
                      key={id}
                      onClick={() => handleLoadFlagSchema(id)}
                      className="px-3 py-1 text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-500/30 transition-colors"
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
