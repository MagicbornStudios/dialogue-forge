import React from 'react';
import { ForgeGraphDoc, ForgeNode, ForgeNodePresentation } from '@/forge/types/forge-graph';
import { ForgeCharacter } from '@/forge/types/characters';
import { CharacterSelector } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/shared/CharacterSelector';
import { User } from 'lucide-react';
import { NextNodeSelector } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/NodeEditor/NextNodeSelector';

interface CharacterNodeFieldsProps {
  node: ForgeNode;
  graph: ForgeGraphDoc;
  characters: Record<string, ForgeCharacter>;
  onUpdate: (updates: Partial<ForgeNode>) => void;
  onFocusNode?: (nodeId: string) => void;
}

export function CharacterNodeFields({ node, graph, characters, onUpdate, onFocusNode }: CharacterNodeFieldsProps) {
  const updatePresentation = (updates: Partial<ForgeNodePresentation>) => {
    const nextPresentation = { ...node.presentation, ...updates };
    const hasValue = Object.values(nextPresentation).some((value) => value);
    onUpdate({ presentation: hasValue ? nextPresentation : undefined });
  };

  return (
    <>
      <div>
        <label className="text-[10px] text-[var(--color-df-text-secondary)] uppercase">Character</label>
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
        <div className="text-[9px] text-[var(--color-df-text-tertiary)] mt-1">
          Or enter custom speaker name below
        </div>
      </div>
      <div>
        <label className="text-[10px] text-[var(--color-df-text-secondary)] uppercase">Speaker (Custom)</label>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-df-control-bg)] border border-border flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-[var(--color-df-text-secondary)]" />
          </div>
          <input
            type="text"
            value={node.speaker || ''}
            onChange={(event) => onUpdate({ speaker: event.target.value })}
            className="flex-1 bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-npc-accent)] outline-none"
            placeholder="Custom speaker name (optional)"
          />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <label className="text-[10px] text-[var(--color-df-text-secondary)] uppercase">Media</label>
        <div className="grid grid-cols-1 gap-2">
          <input
            type="text"
            value={node.presentation?.imageId || ''}
            onChange={(event) => updatePresentation({ imageId: event.target.value || undefined })}
            className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-npc-accent)] outline-none"
            placeholder="Image ID (optional)"
          />
          <input
            type="text"
            value={node.presentation?.backgroundId || ''}
            onChange={(event) => updatePresentation({ backgroundId: event.target.value || undefined })}
            className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-npc-accent)] outline-none"
            placeholder="Background ID (optional)"
          />
          <input
            type="text"
            value={node.presentation?.portraitId || ''}
            onChange={(event) => updatePresentation({ portraitId: event.target.value || undefined })}
            className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-npc-accent)] outline-none"
            placeholder="Portrait ID (optional)"
          />
        </div>
      </div>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Content</label>
        <textarea
          value={node.content}
          onChange={(event) => onUpdate({ content: event.target.value })}
          className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-npc-accent)] outline-none min-h-[100px] resize-y"
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
