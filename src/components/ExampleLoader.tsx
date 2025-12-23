import React from 'react';
import { DialogueTree } from '../types';
import { FlagSchema } from '../types/flags';
import { 
  exampleFlagSchemas,
  listExamples,
  listDemoFlagSchemas,
  getExampleDialogue,
  getDemoFlagSchema
} from '../examples';

interface ExampleLoaderProps {
  onLoadDialogue: (dialogue: DialogueTree) => void;
  onLoadFlags: (flags: FlagSchema) => void;
  currentDialogue?: DialogueTree;
  currentFlags?: FlagSchema;
}

export function ExampleLoader({ onLoadDialogue, onLoadFlags }: ExampleLoaderProps) {
  const handleDialogueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    if (name) {
      const dialogue = getExampleDialogue(name);
      if (dialogue) {
        onLoadDialogue(dialogue);
      }
    }
  };

  const handleFlagsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    if (name) {
      const flags = getDemoFlagSchema(name);
      if (flags) {
        onLoadFlags(flags);
      }
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* Dialogue Examples Dropdown */}
      <select
        onChange={handleDialogueChange}
        defaultValue=""
        className="bg-[#12121a] border border-[#2a2a3e] text-white text-sm px-3 py-1.5 rounded hover:border-[#3a3a4e] focus:outline-none focus:border-[#e94560] cursor-pointer"
        title="Load Dialogue Example"
      >
        <option value="" disabled>Dialogue Example...</option>
        {listExamples().map(name => {
          const dialogue = getExampleDialogue(name);
          if (!dialogue) return null;
          const nodeCount = Object.keys(dialogue.nodes).length;
          return (
            <option key={name} value={name}>
              {dialogue.title} ({nodeCount} nodes)
            </option>
          );
        }).filter(Boolean)}
      </select>

      {/* Flag Schemas Dropdown */}
      <select
        onChange={handleFlagsChange}
        defaultValue=""
        className="bg-[#12121a] border border-[#2a2a3e] text-white text-sm px-3 py-1.5 rounded hover:border-[#3a3a4e] focus:outline-none focus:border-[#e94560] cursor-pointer"
        title="Load Flag Schema"
      >
        <option value="" disabled>Flag Schema...</option>
        {listDemoFlagSchemas().map(name => {
          const flags = getDemoFlagSchema(name);
          return (
            <option key={name} value={name}>
              {name.charAt(0).toUpperCase() + name.slice(1)} ({flags?.flags.length || 0} flags)
            </option>
          );
        })}
      </select>
    </div>
  );
}

