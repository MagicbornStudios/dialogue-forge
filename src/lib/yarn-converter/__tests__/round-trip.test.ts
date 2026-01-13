import { describe, it, expect } from 'vitest';
import { importFromYarn, exportToYarn } from '../index';
import type { ForgeGraphDoc } from '@/src/types/forge/forge-graph';
import {
  createMockForgeGraphDoc,
  createSimpleCharacterNode,
  createSimplePlayerNode,
  createSimpleConditionalNode,
  normalizeYarn,
} from './helpers';
import { FORGE_NODE_TYPE } from '@/src/types/forge/forge-graph';
import { CONDITION_OPERATOR, YARN_BLOCK_TYPE } from '@/src/types/constants';

/**
 * Test round-trip conversion: Yarn → DialogueTree → Yarn
 * This ensures we can import and export without data loss
 */
describe('Yarn Round-Trip Conversion', () => {
  const testCases = [
    {
      name: 'Basic dialogue with choices',
      yarn: `title: start
---
NPC: Hello! How can I help you?
-> Option 1
    <<jump option1>>
-> Option 2
    <<jump option2>>
===

title: option1
---
NPC: You chose option 1!
===

title: option2
---
NPC: You chose option 2!
===
`
    },
    {
      name: 'Dialogue with flags',
      yarn: `title: start
---
NPC: Welcome!
<<set $flag1 = true>>
<<set $flag2 = true>>
-> Continue
    <<set $flag3 = true>>
    <<jump next>>
===

title: next
---
NPC: Flags have been set!
===
`
    },
    {
      name: 'Conditional blocks',
      yarn: `title: start
---
<<if $has_key>>
    Guard: The door is unlocked.
<<else>>
    Guard: The door is locked.
<<endif>>
===
`
    },
    {
      name: 'Variable operations',
      yarn: `title: merchant
---
Merchant: You have {$stat_gold} gold.
<<set $stat_gold += 100>>
Merchant: Now you have {$stat_gold} gold!
-> Buy item
    <<set $stat_gold -= 50>>
    <<set $item_sword = true>>
    Merchant: You bought a sword! You have {$stat_gold} gold left.
    <<jump end>>
===

title: end
---
===
`
    },
    {
      name: 'Complex conditional with multiple blocks',
      yarn: `title: start
---
<<if $stat_gold >= 100>>
    Merchant: You can afford the sword!
<<elseif $stat_gold >= 50>>
    Merchant: You can afford the potion!
<<else>>
    Merchant: You don't have enough gold.
<<endif>>
===
`
    }
  ];

  testCases.forEach(({ name, yarn }) => {
    it(`should round-trip: ${name}`, async () => {
      // Import Yarn to DialogueTree
      const dialogue = await importFromYarn(yarn, 'Test Dialogue');
      
      // Export DialogueTree back to Yarn
      const exportedYarn = await exportToYarn(dialogue);
      
      // Import the exported Yarn again
      const reimportedDialogue = await importFromYarn(exportedYarn, 'Test Dialogue');
      
      // Verify structure is preserved
      expect(reimportedDialogue.flow.nodes).toBeDefined();
      expect(reimportedDialogue.flow.nodes.length).toBeGreaterThan(0);
      
      // Verify all nodes are present
      const originalNodeIds = dialogue.flow.nodes.map(n => n.id);
      const reimportedNodeIds = reimportedDialogue.flow.nodes.map(n => n.id);
      expect(reimportedNodeIds.length).toBe(originalNodeIds.length);
      
      // Verify node types are preserved
      originalNodeIds.forEach(nodeId => {
        const original = dialogue.flow.nodes.find(n => n.id === nodeId);
        const reimported = reimportedDialogue.flow.nodes.find(n => n.id === nodeId);
        expect(reimported).toBeDefined();
        expect(reimported?.data?.type).toBe(original?.data?.type);
      });
    });
  });

  it('should preserve variable operations', async () => {
    const yarn = `title: test
---
NPC: Test
<<set $stat_gold += 100>>
<<set $stat_gold -= 50>>
<<set $stat_strength *= 2>>
===
`;
    
    const dialogue = await importFromYarn(yarn, 'Test');
    const exported = await exportToYarn(dialogue);
    
    // Verify operations are in exported Yarn
    expect(exported).toContain('<<set $stat_gold += 100>>');
    expect(exported).toContain('<<set $stat_gold -= 50>>');
    expect(exported).toContain('<<set $stat_strength *= 2>>');
  });

  it('should preserve variable interpolation', async () => {
    const yarn = `title: test
---
NPC: Hello {$player_name}! You have {$stat_gold} gold.
===
`;
    
    const dialogue = await importFromYarn(yarn, 'Test');
    const exported = await exportToYarn(dialogue);
    
    // Variable interpolation should be preserved in content
    const testNode = dialogue.flow.nodes.find(n => n.id === 'test');
    expect(testNode?.data?.content).toContain('{$player_name}');
    expect(testNode?.data?.content).toContain('{$stat_gold}');
  });

  it('should preserve conditional choices', async () => {
    const yarn = `title: start
---
<<if $has_key>>
    -> Use key
        <<jump unlocked>>
<<endif>>
-> Try to force
    <<jump forced>>
===
`;
    
    const dialogue = await importFromYarn(yarn, 'Test');
    const exported = await exportToYarn(dialogue);
    
    // Verify conditional choice structure
    const playerNode = dialogue.flow.nodes.find(n => n.id === 'start');
    expect(playerNode?.data?.type).toBe(FORGE_NODE_TYPE.PLAYER);
    expect(playerNode?.data?.choices).toBeDefined();
    expect(playerNode?.data?.choices!.length).toBeGreaterThan(0);
    
    // Verify conditions are exported
    expect(exported).toContain('<<if');
    expect(exported).toContain('<<endif>>');
  });

  describe('Per-Node-Type Round-Trips', () => {
    it('should round-trip CHARACTER node with all features', async () => {
      const graph = createMockForgeGraphDoc('Character Test', [
        createSimpleCharacterNode('char1', 'Hello!', 'NPC'),
      ]);
      
      if (graph.flow.nodes[0].data) {
        graph.flow.nodes[0].data.defaultNextNodeId = 'next';
        graph.flow.nodes[0].data.setFlags = ['flag1', 'flag2'];
      }

      const yarn = await exportToYarn(graph);
      const imported = await importFromYarn(yarn, 'Character Test');
      
      expect(imported.flow.nodes[0].data?.content).toBe('Hello!');
      expect(imported.flow.nodes[0].data?.speaker).toBe('NPC');
      expect(imported.flow.nodes[0].data?.defaultNextNodeId).toBe('next');
      expect(imported.flow.nodes[0].data?.setFlags).toEqual(['flag1', 'flag2']);
    });

    it('should round-trip PLAYER node with conditional choices', async () => {
      const graph = createMockForgeGraphDoc('Player Test', [
        createSimplePlayerNode('player1', [
          { text: 'Yes', nextNodeId: 'yes_node' },
          { text: 'No', nextNodeId: 'no_node' },
        ]),
      ]);

      if (graph.flow.nodes[0].data?.choices?.[0]) {
        graph.flow.nodes[0].data.choices[0].conditions = [
          { flag: 'has_key', operator: CONDITION_OPERATOR.IS_SET },
        ];
        graph.flow.nodes[0].data.choices[0].setFlags = ['quest_started'];
      }

      const yarn = await exportToYarn(graph);
      const imported = await importFromYarn(yarn, 'Player Test');
      
      expect(imported.flow.nodes[0].data?.choices?.[0].conditions).toBeDefined();
      expect(imported.flow.nodes[0].data?.choices?.[0].setFlags).toContain('quest_started');
    });

    it('should round-trip CONDITIONAL node with if/elseif/else', async () => {
      const graph = createMockForgeGraphDoc('Conditional Test', [
        createSimpleConditionalNode('cond1', [
          {
            type: 'if',
            condition: [
              { flag: 'gold', operator: CONDITION_OPERATOR.GREATER_THAN, value: 100 },
            ],
            content: 'Can afford sword!',
          },
          {
            type: 'elseif',
            condition: [
              { flag: 'gold', operator: CONDITION_OPERATOR.GREATER_THAN, value: 50 },
            ],
            content: 'Can afford potion!',
          },
          {
            type: 'else',
            content: 'Not enough gold!',
          },
        ]),
      ]);

      const yarn = await exportToYarn(graph);
      const imported = await importFromYarn(yarn, 'Conditional Test');
      
      expect(imported.flow.nodes[0].data?.conditionalBlocks?.length).toBe(3);
      expect(imported.flow.nodes[0].data?.conditionalBlocks?.[0].type).toBe(YARN_BLOCK_TYPE.IF);
      expect(imported.flow.nodes[0].data?.conditionalBlocks?.[1].type).toBe(YARN_BLOCK_TYPE.ELSEIF);
      expect(imported.flow.nodes[0].data?.conditionalBlocks?.[2].type).toBe(YARN_BLOCK_TYPE.ELSE);
    });
  });

  describe('Complex Scenarios', () => {
    it('should round-trip nested conditionals in character node', async () => {
      const graph = createMockForgeGraphDoc('Nested Conditionals', [
        createSimpleCharacterNode('char1', 'Hello!', 'NPC'),
      ]);

      if (graph.flow.nodes[0].data) {
        graph.flow.nodes[0].data.conditionalBlocks = [
          {
            id: 'block1',
            type: YARN_BLOCK_TYPE.IF,
            condition: [
              { flag: 'quest', operator: CONDITION_OPERATOR.IS_SET },
            ],
            content: 'Quest active!',
            speaker: 'Guard',
          },
          {
            id: 'block2',
            type: YARN_BLOCK_TYPE.ELSE,
            content: 'No quest!',
            speaker: 'Guard',
          },
        ];
      }

      const yarn = await exportToYarn(graph);
      const imported = await importFromYarn(yarn, 'Nested Conditionals');
      
      expect(imported.flow.nodes[0].data?.conditionalBlocks?.length).toBe(2);
    });

    it('should round-trip graph with multiple node types and connections', async () => {
      const graph = createMockForgeGraphDoc('Complex Graph', [
        createSimpleCharacterNode('start', 'Welcome!', 'NPC'),
        createSimplePlayerNode('choices', [
          { text: 'Option 1', nextNodeId: 'end1' },
          { text: 'Option 2', nextNodeId: 'end2' },
        ]),
        createSimpleCharacterNode('end1', 'End 1', 'NPC'),
        createSimpleCharacterNode('end2', 'End 2', 'NPC'),
      ], 'start');

      if (graph.flow.nodes[0].data) {
        graph.flow.nodes[0].data.defaultNextNodeId = 'choices';
      }

      const yarn = await exportToYarn(graph);
      const imported = await importFromYarn(yarn, 'Complex Graph');
      
      expect(imported.flow.nodes.length).toBe(4);
      expect(imported.startNodeId).toBe('start');
    });
  });
});




