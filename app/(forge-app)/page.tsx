'use client';

import { NarrativeWorkspace as DialogueForge } from '@magicborn/dialogue-forge/src/components/NarrativeWorkspace';
import { FlagSchema, exampleFlagSchema } from '@magicborn/dialogue-forge/src/types/flags';
import type { DialogueTree, StoryThread } from '@magicborn/dialogue-forge/src/types';
import { NARRATIVE_ELEMENT, STORYLET_SELECTION_MODE } from '@magicborn/dialogue-forge/src/types/narrative';
import { CONDITION_OPERATOR, FLAG_TYPE, NODE_TYPE } from '@magicborn/dialogue-forge/src/types/constants';
import { getExampleCharacters } from '@magicborn/dialogue-forge/src/examples';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

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
        type: NODE_TYPE.NPC,
        characterId: 'stranger',
        speaker: 'Stranger', // Fallback
        x: 300,
        y: 100,
        content: 'You find yourself at a crossroads. A cloaked figure emerges from the shadows.',
        nextNodeId: 'greeting',
      },
      'greeting': {
        id: 'greeting',
        type: NODE_TYPE.NPC,
        characterId: 'stranger',
        speaker: 'Stranger', // Fallback
        x: 300,
        y: 200,
        content: '"Traveler... I\'ve been waiting for you. What brings you to these lands?"',
        nextNodeId: 'first_choice',
      },
      'first_choice': {
        id: 'first_choice',
        type: NODE_TYPE.PLAYER,
        content: '',
        x: 300,
        y: 300,
        choices: [
          {
            id: 'choice_treasure',
            text: 'I seek the legendary treasure.',
            nextNodeId: 'treasure_response',
            conditions: [
              { flag: 'reputation', operator: CONDITION_OPERATOR.GREATER_EQUAL, value: 0 },
            ],
          },
          {
            id: 'choice_knowledge',
            text: "I'm searching for ancient knowledge.",
            nextNodeId: 'knowledge_response',
            conditions: [
              { flag: 'reputation', operator: CONDITION_OPERATOR.GREATER_EQUAL, value: 0 },
            ],
          },
          {
            id: 'choice_high_rep',
            text: 'I am a hero of this land!',
            nextNodeId: 'high_rep_response',
            conditions: [
              { flag: 'reputation', operator: CONDITION_OPERATOR.GREATER_THAN, value: 50 },
            ],
          },
        ],
      },
      'treasure_response': {
        id: 'treasure_response',
        type: NODE_TYPE.NPC,
        characterId: 'stranger',
        speaker: 'Stranger', // Fallback
        x: 200,
        y: 450,
        content: '"Many have sought the same. Take this map—it shows the entrance to the catacombs."',
        nextNodeId: undefined,
      },
      'knowledge_response': {
        id: 'knowledge_response',
        type: NODE_TYPE.NPC,
        characterId: 'stranger',
        speaker: 'Stranger', // Fallback
        x: 400,
        y: 450,
        content: '"A seeker of truth... Take this tome. It contains the riddles you must solve."',
        nextNodeId: undefined,
      },
      'high_rep_response': {
        id: 'high_rep_response',
        type: NODE_TYPE.NPC,
        characterId: 'stranger',
        speaker: 'Stranger', // Fallback
        x: 500,
        y: 450,
        content: '"Ah, a hero! Your reputation precedes you. I have something special for you..."',
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
        type: NODE_TYPE.NPC,
        speaker: 'Narrator',
        x: 300,
        y: 50,
        content: 'You push open the heavy wooden door and enter the Rusty Dragon tavern.',
        nextNodeId: 'bartender_greet',
      },
      'bartender_greet': {
        id: 'bartender_greet',
        type: NODE_TYPE.NPC,
        characterId: 'bartender',
        speaker: 'Bartender', // Fallback
        x: 300,
        y: 150,
        content: '"Welcome, stranger! What can I get ya? We\'ve got ale, mead, or if you\'re looking for work, I might have something."',
        nextNodeId: 'tavern_choice',
      },
      'tavern_choice': {
        id: 'tavern_choice',
        type: NODE_TYPE.PLAYER,
        content: '',
        x: 300,
        y: 280,
        choices: [
          { id: 'order_ale', text: "I'll have an ale.", nextNodeId: 'drink_ale' },
          { id: 'ask_work', text: 'What kind of work?', nextNodeId: 'work_info' },
          { id: 'look_around', text: "I'll just look around.", nextNodeId: 'observe_tavern' },
          {
            id: 'vip_entrance',
            text: "I'm a VIP member.",
            nextNodeId: 'vip_response',
            conditions: [
              { flag: 'reputation', operator: CONDITION_OPERATOR.GREATER_THAN, value: 75 },
            ],
          },
        ],
      },
      'drink_ale': {
        id: 'drink_ale',
        type: NODE_TYPE.NPC,
        characterId: 'bartender',
        speaker: 'Bartender', // Fallback
        x: 100,
        y: 420,
        content: '"Coming right up!" He slides a frothy mug across the bar.',
        nextNodeId: undefined,
      },
      'work_info': {
        id: 'work_info',
        type: NODE_TYPE.NPC,
        characterId: 'bartender',
        speaker: 'Bartender', // Fallback
        x: 300,
        y: 420,
        content: '"Rats in the cellar. Big ones. I\'ll pay 10 gold if you clear \'em out."',
        nextNodeId: 'accept_quest',
      },
      'accept_quest': {
        id: 'accept_quest',
        type: NODE_TYPE.PLAYER,
        content: '',
        x: 300,
        y: 550,
        choices: [
          { id: 'accept', text: "I'll do it.", nextNodeId: 'quest_accepted' },
          { id: 'decline', text: 'Not interested.' },
        ],
      },
      'quest_accepted': {
        id: 'quest_accepted',
        type: NODE_TYPE.NPC,
        characterId: 'bartender',
        speaker: 'Bartender', // Fallback
        x: 300,
        y: 680,
        content: '"Great! The cellar door is in the back. Good luck!"',
        nextNodeId: undefined,
      },
      'observe_tavern': {
        id: 'observe_tavern',
        type: NODE_TYPE.NPC,
        characterId: 'narrator',
        speaker: 'Narrator', // Fallback
        x: 500,
        y: 420,
        content: 'You notice a hooded figure in the corner, watching you intently...',
        nextNodeId: undefined,
      },
      'vip_response': {
        id: 'vip_response',
        type: NODE_TYPE.NPC,
        characterId: 'bartender',
        speaker: 'Bartender', // Fallback
        x: 600,
        y: 420,
        content: '"Of course! Right this way to the VIP lounge. Your reputation grants you access."',
        nextNodeId: undefined,
      },
    },
  },
};

async function resolveDemoDialogue(dialogueId: string): Promise<DialogueTree> {
  const dialogue = demoDialogues[dialogueId];
  if (!dialogue) {
    throw new Error(`Demo resolver: unknown dialogueId \"${dialogueId}\"`);
  }
  return dialogue;
}

// Enhanced flag schema with reputation for demo examples
const demoFlagSchema: FlagSchema = {
  ...exampleFlagSchema,
  flags: [
    ...exampleFlagSchema.flags,
    {
      id: 'reputation',
      name: 'Reputation',
      type: FLAG_TYPE.STAT,
      description: 'Player reputation score',
      defaultValue: 0,
    },
  ],
};

const demoNarrativeThread: StoryThread = {
  id: 'demo-thread',
  title: 'Demo Narrative Thread',
  summary: 'A short encounter split into narrative pages.',
  type: NARRATIVE_ELEMENT.THREAD,
  acts: [
    {
      id: 'act-one',
      title: 'Act I',
      summary: 'The traveler meets a mysterious figure.',
      type: NARRATIVE_ELEMENT.ACT,
      chapters: [
        {
          id: 'chapter-one',
          title: 'Chapter 1',
          summary: 'Crossroads encounter.',
          type: NARRATIVE_ELEMENT.CHAPTER,
          pages: [
            {
              id: 'page-arrival',
              title: 'Arrival',
              summary: 'The stranger appears and asks a question.',
              dialogueId: 'mysterious-stranger',
              type: NARRATIVE_ELEMENT.PAGE,
            },
            {
              id: 'page-responses',
              title: 'Responses',
              summary: 'The traveler chooses a response.',
              dialogueId: 'mysterious-stranger',
              type: NARRATIVE_ELEMENT.PAGE,
            },
          ],
          storyletTemplates: [
            {
              id: 'storylet-whisper',
              title: 'Whispered Warning',
              summary: 'A spectral whisper hints at a hidden path.',
              dialogueId: 'mysterious-stranger',
              type: NARRATIVE_ELEMENT.STORYLET,
            },
            {
              id: 'storylet-shadow',
              title: 'Shadowy Observer',
              summary: 'A lurking shadow tests the traveler’s resolve.',
              dialogueId: 'mysterious-stranger',
              type: NARRATIVE_ELEMENT.STORYLET,
            },
          ],
          storyletPools: [
            {
              id: 'storylet-pool-crossroads',
              title: 'Crossroads Encounters',
              summary: 'Optional beats triggered at the crossroads.',
              selectionMode: STORYLET_SELECTION_MODE.WEIGHTED,
              members: [
                {
                  templateId: 'storylet-whisper',
                  weight: 3,
                },
                {
                  templateId: 'storylet-shadow',
                  weight: 1,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export default function DialogueForgeDemo() {
  const characters = getExampleCharacters();
  const initialDialogue = demoDialogues['mysterious-stranger'];

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="flex-1 w-full min-h-0">
        <DialogueForge
          initialDialogue={initialDialogue}
          initialThread={demoNarrativeThread}
          flagSchema={demoFlagSchema}
          characters={characters}
          resolveDialogue={resolveDemoDialogue}
          className="h-full"
          toolbarActions={<ThemeSwitcher />}
        />
      </div>
    </div>
  );
}
