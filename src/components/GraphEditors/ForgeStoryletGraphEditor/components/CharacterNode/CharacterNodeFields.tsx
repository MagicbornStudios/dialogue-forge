import React from 'react';
import { ForgeGraphDoc } from '../../../../../types';
import { ForgeCharacter } from '../../../../../types/characters';
import { CharacterSelector } from '../CharacterSelector';
import { User } from 'lucide-react';
import { NextNodeSelector } from '../../../shared/NodeEditor/components/NextNodeSelector';
import { ForgeNode } from '@/src/types/forge/forge-graph';

interface CharacterNodeFieldsProps {
  node: ForgeNode;
  graph: ForgeGraphDoc;
  characters: Record<string, ForgeCharacter>;
  onUpdate: (updates: Partial<ForgeNode>) => void;
  onFocusNode?: (nodeId: string) => void;
}

export function CharacterNodeFields({ node, graph, characters, onUpdate, onFocusNode }: CharacterNodeFieldsProps) {
  return (
    <>
      <div>
        <label className="text-[10px] text-df-text-secondary uppercase">Character</label>
        <CharacterSelector
          characters={characters}
          selectedCharacterId={node.characterId}
          onSelect={(characterId) => {
            const character = characterId ? characters[characterId] : undefined;
            onUpdate({
              characterId,
              speaker: character ? character.name : node.speaker,
            });
          }}
          placeholder="Select character..."
          className="mb-2"
        />
        <div className="text-[9px] text-df-text-tertiary mt-1">
          Or enter custom speaker name below
        </div>
      </div>
      <div>
        <label className="text-[10px] text-df-text-secondary uppercase">Speaker (Custom)</label>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-df-control-bg border border-df-control-border flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-df-text-secondary" />
          </div>
          <input
            type="text"
            value={node.speaker || ''}
            onChange={(event) => onUpdate({ speaker: event.target.value })}
            className="flex-1 bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-npc-selected outline-none"
            placeholder="Custom speaker name (optional)"
          />
        </div>
      </div>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Content</label>
        <textarea
          value={node.content}
          onChange={(event) => onUpdate({ content: event.target.value })}
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-npc-selected outline-none min-h-[100px] resize-y"
          placeholder="What the character says..."
        />
      </div>
      <NextNodeSelector
        nodeId={node.id as string}
        nextNodeId={node.defaultNextNodeId as string}
        graph={graph as ForgeGraphDoc}
        onUpdate={(updates: Partial<{ nextNodeId?: string | undefined; }>) => onUpdate(updates as Partial<ForgeNode>)}
        onFocusNode={onFocusNode}
      />
    </>
  );
}
