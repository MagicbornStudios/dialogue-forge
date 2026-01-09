import type { Payload } from 'payload'

/**
 * Seed the database with admin user and demo data
 */
export async function seedAdmin(payload: Payload): Promise<void> {
  const adminEmail = 'admin@local.com'
  const adminPassword = 'changethis'

  try {
    // ============================
    // 1. Create Admin User
    // ============================
    const existingUsers = await payload.find({
      collection: 'users',
      where: { email: { equals: adminEmail } },
      limit: 1,
    })

    if (existingUsers.docs.length === 0) {
      await payload.create({
        collection: 'users',
        data: {
          email: adminEmail,
          password: adminPassword,
          name: 'Admin',
        },
      })
      console.log('✅ Admin user created')
    }

    // ============================
    // 2. Create Demo Project
    // ============================
    let project = await payload.find({
      collection: 'projects',
      where: { slug: { equals: 'demo' } },
      limit: 1,
    }).then(r => r.docs[0])

    if (!project) {
      project = await payload.create({
        collection: 'projects',
        data: {
          slug: 'demo',
          name: 'Demo Project',
          description: 'Default demo project for Dialogue Forge',
        },
      })
      console.log('✅ Demo project created')
    }

    const projectId = project.id

    // ============================
    // 3. Create Characters
    // ============================
    const charactersData = [
      { characterKey: 'stranger', name: 'Mysterious Stranger', meta: { role: 'npc' } },
      { characterKey: 'bartender', name: 'Bartender', meta: { role: 'npc' } },
      { characterKey: 'narrator', name: 'Narrator', meta: { role: 'narrator' } },
      { characterKey: 'player', name: 'Player', meta: { role: 'player' } },
    ]

    for (const char of charactersData) {
      const existing = await payload.find({
        collection: 'characters',
        where: {
          and: [
            { project: { equals: projectId } },
            { characterKey: { equals: char.characterKey } },
          ],
        },
        limit: 1,
      })

      if (existing.docs.length === 0) {
        await payload.create({
          collection: 'characters',
          data: { project: projectId, ...char },
        })
      }
    }
    console.log('✅ Characters seeded')

    // ============================
    // 4. Create Flag Schema
    // ============================
    const existingSchema = await payload.find({
      collection: 'flag-schemas',
      where: {
        and: [
          { project: { equals: projectId } },
          { schemaId: { equals: 'demo-flags' } },
        ],
      },
      limit: 1,
    })

    if (existingSchema.docs.length === 0) {
      await payload.create({
        collection: 'flag-schemas',
        data: {
          project: projectId,
          schemaId: 'demo-flags',
          schema: {
            categories: ['quests', 'stats', 'achievements'],
            flags: [
              {
                id: 'reputation',
                name: 'Reputation',
                type: 'stat',
                category: 'stats',
                description: 'Player reputation score',
                defaultValue: 0,
              },
              {
                id: 'met_stranger',
                name: 'Met Stranger',
                type: 'dialogue',
                category: 'quests',
                description: 'Has met the mysterious stranger',
                defaultValue: false,
              },
              {
                id: 'has_map',
                name: 'Has Map',
                type: 'item',
                category: 'quests',
                description: 'Has the treasure map',
                defaultValue: false,
              },
              {
                id: 'has_tome',
                name: 'Has Tome',
                type: 'item',
                category: 'quests',
                description: 'Has the ancient tome',
                defaultValue: false,
              },
            ],
          },
        },
      })
      console.log('✅ Flag schema seeded')
    }

    // ============================
    // 5. Create Dialogues
    // ============================
    const dialoguesData = [
      {
        dialogueId: 'mysterious-stranger',
        title: 'Demo: The Mysterious Stranger',
        tree: {
          id: 'mysterious-stranger',
          title: 'Demo: The Mysterious Stranger',
          startNodeId: 'start',
          nodes: {
            start: {
              id: 'start',
              type: 'npc',
              characterId: 'stranger',
              speaker: 'Stranger',
              x: 300,
              y: 100,
              content: 'You find yourself at a crossroads. A cloaked figure emerges from the shadows.',
              nextNodeId: 'greeting',
            },
            greeting: {
              id: 'greeting',
              type: 'npc',
              characterId: 'stranger',
              speaker: 'Stranger',
              x: 300,
              y: 200,
              content: '"Traveler... I\'ve been waiting for you. What brings you to these lands?"',
              nextNodeId: 'first_choice',
            },
            first_choice: {
              id: 'first_choice',
              type: 'player',
              content: '',
              x: 300,
              y: 300,
              choices: [
                {
                  id: 'choice_treasure',
                  text: 'I seek the legendary treasure.',
                  nextNodeId: 'treasure_response',
                  conditions: [{ flag: 'reputation', operator: 'gte', value: 0 }],
                },
                {
                  id: 'choice_knowledge',
                  text: "I'm searching for ancient knowledge.",
                  nextNodeId: 'knowledge_response',
                  conditions: [{ flag: 'reputation', operator: 'gte', value: 0 }],
                },
                {
                  id: 'choice_high_rep',
                  text: 'I am a hero of this land!',
                  nextNodeId: 'high_rep_response',
                  conditions: [{ flag: 'reputation', operator: 'gt', value: 50 }],
                },
              ],
            },
            treasure_response: {
              id: 'treasure_response',
              type: 'npc',
              characterId: 'stranger',
              speaker: 'Stranger',
              x: 200,
              y: 450,
              content: '"Many have sought the same. Take this map—it shows the entrance to the catacombs."',
              nextNodeId: undefined,
              setFlags: ['has_map'],
            },
            knowledge_response: {
              id: 'knowledge_response',
              type: 'npc',
              characterId: 'stranger',
              speaker: 'Stranger',
              x: 400,
              y: 450,
              content: '"A seeker of truth... Take this tome. It contains the riddles you must solve."',
              nextNodeId: undefined,
              setFlags: ['has_tome'],
            },
            high_rep_response: {
              id: 'high_rep_response',
              type: 'npc',
              characterId: 'stranger',
              speaker: 'Stranger',
              x: 500,
              y: 450,
              content: '"Ah, a hero! Your reputation precedes you. I have something special for you..."',
              nextNodeId: undefined,
              setFlags: ['reputation'],
            },
          },
        },
      },
      {
        dialogueId: 'tavern-quest',
        title: 'Demo: Tavern Quest',
        tree: {
          id: 'tavern-quest',
          title: 'Demo: Tavern Quest',
          startNodeId: 'enter_tavern',
          nodes: {
            enter_tavern: {
              id: 'enter_tavern',
              type: 'npc',
              speaker: 'Narrator',
              x: 300,
              y: 50,
              content: 'You push open the heavy wooden door and enter the Rusty Dragon tavern.',
              nextNodeId: 'bartender_greet',
            },
            bartender_greet: {
              id: 'bartender_greet',
              type: 'npc',
              characterId: 'bartender',
              speaker: 'Bartender',
              x: 300,
              y: 150,
              content: '"Welcome, stranger! What can I get ya? We\'ve got ale, mead, or if you\'re looking for work, I might have something."',
              nextNodeId: 'tavern_choice',
            },
            tavern_choice: {
              id: 'tavern_choice',
              type: 'player',
              content: '',
              x: 300,
              y: 280,
              choices: [
                { id: 'order_ale', text: "I'll have an ale.", nextNodeId: 'drink_ale' },
                { id: 'ask_work', text: 'What kind of work?', nextNodeId: 'work_info' },
                { id: 'look_around', text: "I'll just look around.", nextNodeId: 'observe_tavern' },
              ],
            },
            drink_ale: {
              id: 'drink_ale',
              type: 'npc',
              characterId: 'bartender',
              speaker: 'Bartender',
              x: 100,
              y: 420,
              content: '"Coming right up!" He slides a frothy mug across the bar.',
              nextNodeId: undefined,
            },
            work_info: {
              id: 'work_info',
              type: 'npc',
              characterId: 'bartender',
              speaker: 'Bartender',
              x: 300,
              y: 420,
              content: '"Rats in the cellar. Big ones. I\'ll pay 10 gold if you clear \'em out."',
              nextNodeId: undefined,
            },
            observe_tavern: {
              id: 'observe_tavern',
              type: 'npc',
              characterId: 'narrator',
              speaker: 'Narrator',
              x: 500,
              y: 420,
              content: 'You notice a hooded figure in the corner, watching you intently...',
              nextNodeId: undefined,
            },
          },
        },
      },
    ]

    const dialogueIds: Record<string, string | number> = {}

    for (const dlg of dialoguesData) {
      const existing = await payload.find({
        collection: 'dialogues',
        where: {
          and: [
            { project: { equals: projectId } },
            { dialogueId: { equals: dlg.dialogueId } },
          ],
        },
        limit: 1,
      })

      if (existing.docs.length === 0) {
        const created = await payload.create({
          collection: 'dialogues',
          data: {
            project: projectId,
            dialogueId: dlg.dialogueId,
            title: dlg.title,
            tree: dlg.tree,
            startNodeId: dlg.tree.startNodeId,
          },
        })
        dialogueIds[dlg.dialogueId] = created.id
      } else {
        dialogueIds[dlg.dialogueId] = existing.docs[0].id
      }
    }
    console.log('✅ Dialogues seeded')

    // ============================
    // 6. Create Thread/Acts/Chapters/Pages
    // ============================
    let thread = await payload.find({
      collection: 'threads',
      where: {
        and: [
          { project: { equals: projectId } },
          { threadId: { equals: 'demo-thread' } },
        ],
      },
      limit: 1,
    }).then(r => r.docs[0])

    if (!thread) {
      thread = await payload.create({
        collection: 'threads',
        data: {
          project: projectId,
          threadId: 'demo-thread',
          title: 'Demo Narrative Thread',
          summary: 'A short encounter split into narrative pages.',
        },
      })

      // Create Act
      const act = await payload.create({
        collection: 'acts',
        data: {
          project: projectId,
          thread: thread.id,
          actId: 'act-one',
          title: 'Act I',
          summary: 'The traveler meets a mysterious figure.',
          order: 0,
        },
      })

      // Create Chapter
      const chapter = await payload.create({
        collection: 'chapters',
        data: {
          project: projectId,
          act: act.id,
          chapterId: 'chapter-one',
          title: 'Chapter 1',
          summary: 'Crossroads encounter.',
          order: 0,
        },
      })

      // Create Pages
      await payload.create({
        collection: 'pages',
        data: {
          project: projectId,
          chapter: chapter.id,
          pageId: 'page-arrival',
          title: 'Arrival',
          summary: 'The stranger appears and asks a question.',
          dialogue: dialogueIds['mysterious-stranger'],
          dialogueId: 'mysterious-stranger',
          order: 0,
        },
      })

      await payload.create({
        collection: 'pages',
        data: {
          project: projectId,
          chapter: chapter.id,
          pageId: 'page-tavern',
          title: 'The Tavern',
          summary: 'Visit the local tavern.',
          dialogue: dialogueIds['tavern-quest'],
          dialogueId: 'tavern-quest',
          order: 1,
        },
      })

      console.log('✅ Thread/Acts/Chapters/Pages seeded')
    }

    // ============================
    // 7. Create Storylet Templates
    // ============================
    const storyletData = [
      {
        templateId: 'storylet-whisper',
        title: 'Whispered Warning',
        summary: 'A spectral whisper hints at a hidden path.',
        dialogueId: 'mysterious-stranger',
        defaultWeight: 3,
      },
      {
        templateId: 'storylet-shadow',
        title: 'Shadowy Observer',
        summary: 'A lurking shadow tests the traveler\'s resolve.',
        dialogueId: 'mysterious-stranger',
        defaultWeight: 1,
      },
    ]

    const templateIds: Record<string, string | number> = {}

    for (const st of storyletData) {
      const existing = await payload.find({
        collection: 'storylet-templates',
        where: {
          and: [
            { project: { equals: projectId } },
            { templateId: { equals: st.templateId } },
          ],
        },
        limit: 1,
      })

      if (existing.docs.length === 0) {
        const created = await payload.create({
          collection: 'storylet-templates',
          data: {
            project: projectId,
            templateId: st.templateId,
            title: st.title,
            summary: st.summary,
            dialogue: dialogueIds[st.dialogueId],
            defaultWeight: st.defaultWeight,
          },
        })
        templateIds[st.templateId] = created.id
      } else {
        templateIds[st.templateId] = existing.docs[0].id
      }
    }
    console.log('✅ Storylet templates seeded')

    // ============================
    // 8. Create Storylet Pool
    // ============================
    const existingPool = await payload.find({
      collection: 'storylet-pools',
      where: {
        and: [
          { project: { equals: projectId } },
          { poolId: { equals: 'crossroads-encounters' } },
        ],
      },
      limit: 1,
    })

    if (existingPool.docs.length === 0) {
      await payload.create({
        collection: 'storylet-pools',
        data: {
          project: projectId,
          poolId: 'crossroads-encounters',
          title: 'Crossroads Encounters',
          summary: 'Optional beats triggered at the crossroads.',
          selectionMode: 'WEIGHTED',
          members: [
            { template: templateIds['storylet-whisper'], weight: 3 },
            { template: templateIds['storylet-shadow'], weight: 1 },
          ],
        },
      })
      console.log('✅ Storylet pool seeded')
    }

    // ============================
    // 9. Create Authored Game State
    // ============================
    const existingGameState = await payload.find({
      collection: 'game-states',
      where: {
        and: [
          { project: { equals: projectId } },
          { type: { equals: 'AUTHORED' } },
        ],
      },
      limit: 1,
    })

    if (existingGameState.docs.length === 0) {
      await payload.create({
        collection: 'game-states',
        data: {
          project: projectId,
          type: 'AUTHORED',
          state: {
            player: {
              name: 'Hero',
              stats: { health: 100, mana: 50 },
            },
            flags: {
              reputation: 0,
              met_stranger: false,
              has_map: false,
              has_tome: false,
            },
          },
        },
      })
      console.log('✅ Authored game state seeded')
    }

    console.log('🎉 All demo data seeded successfully!')
  } catch (error) {
    console.error('❌ Failed to seed data:', error)
    throw error
  }
}
