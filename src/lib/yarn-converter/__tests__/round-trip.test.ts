import { describe, it, expect } from 'vitest';
import { importFromYarn, exportToYarn } from '../../yarn-converter';
import { DialogueTree } from '../../../types';

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
    it(`should round-trip: ${name}`, () => {
      // Import Yarn to DialogueTree
      const dialogue = importFromYarn(yarn, 'Test Dialogue');
      
      // Export DialogueTree back to Yarn
      const exportedYarn = exportToYarn(dialogue);
      
      // Import the exported Yarn again
      const reimportedDialogue = importFromYarn(exportedYarn, 'Test Dialogue');
      
      // Verify structure is preserved
      expect(reimportedDialogue.nodes).toBeDefined();
      expect(Object.keys(reimportedDialogue.nodes).length).toBeGreaterThan(0);
      
      // Verify all nodes are present
      const originalNodeIds = Object.keys(dialogue.nodes);
      const reimportedNodeIds = Object.keys(reimportedDialogue.nodes);
      expect(reimportedNodeIds.length).toBe(originalNodeIds.length);
      
      // Verify node types are preserved
      originalNodeIds.forEach(nodeId => {
        const original = dialogue.nodes[nodeId];
        const reimported = reimportedDialogue.nodes[nodeId];
        expect(reimported).toBeDefined();
        expect(reimported.type).toBe(original.type);
      });
    });
  });

  it('should preserve variable operations', () => {
    const yarn = `title: test
---
NPC: Test
<<set $stat_gold += 100>>
<<set $stat_gold -= 50>>
<<set $stat_strength *= 2>>
===
`;
    
    const dialogue = importFromYarn(yarn, 'Test');
    const exported = exportToYarn(dialogue);
    
    // Verify operations are in exported Yarn
    expect(exported).toContain('<<set $stat_gold += 100>>');
    expect(exported).toContain('<<set $stat_gold -= 50>>');
    expect(exported).toContain('<<set $stat_strength *= 2>>');
  });

  it('should preserve variable interpolation', () => {
    const yarn = `title: test
---
NPC: Hello {$player_name}! You have {$stat_gold} gold.
===
`;
    
    const dialogue = importFromYarn(yarn, 'Test');
    const exported = exportToYarn(dialogue);
    
    // Variable interpolation should be preserved in content
    expect(dialogue.nodes.test.content).toContain('{$player_name}');
    expect(dialogue.nodes.test.content).toContain('{$stat_gold}');
  });

  it('should preserve conditional choices', () => {
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
    
    const dialogue = importFromYarn(yarn, 'Test');
    const exported = exportToYarn(dialogue);
    
    // Verify conditional choice structure
    const playerNode = dialogue.nodes.start;
    expect(playerNode.type).toBe('player');
    expect(playerNode.choices).toBeDefined();
    expect(playerNode.choices!.length).toBeGreaterThan(0);
    
    // Verify conditions are exported
    expect(exported).toContain('<<if');
    expect(exported).toContain('<<endif>>');
  });
});




