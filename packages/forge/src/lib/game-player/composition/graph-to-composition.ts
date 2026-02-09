import type { ForgeGraphDoc, ForgeNode } from '@magicborn/forge/types/forge-graph';
import {
  COMPOSITION_CUE_TYPE,
  COMPOSITION_TRACK_TYPE,
  FORGE_COMPOSITION_SCHEMA,
  type CompositionBackgroundBinding,
  type CompositionCharacterBinding,
  type CompositionCue,
  type CompositionDiagnostic,
  type CompositionGraph,
  type CompositionGraphNode,
  type CompositionRuntimeDirective,
  type ForgeCompositionV1,
} from '@magicborn/shared/types/composition';
import { resolveStoryletDetourGraphs } from './storylet-detour-resolver';

export interface GraphToCompositionOptions {
  resolver?: (graphId: number) => Promise<ForgeGraphDoc | null>;
  resolveStorylets?: boolean;
  failOnMissingGraph?: boolean;
}

export interface GraphToCompositionResult {
  composition: ForgeCompositionV1;
  resolvedGraphIds: number[];
  diagnostics: CompositionDiagnostic[];
}

function mapRuntimeDirective(value: unknown): CompositionRuntimeDirective | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as CompositionRuntimeDirective;
  if (!candidate.type) return null;
  return {
    type: candidate.type,
    refId: candidate.refId,
    payload: candidate.payload,
    applyMode: candidate.applyMode,
    priority: candidate.priority,
  };
}

function mapGraphNode(nodeId: string, node: ForgeNode): CompositionGraphNode {
  return {
    id: nodeId,
    type: node.type ?? 'UNKNOWN',
    label: node.label,
    speaker: node.speaker,
    characterId: node.characterId,
    content: node.content,
    setFlags: node.setFlags ? [...node.setFlags] : undefined,
    defaultNextNodeId: node.defaultNextNodeId,
    choices: node.choices?.map((choice) => ({
      id: choice.id,
      text: choice.text,
      nextNodeId: choice.nextNodeId,
      conditions: choice.conditions?.map((condition) => ({
        flag: condition.flag,
        operator: condition.operator,
        value: condition.value as boolean | number | string | undefined,
      })),
      setFlags: choice.setFlags ? [...choice.setFlags] : undefined,
    })),
    conditionalBlocks: node.conditionalBlocks?.map((block) => ({
      id: block.id,
      type: block.type,
      condition: block.condition?.map((condition) => ({
        flag: condition.flag,
        operator: condition.operator,
        value: condition.value as boolean | number | string | undefined,
      })),
      speaker: block.speaker,
      characterId: block.characterId,
      content: block.content,
      nextNodeId: block.nextNodeId,
      setFlags: block.setFlags ? [...block.setFlags] : undefined,
    })),
    storyletCall: node.storyletCall
      ? {
          mode: node.storyletCall.mode,
          targetGraphId: node.storyletCall.targetGraphId,
          targetStartNodeId: node.storyletCall.targetStartNodeId,
          returnNodeId: node.storyletCall.returnNodeId,
          returnGraphId: node.storyletCall.returnGraphId,
        }
      : undefined,
    presentation: node.presentation
      ? {
          imageId: node.presentation.imageId,
          backgroundId: node.presentation.backgroundId,
          portraitId: node.presentation.portraitId,
        }
      : undefined,
    runtimeDirectives: node.runtimeDirectives
      ?.map((directive) => mapRuntimeDirective(directive))
      .filter((directive): directive is CompositionRuntimeDirective => Boolean(directive)),
  };
}

function buildGraphSnapshots(graphs: ForgeGraphDoc[]): CompositionGraph[] {
  return graphs.map((graph) => {
    const nodesById: Record<string, CompositionGraphNode> = {};
    const nodeOrder: string[] = [];

    for (const flowNode of graph.flow.nodes ?? []) {
      const nodeId = String(flowNode.id);
      nodeOrder.push(nodeId);
      nodesById[nodeId] = mapGraphNode(nodeId, (flowNode.data as ForgeNode) ?? {});
    }

    return {
      graphId: graph.id,
      kind: graph.kind,
      title: graph.title,
      startNodeId: graph.startNodeId,
      nodeOrder,
      nodesById,
      edges: (graph.flow.edges ?? []).map((edge) => ({
        id: String(edge.id),
        source: String(edge.source),
        target: String(edge.target),
        kind: edge.kind,
        label: edge.label,
      })),
    };
  });
}

function buildBindings(graphs: CompositionGraph[]) {
  const characterBindingById = new Map<string, CompositionCharacterBinding>();
  const backgroundBindingById = new Map<string, CompositionBackgroundBinding>();

  for (const graph of graphs) {
    for (const nodeId of graph.nodeOrder) {
      const node = graph.nodesById[nodeId];
      if (!node) continue;

      if (node.characterId && !characterBindingById.has(node.characterId)) {
        characterBindingById.set(node.characterId, {
          characterId: node.characterId,
          displayName: node.speaker ?? node.characterId,
          portraitId: node.presentation?.portraitId,
        });
      }

      if (node.presentation?.backgroundId) {
        const backgroundId = node.presentation.backgroundId;
        if (!backgroundBindingById.has(backgroundId)) {
          backgroundBindingById.set(backgroundId, {
            backgroundId,
            imageId: node.presentation.imageId,
          });
        }
      }
    }
  }

  return {
    characterBindings: [...characterBindingById.values()],
    backgroundBindings: [...backgroundBindingById.values()],
  };
}

function buildCues(graphs: CompositionGraph[]): {
  tracks: ForgeCompositionV1['tracks'];
  cues: CompositionCue[];
} {
  const systemTrackId = 'track-system';
  const dialogueTrackId = 'track-dialogue';
  const choiceTrackId = 'track-choice';
  const presentationTrackId = 'track-presentation';

  const cues: CompositionCue[] = [];
  const trackCueIds: Record<string, string[]> = {
    [systemTrackId]: [],
    [dialogueTrackId]: [],
    [choiceTrackId]: [],
    [presentationTrackId]: [],
  };
  let cursorMs = 0;
  let cueCounter = 0;

  const pushCue = (cue: Omit<CompositionCue, 'id'>) => {
    cueCounter += 1;
    const id = `cue-${cueCounter}`;
    cues.push({ ...cue, id });
    trackCueIds[cue.trackId].push(id);
  };

  for (const graph of graphs) {
    for (const nodeId of graph.nodeOrder) {
      const node = graph.nodesById[nodeId];
      if (!node) continue;

      pushCue({
        type: COMPOSITION_CUE_TYPE.ENTER_NODE,
        graphId: graph.graphId,
        nodeId,
        trackId: systemTrackId,
        timing: { atMs: cursorMs },
      });

      if (node.presentation?.backgroundId || node.presentation?.portraitId) {
        pushCue({
          type: COMPOSITION_CUE_TYPE.DIRECTIVE,
          graphId: graph.graphId,
          nodeId,
          trackId: presentationTrackId,
          timing: { atMs: cursorMs },
          animationHint: {
            transition: 'FADE',
          },
        });
      }

      if (node.setFlags?.length) {
        pushCue({
          type: COMPOSITION_CUE_TYPE.SET_VARIABLES,
          graphId: graph.graphId,
          nodeId,
          trackId: systemTrackId,
          timing: { atMs: cursorMs },
          setVariables: node.setFlags.map((flag) => ({
            name: flag,
            value: true,
          })),
        });
      }

      if (node.content && node.content.trim().length > 0) {
        pushCue({
          type: COMPOSITION_CUE_TYPE.LINE,
          graphId: graph.graphId,
          nodeId,
          trackId: dialogueTrackId,
          timing: { atMs: cursorMs, waitForInput: true },
          speaker: node.speaker,
          text: node.content,
        });
        cursorMs += 1;
      }

      if (node.conditionalBlocks?.length) {
        for (const block of node.conditionalBlocks) {
          if (block.content && block.content.trim().length > 0) {
            pushCue({
              type: COMPOSITION_CUE_TYPE.LINE,
              graphId: graph.graphId,
              nodeId,
              trackId: dialogueTrackId,
              timing: { atMs: cursorMs, waitForInput: true },
              speaker: block.speaker,
              text: block.content,
            });
            cursorMs += 1;
          }
          if (block.setFlags?.length) {
            pushCue({
              type: COMPOSITION_CUE_TYPE.SET_VARIABLES,
              graphId: graph.graphId,
              nodeId,
              trackId: systemTrackId,
              timing: { atMs: cursorMs },
              setVariables: block.setFlags.map((flag) => ({
                name: flag,
                value: true,
              })),
            });
          }
        }
      }

      if (node.choices?.length) {
        pushCue({
          type: COMPOSITION_CUE_TYPE.CHOICES,
          graphId: graph.graphId,
          nodeId,
          trackId: choiceTrackId,
          timing: { atMs: cursorMs, waitForInput: true },
          choices: node.choices,
        });
        cursorMs += 1;
      }

      if (node.type === 'END') {
        pushCue({
          type: COMPOSITION_CUE_TYPE.END,
          graphId: graph.graphId,
          nodeId,
          trackId: systemTrackId,
          timing: { atMs: cursorMs },
        });
      }
    }
  }

  return {
    tracks: [
      { id: systemTrackId, type: COMPOSITION_TRACK_TYPE.SYSTEM, cueIds: trackCueIds[systemTrackId] },
      { id: dialogueTrackId, type: COMPOSITION_TRACK_TYPE.DIALOGUE, cueIds: trackCueIds[dialogueTrackId] },
      { id: choiceTrackId, type: COMPOSITION_TRACK_TYPE.CHOICE, cueIds: trackCueIds[choiceTrackId] },
      { id: presentationTrackId, type: COMPOSITION_TRACK_TYPE.PRESENTATION, cueIds: trackCueIds[presentationTrackId] },
    ],
    cues,
  };
}

export async function graphToComposition(
  rootGraph: ForgeGraphDoc,
  options: GraphToCompositionOptions = {}
): Promise<GraphToCompositionResult> {
  const diagnostics: CompositionDiagnostic[] = [];

  let graphs: ForgeGraphDoc[] = [rootGraph];
  if (options.resolveStorylets && options.resolver) {
    const resolved = await resolveStoryletDetourGraphs(rootGraph, options.resolver, {
      failOnMissingGraph: options.failOnMissingGraph,
    });
    graphs = [...resolved.graphById.values()];
    diagnostics.push(...resolved.diagnostics);
  }

  const graphSnapshots = buildGraphSnapshots(graphs);
  const { characterBindings, backgroundBindings } = buildBindings(graphSnapshots);
  const { tracks, cues } = buildCues(graphSnapshots);

  const composition: ForgeCompositionV1 = {
    schema: FORGE_COMPOSITION_SCHEMA.V1,
    rootGraphId: rootGraph.id,
    entry: {
      graphId: rootGraph.id,
      nodeId: rootGraph.startNodeId,
    },
    resolvedGraphIds: graphs.map((graph) => graph.id),
    generatedAt: new Date().toISOString(),
    scenes: graphSnapshots.map((graph) => ({
      id: `scene-${graph.graphId}`,
      graphId: graph.graphId,
      title: graph.title,
      nodeIds: graph.nodeOrder,
    })),
    tracks,
    cues,
    graphs: graphSnapshots,
    characterBindings,
    backgroundBindings,
    diagnostics,
  };

  return {
    composition,
    resolvedGraphIds: composition.resolvedGraphIds,
    diagnostics,
  };
}
