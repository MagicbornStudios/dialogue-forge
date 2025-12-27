/**
 * Inline Yarn file contents for examples
 * This allows examples to be bundled and loaded synchronously
 * 
 * To add a new example:
 * 1. Create a .yarn file in the examples directory
 * 2. Copy its content here as a string literal
 * 3. Add it to the yarnExamplesContent object
 */

import { importFromYarn } from '../lib/yarn-converter';
import { examplesRegistry, exampleFlagSchemas } from './examples-registry';
import { DialogueTree } from '../types';

/**
 * Map of example ID to Yarn file content
 * All examples are stored as Yarn strings here for easy discovery and maintenance
 */
const yarnExamplesContent: Record<string, string> = {
  'variable-operations': `title: merchant_shop
---
Merchant: Welcome to my shop, {$player_name}!
Merchant: You currently have {$stat_gold} gold pieces.
<<if $stat_gold >= 100>>
    Merchant: You can afford the sword! It costs 100 gold.
    -> Buy the sword
        <<set $item_sword = true>>
        <<set $stat_gold -= 100>>
        Merchant: Thank you for your purchase! You now have {$stat_gold} gold.
        <<jump after_purchase>>
    -> Maybe later
        Merchant: Come back anytime!
        <<jump end>>
<<elseif $stat_gold >= 50>>
    Merchant: You can afford the potion! It costs 50 gold.
    -> Buy the potion
        <<set $item_potion = true>>
        <<set $stat_gold -= 50>>
        Merchant: Thank you! You now have {$stat_gold} gold.
        <<jump after_purchase>>
    -> Save up for the sword
        Merchant: Wise choice! Come back when you have more gold.
        <<jump end>>
<<else>>
    Merchant: I'm sorry, but you don't have enough gold for anything.
    Merchant: Come back when you have at least 50 gold pieces.
    <<jump end>>
<<endif>>
===

title: after_purchase
---
Merchant: Is there anything else you'd like?
<<set $stat_reputation += 5>>
Merchant: Your reputation with me has increased! It's now {$stat_reputation}.
-> Browse more
    <<jump merchant_shop>>
-> Leave
    Merchant: Thanks for shopping!
    <<jump end>>
===

title: quest_reward
---
QuestGiver: You've completed the quest! Here's your reward.
<<set $stat_gold += 500>>
<<set $stat_experience += 100>>
<<set $quest_dragon_slayer = "complete">>
QuestGiver: You received 500 gold and 100 experience!
QuestGiver: You now have {$stat_gold} gold and {$stat_experience} experience points.
<<jump end>>
===

title: stat_multiplier
---
Trainer: I can double your strength for a price.
<<if $stat_gold >= 200>>
    Trainer: For 200 gold, I'll double your strength stat.
    -> Pay for training
        <<set $stat_strength *= 2>>
        <<set $stat_gold -= 200>>
        Trainer: Your strength is now {$stat_strength}!
        <<jump end>>
    -> Not right now
        Trainer: Come back when you're ready.
        <<jump end>>
<<else>>
    Trainer: You need 200 gold for this training.
    <<jump end>>
<<endif>>
===

title: string_variables
---
NPC: Hello, {$player_name}! Welcome to {$location_name}.
NPC: Your title is {$player_title}.
<<set $greeting_count += 1>>
NPC: I've greeted you {$greeting_count} times now.
<<if $greeting_count >= 5>>
    NPC: You're a regular here! Let me give you a discount.
    <<set $stat_reputation += 10>>
<<endif>>
<<jump end>>
===

title: end
---
===
`,
  'linear-story': `title: opening
---
Narrator: The old lighthouse stood silent against the storm, its beacon long extinguished.
Narrator: You've been searching for three days, following the map your grandfather left behind.
Narrator: The key to the lighthouse door feels cold in your hand, heavy with purpose.
<<jump lighthouse_entrance>>
===

title: lighthouse_entrance
---
Narrator: The door creaks open with a sound that echoes through the empty tower.
Narrator: Dust motes dance in the beam of your flashlight as you step inside.
Narrator: The air is still, thick with the scent of salt and old wood.
<<jump climbing_stairs>>
===

title: climbing_stairs
---
Narrator: Your footsteps echo on the spiral staircase as you climb.
Narrator: Each step feels like a journey through time, the wood groaning under your weight.
Narrator: You count the steps: twenty, thirty, forty... the tower seems endless.
<<jump lantern_room>>
===

title: lantern_room
---
Narrator: At the top, you find the lantern room—the heart of the lighthouse.
Narrator: The great lens sits dark and still, its glass covered in years of grime.
Narrator: But something catches your eye: a small wooden box on the windowsill.
<<jump finding_box>>
===

title: finding_box
---
Narrator: You approach the box carefully, your heart racing.
Narrator: Carved into its lid are words you recognize: "For when the light returns."
Narrator: Inside, you find a letter, yellowed with age, and a single match.
<<jump reading_letter>>
===

title: reading_letter
---
Narrator: The letter is in your grandfather's handwriting, dated fifty years ago.
Narrator: "If you're reading this, you've found your way home. Light the beacon."
Narrator: "The world needs its light again. Trust in what you know to be true."
<<jump lighting_beacon>>
===

title: lighting_beacon
---
Narrator: You strike the match, its flame dancing in the darkness.
Narrator: As you light the old lantern, the lens begins to turn, slowly at first.
Narrator: Light spills across the sea, cutting through the storm like a blade.
<<jump beacon_awakened>>
===

title: beacon_awakened
---
Narrator: The lighthouse awakens, its beam reaching far across the waters.
Narrator: In the distance, you see something impossible: ships, long thought lost, returning home.
Narrator: Your grandfather's promise fulfilled, the light guides them safely to shore.
<<jump epilogue>>
===

title: epilogue
---
Narrator: The storm breaks, and dawn paints the sky in shades of gold and rose.
Narrator: You stand at the top of the lighthouse, watching the ships come home.
Narrator: The beacon burns bright once more, and you know—this is where you belong.
===
`,
  // Add more examples here as they're converted to Yarn format
};

/**
 * Pre-loaded examples cache
 */
let examplesCache: Record<string, DialogueTree> = {};

/**
 * Load all examples synchronously
 * This should be called once at initialization
 */
export function loadAllExamples(): Record<string, DialogueTree> {
  if (Object.keys(examplesCache).length > 0) {
    return examplesCache;
  }

  const loaded: Record<string, DialogueTree> = {};

  for (const metadata of examplesRegistry) {
    const yarnContent = yarnExamplesContent[metadata.id];
    if (yarnContent) {
      try {
        const dialogue = importFromYarn(yarnContent, metadata.title);
        loaded[metadata.id] = dialogue;
        metadata.nodeCount = Object.keys(dialogue.nodes).length;
      } catch (error) {
        console.error(`Error loading example ${metadata.id}:`, error);
      }
    }
  }

  examplesCache = loaded;
  return loaded;
}

// Pre-load examples when module is imported
loadAllExamples();

/**
 * Get a loaded example dialogue
 */
export function getExampleDialogue(exampleId: string): DialogueTree | null {
  if (Object.keys(examplesCache).length === 0) {
    loadAllExamples();
  }
  return examplesCache[exampleId] || null;
}

/**
 * Get all loaded examples
 */
export function getAllExampleDialogues(): Record<string, DialogueTree> {
  if (Object.keys(examplesCache).length === 0) {
    loadAllExamples();
  }
  return examplesCache;
}

/**
 * Get flag schema for an example
 */
export function getExampleFlagSchema(exampleId: string) {
  const metadata = examplesRegistry.find(ex => ex.id === exampleId);
  if (!metadata) {
    return null;
  }
  return exampleFlagSchemas[metadata.flagSchemaId] || null;
}

/**
 * Check if an example has Yarn content available
 */
export function hasExampleContent(exampleId: string): boolean {
  return exampleId in yarnExamplesContent;
}

/**
 * Get list of example IDs that have content available
 */
export function getAvailableExampleIds(): string[] {
  return examplesRegistry
    .filter(metadata => hasExampleContent(metadata.id))
    .map(metadata => metadata.id);
}

