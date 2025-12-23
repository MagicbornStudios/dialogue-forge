'use client';

import { useState } from 'react';
import { DialogueEditorV2 } from '@magicborn/dialogue-forge/src/components/DialogueEditorV2';
import { FlagSchema, exampleFlagSchema } from '@magicborn/dialogue-forge/src/types/flags';
import { DialogueTree } from '@magicborn/dialogue-forge/src/types';
import { exportToYarn } from '@magicborn/dialogue-forge/src/lib/yarn-converter';

const defaultDialogue: DialogueTree = {
  id: 'demo-dialogue',
  title: 'Demo: The Mysterious Stranger',
  startNodeId: 'start',
  nodes: {
    'start': {
      id: 'start',
      type: 'npc',
      speaker: 'Stranger',
      x: 300,
      y: 100,
      content: "You find yourself at a crossroads. A cloaked figure emerges from the shadows.",
      nextNodeId: 'greeting',
    },
    'greeting': {
      id: 'greeting',
      type: 'npc',
      speaker: 'Stranger',
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
        },
        {
          id: 'choice_knowledge',
          text: "I'm searching for ancient knowledge.",
          nextNodeId: 'knowledge_response',
        },
      ],
    },
    'treasure_response': {
      id: 'treasure_response',
      type: 'npc',
      speaker: 'Stranger',
      x: 200,
      y: 450,
      content: "\"Many have sought the same. Take this map—it shows the entrance to the catacombs.\"",
      nextNodeId: null,
    },
    'knowledge_response': {
      id: 'knowledge_response',
      type: 'npc',
      speaker: 'Stranger',
      x: 400,
      y: 450,
      content: "\"A seeker of truth... Take this tome. It contains the riddles you must solve.\"",
      nextNodeId: null,
    },
  },
};

export default function DialogueForgeDemo() {
  const [dialogueTree, setDialogueTree] = useState<DialogueTree>(defaultDialogue);
  const [flagSchema] = useState<FlagSchema>(exampleFlagSchema);

  const handleExportYarn = () => {
    const yarn = exportToYarn(dialogueTree);
    const blob = new Blob([yarn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dialogueTree.title.replace(/\s+/g, '_')}.yarn`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-[calc(100vh-200px)]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white mb-2">Dialogue Forge Editor</h1>
          <p className="text-zinc-400">
            Create interactive dialogues with a visual node-based editor. Export to Yarn Spinner format.
          </p>
        </div>
      </div>
      <div className="w-full h-full">
        <DialogueEditorV2
          dialogue={dialogueTree}
          onChange={setDialogueTree}
          onExportYarn={handleExportYarn}
          flagSchema={flagSchema}
          initialViewMode="graph"
          className="w-full h-full"
        />
      </div>
    </div>
  );
}

