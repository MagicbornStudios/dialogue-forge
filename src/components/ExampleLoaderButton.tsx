/**
 * ExampleLoaderButton - Compact button for loading examples
 * 
 * Debug tool for loading example dialogues and flag schemas.
 * Only shown when ENABLE_DEBUG_TOOLS is true.
 */

import React, { useState } from 'react';
import { DialogueTree } from '../types';
import { FlagSchema } from '../types/flags';
import { 
  listExamples,
  listDemoFlagSchemas,
  getExampleDialogue,
  getDemoFlagSchema
} from '../examples';
import { FileCode } from 'lucide-react';

interface ExampleLoaderButtonProps {
  onLoadDialogue: (dialogue: DialogueTree) => void;
  onLoadFlags: (flags: FlagSchema) => void;
}

export function ExampleLoaderButton({ onLoadDialogue, onLoadFlags }: ExampleLoaderButtonProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleDialogueChange = (name: string) => {
    const dialogue = getExampleDialogue(name);
    if (dialogue) {
      onLoadDialogue(dialogue);
      setShowMenu(false);
    }
  };

  const handleFlagsChange = (name: string) => {
    const flags = getDemoFlagSchema(name);
    if (flags) {
      onLoadFlags(flags);
      setShowMenu(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`p-1.5 rounded transition-colors ${
          showMenu
            ? 'bg-[#e94560]/20 text-[#e94560] border border-[#e94560]/50'
            : 'bg-[#12121a] border border-[#2a2a3e] text-gray-400 hover:text-white hover:border-[#3a3a4e]'
        }`}
        title="Load Examples (Debug Tool)"
      >
        <FileCode size={14} />
      </button>
      {showMenu && (
        <div className="absolute left-full ml-2 top-0 z-50 bg-[#0d0d14] border border-[#2a2a3e] rounded-lg shadow-xl p-1 min-w-[250px]">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider px-2 py-1 border-b border-[#2a2a3e]">Load Examples</div>
          
          {/* Dialogue Examples */}
          <div className="px-2 py-1">
            <div className="text-xs text-gray-400 mb-1">Dialogue Examples</div>
            <select
              onChange={(e) => {
                if (e.target.value) handleDialogueChange(e.target.value);
              }}
              defaultValue=""
              className="w-full bg-[#12121a] border border-[#2a2a3e] text-white text-xs px-2 py-1.5 rounded hover:border-[#3a3a4e] focus:outline-none focus:border-[#e94560] cursor-pointer"
            >
              <option value="">Select dialogue...</option>
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
          </div>

          {/* Flag Schemas */}
          <div className="px-2 py-1 border-t border-[#2a2a3e]">
            <div className="text-xs text-gray-400 mb-1">Flag Schemas</div>
            <select
              onChange={(e) => {
                if (e.target.value) handleFlagsChange(e.target.value);
              }}
              defaultValue=""
              className="w-full bg-[#12121a] border border-[#2a2a3e] text-white text-xs px-2 py-1.5 rounded hover:border-[#3a3a4e] focus:outline-none focus:border-[#e94560] cursor-pointer"
            >
              <option value="">Select schema...</option>
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
        </div>
      )}
    </div>
  );
}



