import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import type { ForgeGraphDoc, ForgeGraphKind, ForgeReactFlowJson } from '@magicborn/forge/types/forge-graph';
import { graphToComposition } from '@magicborn/forge/lib/game-player/composition/graph-to-composition';
import { PAYLOAD_COLLECTIONS } from '@/payload/collections/enums';

export const dynamic = 'force-dynamic';

type RelationshipValue = number | { id?: number } | null | undefined;

type PayloadForgeGraph = {
  id: number;
  project: RelationshipValue;
  kind: string;
  title: string;
  startNodeId: string;
  endNodeIds: Array<{ nodeId: string; exitKey?: string | null }>;
  flow: unknown;
  compiledYarn?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type CompositionRequestBody = {
  rootGraphId?: number;
  gameState?: unknown;
  options?: {
    resolveStorylets?: boolean;
  };
};

function toNumber(value: RelationshipValue): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && typeof value.id === 'number') return value.id;
  throw new Error('Expected relationship to contain numeric id');
}

function mapPayloadGraph(doc: PayloadForgeGraph): ForgeGraphDoc {
  return {
    id: doc.id,
    project: toNumber(doc.project),
    kind: doc.kind as ForgeGraphKind,
    title: doc.title,
    startNodeId: doc.startNodeId,
    endNodeIds: (doc.endNodeIds ?? []).map((entry) => ({
      nodeId: entry.nodeId,
      exitKey: entry.exitKey ?? undefined,
    })),
    flow: doc.flow as ForgeReactFlowJson,
    compiledYarn: doc.compiledYarn ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function badRequest(code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, code, message, details },
    { status: 400 }
  );
}

export async function POST(request: Request) {
  let body: CompositionRequestBody;
  try {
    body = (await request.json()) as CompositionRequestBody;
  } catch {
    return badRequest('INVALID_JSON', 'Request body must be valid JSON');
  }

  if (!body || typeof body.rootGraphId !== 'number' || Number.isNaN(body.rootGraphId)) {
    return badRequest('INVALID_REQUEST', 'rootGraphId (number) is required');
  }

  const resolveStorylets = body.options?.resolveStorylets ?? true;

  try {
    const payload = await getPayload({ config });

    let rootDoc: PayloadForgeGraph | null = null;
    try {
      rootDoc = (await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
        id: body.rootGraphId,
        depth: 0,
      })) as PayloadForgeGraph;
    } catch {
      rootDoc = null;
    }

    if (!rootDoc) {
      return NextResponse.json(
        {
          ok: false,
          code: 'ROOT_GRAPH_NOT_FOUND',
          message: `Graph ${body.rootGraphId} was not found`,
        },
        { status: 404 }
      );
    }

    const rootGraph = mapPayloadGraph(rootDoc);
    const resolver = async (graphId: number): Promise<ForgeGraphDoc | null> => {
      try {
        const doc = (await payload.findByID({
          collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
          id: graphId,
          depth: 0,
        })) as PayloadForgeGraph;
        return mapPayloadGraph(doc);
      } catch {
        return null;
      }
    };

    const result = await graphToComposition(rootGraph, {
      resolver,
      resolveStorylets,
      failOnMissingGraph: true,
    });

    return NextResponse.json({
      ok: true,
      rootGraphId: body.rootGraphId,
      composition: result.composition,
      resolvedGraphIds: result.resolvedGraphIds,
      diagnostics: result.diagnostics,
    });
  } catch (error) {
    const code =
      (error as { code?: string } | null)?.code ?? 'COMPOSITION_BUILD_FAILED';
    const message =
      error instanceof Error ? error.message : 'Failed to generate composition';
    const status = code === 'MISSING_REFERENCED_GRAPH' ? 422 : 500;
    return NextResponse.json(
      {
        ok: false,
        code,
        message,
      },
      { status }
    );
  }
}
