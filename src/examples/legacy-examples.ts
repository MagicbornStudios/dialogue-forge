import { DialogueTree } from '../types';
import { FlagSchema } from '../types/flags';
import { FLAG_TYPE, FLAG_VALUE_TYPE, NODE_TYPE, CONDITION_OPERATOR } from '../types/constants';

/**
 * Legacy TypeScript examples
 * These are kept for backward compatibility while we migrate to Yarn format
 * TODO: Convert these to Yarn format and remove this file
 */

export const demoFlagSchemas: Record<string, FlagSchema> = {
  basic: {
    categories: ['quests', 'items', 'stats'],
    flags: [
      { id: 'quest_intro', name: 'Introduction Quest', type: FLAG_TYPE.QUEST, category: 'quests', valueType: FLAG_VALUE_TYPE.STRING },
      { id: 'item_key', name: 'Key', type: FLAG_TYPE.ITEM, category: 'items' },
      { id: 'stat_reputation', name: 'Reputation', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 0 },
    ]
  },
  
  rpg: {
    categories: ['quests', 'achievements', 'items', 'stats', 'titles'],
    flags: [
      { id: 'quest_dragon_slayer', name: 'Dragon Slayer Quest', type: FLAG_TYPE.QUEST, category: 'quests', valueType: FLAG_VALUE_TYPE.STRING },
      { id: 'quest_dragon_slayer_complete', name: 'Dragon Slayer Complete', type: FLAG_TYPE.QUEST, category: 'quests' },
      { id: 'quest_find_key', name: 'Find the Key', type: FLAG_TYPE.QUEST, category: 'quests', valueType: FLAG_VALUE_TYPE.STRING },
      { id: 'achievement_first_quest', name: 'First Quest', type: FLAG_TYPE.ACHIEVEMENT, category: 'achievements' },
      { id: 'achievement_dragon_slayer', name: 'Dragon Slayer', type: FLAG_TYPE.ACHIEVEMENT, category: 'achievements' },
      { id: 'achievement_hero', name: 'Hero', type: FLAG_TYPE.ACHIEVEMENT, category: 'achievements' },
      { id: 'item_ancient_key', name: 'Ancient Key', type: FLAG_TYPE.ITEM, category: 'items' },
      { id: 'item_map', name: 'Treasure Map', type: FLAG_TYPE.ITEM, category: 'items' },
      { id: 'item_sword', name: 'Legendary Sword', type: FLAG_TYPE.ITEM, category: 'items' },
      { id: 'stat_gold', name: 'Gold', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 0 },
      { id: 'stat_reputation', name: 'Reputation', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 0 },
      { id: 'stat_charisma', name: 'Charisma', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 10 },
      { id: 'title_hero', name: 'Hero', type: FLAG_TYPE.TITLE, category: 'titles' },
      { id: 'title_merchant', name: 'Merchant', type: FLAG_TYPE.TITLE, category: 'titles' },
      { id: 'dialogue_met_stranger', name: 'Met Stranger', type: FLAG_TYPE.DIALOGUE, category: 'dialogue' },
      { id: 'dialogue_hostile', name: 'Hostile Response', type: FLAG_TYPE.DIALOGUE, category: 'dialogue' },
    ]
  },
  
  conditional: {
    categories: ['quests', 'items', 'stats'],
    flags: [
      { id: 'quest_main', name: 'Main Quest', type: FLAG_TYPE.QUEST, category: 'quests', valueType: FLAG_VALUE_TYPE.STRING },
      { id: 'item_key', name: 'Key', type: FLAG_TYPE.ITEM, category: 'items' },
      { id: 'stat_gold', name: 'Gold', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 0 },
      { id: 'stat_reputation', name: 'Reputation', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 0 },
    ]
  },
  
  complex_conditional: {
    categories: ['quests', 'achievements', 'items', 'stats', 'titles', 'global', 'dialogue'],
    flags: [
      { id: 'quest_ancient_ruins', name: 'Ancient Ruins Quest', type: FLAG_TYPE.QUEST, category: 'quests', valueType: FLAG_VALUE_TYPE.STRING },
      { id: 'quest_ancient_ruins_complete', name: 'Ancient Ruins Complete', type: FLAG_TYPE.QUEST, category: 'quests' },
      { id: 'quest_treasure_hunt', name: 'Treasure Hunt', type: FLAG_TYPE.QUEST, category: 'quests', valueType: FLAG_VALUE_TYPE.STRING },
      { id: 'quest_treasure_hunt_complete', name: 'Treasure Hunt Complete', type: FLAG_TYPE.QUEST, category: 'quests' },
      { id: 'quest_dragon_slayer', name: 'Dragon Slayer Quest', type: FLAG_TYPE.QUEST, category: 'quests', valueType: FLAG_VALUE_TYPE.STRING },
      { id: 'achievement_explorer', name: 'Explorer', type: FLAG_TYPE.ACHIEVEMENT, category: 'achievements' },
      { id: 'achievement_rich', name: 'Rich', type: FLAG_TYPE.ACHIEVEMENT, category: 'achievements' },
      { id: 'achievement_hero', name: 'Hero', type: FLAG_TYPE.ACHIEVEMENT, category: 'achievements' },
      { id: 'achievement_diplomat', name: 'Diplomat', type: FLAG_TYPE.ACHIEVEMENT, category: 'achievements' },
      { id: 'item_ancient_key', name: 'Ancient Key', type: FLAG_TYPE.ITEM, category: 'items' },
      { id: 'item_treasure_map', name: 'Treasure Map', type: FLAG_TYPE.ITEM, category: 'items' },
      { id: 'item_legendary_sword', name: 'Legendary Sword', type: FLAG_TYPE.ITEM, category: 'items' },
      { id: 'item_gold_coin', name: 'Gold Coin', type: FLAG_TYPE.ITEM, category: 'items' },
      { id: 'stat_gold', name: 'Gold', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 0 },
      { id: 'stat_reputation', name: 'Reputation', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 0 },
      { id: 'stat_charisma', name: 'Charisma', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 10 },
      { id: 'stat_strength', name: 'Strength', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 10 },
      { id: 'stat_wisdom', name: 'Wisdom', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 10 },
      { id: 'title_hero', name: 'Hero', type: FLAG_TYPE.TITLE, category: 'titles' },
      { id: 'title_explorer', name: 'Explorer', type: FLAG_TYPE.TITLE, category: 'titles' },
      { id: 'title_merchant', name: 'Merchant', type: FLAG_TYPE.TITLE, category: 'titles' },
      { id: 'global_game_started', name: 'Game Started', type: FLAG_TYPE.GLOBAL, category: 'global' },
      { id: 'global_first_visit', name: 'First Visit', type: FLAG_TYPE.GLOBAL, category: 'global' },
      { id: 'global_difficulty', name: 'Difficulty', type: FLAG_TYPE.GLOBAL, category: 'global', valueType: FLAG_VALUE_TYPE.STRING },
      { id: 'dialogue_met_guard', name: 'Met Guard', type: FLAG_TYPE.DIALOGUE, category: 'dialogue' },
      { id: 'dialogue_hostile', name: 'Hostile Response', type: FLAG_TYPE.DIALOGUE, category: 'dialogue' },
      { id: 'dialogue_friendly', name: 'Friendly Response', type: FLAG_TYPE.DIALOGUE, category: 'dialogue' },
      { id: 'dialogue_seeks_knowledge', name: 'Seeks Knowledge', type: FLAG_TYPE.DIALOGUE, category: 'dialogue' },
      { id: 'dialogue_offered_bribe', name: 'Offered Bribe', type: FLAG_TYPE.DIALOGUE, category: 'dialogue' },
    ]
  }
};

export const exampleDialogues: Record<string, DialogueTree> = {
  basic: {
    id: 'basic-example',
    title: 'Basic Dialogue Example',
    startNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        type: NODE_TYPE.NPC,
        speaker: 'Merchant',
        content: 'Welcome to my shop! How can I help you?',
        nextNodeId: 'player_choice',
        x: 300,
        y: 100
      },
      player_choice: {
        id: 'player_choice',
        type: NODE_TYPE.PLAYER,
        content: '',
        choices: [
          {
            id: 'buy',
            text: 'I want to buy something',
            nextNodeId: 'shop',
            setFlags: ['dialogue_shopping']
          },
          {
            id: 'sell',
            text: 'I want to sell something',
            nextNodeId: 'sell',
          },
          {
            id: 'leave',
            text: 'Never mind',
            nextNodeId: 'goodbye'
          }
        ],
        x: 300,
        y: 250
      },
      shop: {
        id: 'shop',
        type: NODE_TYPE.NPC,
        speaker: 'Merchant',
        content: 'What would you like to buy?',
        x: 100,
        y: 400
      },
      sell: {
        id: 'sell',
        type: NODE_TYPE.NPC,
        speaker: 'Merchant',
        content: 'Show me what you have.',
        x: 300,
        y: 400
      },
      goodbye: {
        id: 'goodbye',
        type: NODE_TYPE.NPC,
        speaker: 'Merchant',
        content: 'Come back anytime!',
        x: 500,
        y: 400
      }
    }
  },
  
  conditional: {
    id: 'conditional-example',
    title: 'Conditional Dialogue Example',
    startNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        type: NODE_TYPE.NPC,
        speaker: 'Guard',
        content: 'Halt! Who goes there?',
        nextNodeId: 'check_reputation',
        x: 300,
        y: 100
      },
      check_reputation: {
        id: 'check_reputation',
        type: NODE_TYPE.PLAYER,
        content: '',
        choices: [
          {
            id: 'high_rep',
            text: 'I am a hero of this land!',
            nextNodeId: 'high_rep_response',
            conditions: [
              { flag: 'stat_reputation', operator: CONDITION_OPERATOR.GREATER_THAN, value: 50 }
            ]
          },
          {
            id: 'low_rep',
            text: 'Just a traveler...',
            nextNodeId: 'low_rep_response',
            conditions: [
              { flag: 'stat_reputation', operator: CONDITION_OPERATOR.LESS_EQUAL, value: 50 }
            ]
          },
          {
            id: 'has_key',
            text: 'I have the key!',
            nextNodeId: 'key_response',
            conditions: [
              { flag: 'item_key', operator: CONDITION_OPERATOR.IS_SET }
            ]
          }
        ],
        x: 300,
        y: 250
      },
      high_rep_response: {
        id: 'high_rep_response',
        type: NODE_TYPE.NPC,
        speaker: 'Guard',
        content: 'Hero! Please, come in. The city welcomes you.',
        setFlags: ['stat_reputation'],
        x: 100,
        y: 400
      },
      low_rep_response: {
        id: 'low_rep_response',
        type: NODE_TYPE.NPC,
        speaker: 'Guard',
        content: 'Hmm... you may pass, but watch yourself.',
        x: 300,
        y: 400
      },
      key_response: {
        id: 'key_response',
        type: NODE_TYPE.NPC,
        speaker: 'Guard',
        content: 'Ah, you have the key! Please enter.',
        x: 500,
        y: 400
      }
    }
  },
  
  quest_progression: {
    id: 'quest-progression-example',
    title: 'Quest Progression Example',
    startNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        type: NODE_TYPE.NPC,
        speaker: 'Quest Giver',
        content: 'I need your help! A dragon threatens our village.',
        nextNodeId: 'quest_offer',
        x: 300,
        y: 100
      },
      quest_offer: {
        id: 'quest_offer',
        type: NODE_TYPE.PLAYER,
        content: '',
        choices: [
          {
            id: 'accept',
            text: 'I will help you!',
            nextNodeId: 'quest_started',
            setFlags: ['quest_dragon_slayer']
          },
          {
            id: 'decline',
            text: 'I cannot help right now.',
            nextNodeId: 'quest_declined'
          }
        ],
        x: 300,
        y: 250
      },
      quest_started: {
        id: 'quest_started',
        type: NODE_TYPE.NPC,
        speaker: 'Quest Giver',
        content: 'Thank you! Here is a map to the dragon\'s lair.',
        setFlags: ['item_map', 'achievement_first_quest'],
        nextNodeId: 'quest_continue',
        x: 100,
        y: 400
      },
      quest_continue: {
        id: 'quest_continue',
        type: NODE_TYPE.PLAYER,
        content: '',
        choices: [
          {
            id: 'ask_details',
            text: 'Tell me more about the dragon',
            nextNodeId: 'dragon_info'
          },
          {
            id: 'leave',
            text: 'I will return when I have slain the dragon',
            nextNodeId: 'quest_end'
          }
        ],
        x: 100,
        y: 550
      },
      dragon_info: {
        id: 'dragon_info',
        type: NODE_TYPE.NPC,
        speaker: 'Quest Giver',
        content: 'The dragon is ancient and powerful. You will need the legendary sword to defeat it.',
        nextNodeId: 'quest_continue',
        x: 300,
        y: 550
      },
      quest_declined: {
        id: 'quest_declined',
        type: NODE_TYPE.NPC,
        speaker: 'Quest Giver',
        content: 'I understand. Return if you change your mind.',
        x: 500,
        y: 400
      },
      quest_end: {
        id: 'quest_end',
        type: NODE_TYPE.NPC,
        speaker: 'Narrator',
        content: 'You set off on your quest...\n\n— TO BE CONTINUED —',
        x: 100,
        y: 700
      }
    }
  },
  
  complex_conditional: {
    id: 'complex-conditional-example',
    title: 'Complex Conditional Example',
    startNodeId: 'guard_encounter',
    nodes: {
      guard_encounter: {
        id: 'guard_encounter',
        type: NODE_TYPE.NPC,
        speaker: 'Guard',
        content: 'Halt! Who goes there?',
        nextNodeId: 'player_response',
        setFlags: ['dialogue_met_guard'],
        x: 400,
        y: 100
      },
      player_response: {
        id: 'player_response',
        type: NODE_TYPE.PLAYER,
        content: '',
        choices: [
          {
            id: 'friendly',
            text: 'I mean no harm. I\'m just passing through.',
            nextNodeId: 'guard_friendly',
            setFlags: ['dialogue_friendly']
          },
          {
            id: 'hostile',
            text: 'None of your business!',
            nextNodeId: 'guard_hostile',
            setFlags: ['dialogue_hostile']
          },
          {
            id: 'bribe',
            text: 'Perhaps we can come to an arrangement?',
            nextNodeId: 'guard_bribe',
            conditions: [
              { flag: 'stat_gold', operator: CONDITION_OPERATOR.GREATER_THAN, value: 50 }
            ],
            setFlags: ['dialogue_offered_bribe']
          },
          {
            id: 'knowledge',
            text: 'I seek knowledge of the ancient ruins.',
            nextNodeId: 'guard_knowledge',
            conditions: [
              { flag: 'stat_wisdom', operator: CONDITION_OPERATOR.GREATER_EQUAL, value: 15 }
            ],
            setFlags: ['dialogue_seeks_knowledge']
          },
          {
            id: 'hero',
            text: 'I am a hero on a quest!',
            nextNodeId: 'guard_hero',
            conditions: [
              { flag: 'title_hero', operator: CONDITION_OPERATOR.IS_SET }
            ]
          }
        ],
        x: 400,
        y: 250
      },
      guard_friendly: {
        id: 'guard_friendly',
        type: NODE_TYPE.NPC,
        speaker: 'Guard',
        content: 'Very well. You may pass, but be careful. The ruins ahead are dangerous.',
        nextNodeId: 'reputation_check',
        x: 200,
        y: 400
      },
      guard_hostile: {
        id: 'guard_hostile',
        type: NODE_TYPE.NPC,
        speaker: 'Guard',
        content: 'That\'s not a good attitude. I\'ll be watching you.',
        nextNodeId: 'reputation_check',
        setFlags: ['stat_reputation'],
        x: 600,
        y: 400
      },
      guard_bribe: {
        id: 'guard_bribe',
        type: NODE_TYPE.NPC,
        speaker: 'Guard',
        content: 'Ah, a person of culture! Very well, I\'ll look the other way... for now.',
        nextNodeId: 'reputation_check',
        setFlags: ['stat_gold'],
        x: 400,
        y: 400
      },
      guard_knowledge: {
        id: 'guard_knowledge',
        type: NODE_TYPE.NPC,
        speaker: 'Guard',
        content: 'The ancient ruins? You must be a scholar. I can tell you about them, but it will cost you.',
        nextNodeId: 'knowledge_choice',
        x: 200,
        y: 400
      },
      guard_hero: {
        id: 'guard_hero',
        type: NODE_TYPE.NPC,
        speaker: 'Guard',
        content: 'A hero! We\'ve been waiting for someone like you. Please, come with me to meet the captain.',
        nextNodeId: 'hero_path',
        setFlags: ['quest_dragon_slayer'],
        x: 800,
        y: 400
      },
      knowledge_choice: {
        id: 'knowledge_choice',
        type: NODE_TYPE.PLAYER,
        content: '',
        choices: [
          {
            id: 'pay_knowledge',
            text: 'I\'ll pay for the information.',
            nextNodeId: 'knowledge_paid',
            conditions: [
              { flag: 'stat_gold', operator: CONDITION_OPERATOR.GREATER_EQUAL, value: 100 }
            ],
            setFlags: ['stat_gold', 'item_treasure_map']
          },
          {
            id: 'decline_knowledge',
            text: 'Never mind, I\'ll find out myself.',
            nextNodeId: 'reputation_check'
          }
        ],
        x: 200,
        y: 550
      },
      knowledge_paid: {
        id: 'knowledge_paid',
        type: NODE_TYPE.NPC,
        speaker: 'Guard',
        content: 'The ruins are to the east. Here\'s a map. Be careful - many have entered, few have returned.',
        nextNodeId: 'reputation_check',
        x: 100,
        y: 700
      },
      hero_path: {
        id: 'hero_path',
        type: NODE_TYPE.CONDITIONAL,
        content: '',
        conditionalBlocks: [
          {
            id: 'hero_if_quest',
            type: 'if',
            condition: [
              { flag: 'quest_dragon_slayer', operator: CONDITION_OPERATOR.IS_SET }
            ],
            content: 'Captain: We need your help! A dragon has been terrorizing our lands.',
            speaker: 'Captain',
            nextNodeId: 'dragon_quest_start'
          },
          {
            id: 'hero_elseif_achievement',
            type: 'elseif',
            condition: [
              { flag: 'achievement_hero', operator: CONDITION_OPERATOR.IS_SET }
            ],
            content: 'Captain: Ah, the hero returns! We have a new mission for you.',
            speaker: 'Captain',
            nextNodeId: 'new_mission'
          },
          {
            id: 'hero_else',
            type: 'else',
            content: 'Captain: Welcome, traveler. Perhaps you can help us with a problem.',
            speaker: 'Captain',
            nextNodeId: 'general_help'
          }
        ],
        x: 800,
        y: 550
      },
      dragon_quest_start: {
        id: 'dragon_quest_start',
        type: NODE_TYPE.PLAYER,
        content: '',
        choices: [
          {
            id: 'accept_dragon',
            text: 'I accept the quest!',
            nextNodeId: 'dragon_quest_accepted',
            setFlags: ['quest_dragon_slayer', 'achievement_hero']
          },
          {
            id: 'decline_dragon',
            text: 'I need to prepare first.',
            nextNodeId: 'dragon_quest_declined'
          },
          {
            id: 'ask_reward',
            text: 'What\'s the reward?',
            nextNodeId: 'dragon_reward_info',
            conditions: [
              { flag: 'stat_gold', operator: CONDITION_OPERATOR.LESS_THAN, value: 1000 }
            ]
          }
        ],
        x: 800,
        y: 700
      },
      dragon_quest_accepted: {
        id: 'dragon_quest_accepted',
        type: NODE_TYPE.NPC,
        speaker: 'Captain',
        content: 'Excellent! The dragon\'s lair is in the mountains. You\'ll need the legendary sword to defeat it.',
        nextNodeId: 'reputation_check',
        setFlags: ['quest_dragon_slayer', 'title_hero'],
        x: 600,
        y: 850
      },
      dragon_quest_declined: {
        id: 'dragon_quest_declined',
        type: NODE_TYPE.NPC,
        speaker: 'Captain',
        content: 'Very well. Return when you\'re ready. We\'ll be waiting.',
        nextNodeId: 'reputation_check',
        x: 1000,
        y: 850
      },
      dragon_reward_info: {
        id: 'dragon_reward_info',
        type: NODE_TYPE.NPC,
        speaker: 'Captain',
        content: 'The reward is 10,000 gold pieces and the title of "Dragon Slayer".',
        nextNodeId: 'dragon_quest_start',
        x: 800,
        y: 850
      },
      new_mission: {
        id: 'new_mission',
        type: NODE_TYPE.NPC,
        speaker: 'Captain',
        content: 'We need you to investigate the ancient ruins. Strange things have been happening there.',
        nextNodeId: 'ruins_quest_choice',
        setFlags: ['quest_ancient_ruins'],
        x: 1000,
        y: 700
      },
      general_help: {
        id: 'general_help',
        type: NODE_TYPE.PLAYER,
        content: '',
        choices: [
          {
            id: 'help_yes',
            text: 'I\'ll help!',
            nextNodeId: 'reputation_check',
            setFlags: ['stat_reputation']
          },
          {
            id: 'help_no',
            text: 'I\'m just passing through.',
            nextNodeId: 'reputation_check'
          }
        ],
        x: 1000,
        y: 550
      },
      ruins_quest_choice: {
        id: 'ruins_quest_choice',
        type: NODE_TYPE.PLAYER,
        content: '',
        choices: [
          {
            id: 'accept_ruins',
            text: 'I\'ll investigate the ruins.',
            nextNodeId: 'ruins_conditional',
            setFlags: ['quest_ancient_ruins']
          },
          {
            id: 'decline_ruins',
            text: 'I have other priorities.',
            nextNodeId: 'reputation_check'
          }
        ],
        x: 1000,
        y: 850
      },
      ruins_conditional: {
        id: 'ruins_conditional',
        type: NODE_TYPE.CONDITIONAL,
        content: '',
        conditionalBlocks: [
          {
            id: 'ruins_if_key',
            type: 'if',
            condition: [
              { flag: 'item_ancient_key', operator: CONDITION_OPERATOR.IS_SET }
            ],
            content: 'You use the ancient key to unlock the ruins entrance. Inside, you find a treasure chest!',
            nextNodeId: 'ruins_treasure'
          },
          {
            id: 'ruins_elseif_strength',
            type: 'elseif',
            condition: [
              { flag: 'stat_strength', operator: CONDITION_OPERATOR.GREATER_EQUAL, value: 20 }
            ],
            content: 'You force the door open with your strength. The entrance creaks open.',
            nextNodeId: 'ruins_inside'
          },
          {
            id: 'ruins_elseif_charisma',
            type: 'elseif',
            condition: [
              { flag: 'stat_charisma', operator: CONDITION_OPERATOR.GREATER_EQUAL, value: 18 }
            ],
            content: 'You find a hidden mechanism and convince it to open through clever words.',
            nextNodeId: 'ruins_inside'
          },
          {
            id: 'ruins_else',
            type: 'else',
            content: 'The ruins entrance is sealed. You cannot enter without a key or sufficient strength.',
            nextNodeId: 'reputation_check'
          }
        ],
        x: 1000,
        y: 1000
      },
      ruins_treasure: {
        id: 'ruins_treasure',
        type: NODE_TYPE.PLAYER,
        content: '',
        choices: [
          {
            id: 'open_treasure',
            text: 'Open the treasure chest',
            nextNodeId: 'treasure_reward',
            setFlags: ['quest_ancient_ruins_complete', 'achievement_explorer']
          },
          {
            id: 'leave_treasure',
            text: 'Leave it for now',
            nextNodeId: 'reputation_check'
          }
        ],
        x: 800,
        y: 1150
      },
      treasure_reward: {
        id: 'treasure_reward',
        type: NODE_TYPE.CONDITIONAL,
        content: '',
        conditionalBlocks: [
          {
            id: 'treasure_if_gold',
            type: 'if',
            condition: [
              { flag: 'stat_gold', operator: CONDITION_OPERATOR.LESS_THAN, value: 500 }
            ],
            content: 'You find 1000 gold pieces inside! This is a fortune!',
            nextNodeId: 'treasure_gold_reward'
          },
          {
            id: 'treasure_else',
            type: 'else',
            content: 'You find a legendary sword! This will be useful against the dragon.',
            nextNodeId: 'treasure_sword_reward'
          }
        ],
        x: 600,
        y: 1300
      },
      treasure_gold_reward: {
        id: 'treasure_gold_reward',
        type: NODE_TYPE.NPC,
        speaker: 'Narrator',
        content: 'You gain 1000 gold pieces and the "Rich" achievement!',
        nextNodeId: 'reputation_check',
        setFlags: ['stat_gold', 'achievement_rich'],
        x: 400,
        y: 1450
      },
      treasure_sword_reward: {
        id: 'treasure_sword_reward',
        type: NODE_TYPE.NPC,
        speaker: 'Narrator',
        content: 'You obtain the legendary sword! This will be useful against the dragon.',
        nextNodeId: 'reputation_check',
        setFlags: ['item_legendary_sword'],
        x: 800,
        y: 1450
      },
      ruins_inside: {
        id: 'ruins_inside',
        type: NODE_TYPE.PLAYER,
        content: '',
        choices: [
          {
            id: 'explore_ruins',
            text: 'Explore the ruins',
            nextNodeId: 'ruins_exploration',
            setFlags: ['achievement_explorer']
          },
          {
            id: 'search_key',
            text: 'Search for a key',
            nextNodeId: 'key_found',
            conditions: [
              { flag: 'stat_wisdom', operator: CONDITION_OPERATOR.GREATER_EQUAL, value: 15 }
            ]
          },
          {
            id: 'leave_ruins',
            text: 'Leave the ruins',
            nextNodeId: 'reputation_check'
          }
        ],
        x: 1200,
        y: 1150
      },
      ruins_exploration: {
        id: 'ruins_exploration',
        type: NODE_TYPE.NPC,
        speaker: 'Narrator',
        content: 'You explore the ancient ruins and discover ancient texts. Your wisdom increases.',
        nextNodeId: 'reputation_check',
        setFlags: ['stat_wisdom', 'quest_ancient_ruins_complete'],
        x: 1200,
        y: 1300
      },
      key_found: {
        id: 'key_found',
        type: NODE_TYPE.NPC,
        speaker: 'Narrator',
        content: 'Your wisdom guides you to a hidden alcove. You find an ancient key!',
        nextNodeId: 'reputation_check',
        setFlags: ['item_ancient_key'],
        x: 1400,
        y: 1300
      },
      reputation_check: {
        id: 'reputation_check',
        type: NODE_TYPE.CONDITIONAL,
        content: '',
        conditionalBlocks: [
          {
            id: 'rep_if_high',
            type: 'if',
            condition: [
              { flag: 'stat_reputation', operator: CONDITION_OPERATOR.GREATER_EQUAL, value: 50 }
            ],
            content: 'Your reputation precedes you. People recognize you as a hero and treat you with respect.',
            nextNodeId: 'ending'
          },
          {
            id: 'rep_elseif_medium',
            type: 'elseif',
            condition: [
              { flag: 'stat_reputation', operator: CONDITION_OPERATOR.GREATER_EQUAL, value: 20 }
            ],
            content: 'You have a decent reputation. Some people know of your deeds.',
            nextNodeId: 'ending'
          },
          {
            id: 'rep_else',
            type: 'else',
            content: 'You are relatively unknown. Your journey is just beginning.',
            nextNodeId: 'ending'
          }
        ],
        x: 400,
        y: 1000
      },
      ending: {
        id: 'ending',
        type: NODE_TYPE.PLAYER,
        content: '',
        choices: [
          {
            id: 'continue',
            text: 'Continue your adventure',
            nextNodeId: 'final_message'
          },
          {
            id: 'rest',
            text: 'Take a rest',
            nextNodeId: 'final_message',
            conditions: [
              { flag: 'stat_strength', operator: CONDITION_OPERATOR.LESS_THAN, value: 15 }
            ]
          }
        ],
        x: 400,
        y: 1150
      },
      final_message: {
        id: 'final_message',
        type: NODE_TYPE.NPC,
        speaker: 'Narrator',
        content: 'Your adventure continues...\n\nThis example demonstrates:\n- Conditional nodes with if/elseif/else\n- Conditional choices on player nodes\n- Multiple flag types (quest, achievement, item, stat, title, global, dialogue)\n- Complex conditions with various operators\n- Flag setting throughout the dialogue flow',
        x: 400,
        y: 1300
      }
    }
  }
};




