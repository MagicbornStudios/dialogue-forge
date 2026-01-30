'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Users } from 'lucide-react';

import type { RelationshipFlow, RelationshipFlowNode, RelationshipFlowEdge } from '@/characters/types';
import type { CharacterDoc, CharacterWorkspaceAdapter } from '@/characters/types';

import { CharacterSidebar } from './CharacterSidebar';
import { RelationshipLabelDialog } from './RelationshipLabelDialog';
import { CharacterDetailsPanel } from './CharacterDetailsPanel';
import { ActiveCharacterPanel } from './ActiveCharacterPanel';

type JointModule = typeof import('jointjs');

export interface RelationshipGraphEditorRef {
  getJointGraphJson(): object | null;
  getRelationshipFlow(): RelationshipFlow | null;
}

interface RelationshipGraphEditorProps {
  graph: RelationshipFlow;
  activeCharacterId: string; // Can be empty string when no character selected
  characters: CharacterDoc[];
  onGraphChange: (graph: RelationshipFlow) => void;
  onCharacterSelect?: (characterId: string) => void;
  onCreateCharacter?: () => void;
  onCharacterUpdate?: (
    characterId: string,
    updates: { name?: string; description?: string; imageUrl?: string; avatarId?: string | null }
  ) => Promise<void>;
  dataAdapter?: CharacterWorkspaceAdapter;
}

function clampStr(s: string, max: number) {
  if (!s) return '';
  return s.length <= max ? s : `${s.slice(0, max)}`;
}

function getCharName(characters: CharacterDoc[], characterId: string) {
  return characters.find(c => c.id === characterId)?.name ?? characterId;
}

function normalizeFlow(flow: RelationshipFlow): RelationshipFlow {
  // Ensure no duplicate nodes/edges and drop edges that reference missing nodes.
  const nodeMap = new Map<string, RelationshipFlowNode>();
  for (const n of flow.nodes ?? []) nodeMap.set(n.id, n);

  const nodes = Array.from(nodeMap.values());

  const nodeIds = new Set(nodes.map(n => n.id));

  const edgeMap = new Map<string, RelationshipFlowEdge>();
  for (const e of flow.edges ?? []) {
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) continue;
    edgeMap.set(e.id, e);
  }

  const edges = Array.from(edgeMap.values());
  return { nodes, edges };
}

const RelationshipGraphEditor = forwardRef<RelationshipGraphEditorRef, RelationshipGraphEditorProps>(
  function RelationshipGraphEditor(
    {
      graph,
      activeCharacterId,
      characters,
      onGraphChange,
      onCharacterSelect,
      onCreateCharacter,
      onCharacterUpdate,
      dataAdapter,
    },
    ref
  ) {
  const containerRef = useRef<HTMLDivElement>(null);
  const paperElRef = useRef<HTMLDivElement>(null);

  // JointJS instances live in refs to avoid re-creating.
  const jointRef = useRef<JointModule | null>(null);
  const diaGraphRef = useRef<any | null>(null);
  const paperRef = useRef<any | null>(null);

  // Guards to prevent infinite loops during sync.
  const applyingExternalFlowRef = useRef(false);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);

  const [contextMenuNodeId, setContextMenuNodeId] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // Derived for right/left panels
  const selectedCharacter = useMemo(() => {
    if (!selectedNodeId) return null;
    return characters.find(c => c.id === selectedNodeId) ?? null;
  }, [selectedNodeId, characters]);

  const activeCharacter = useMemo(() => {
    if (!activeCharacterId) return null;
    return characters.find(c => c.id === activeCharacterId) ?? null;
  }, [activeCharacterId, characters]);

  // Close context menu when clicking outside
  useEffect(() => {
    if (!contextMenuNodeId) return;

    const handleClick = () => {
      setContextMenuNodeId(null);
      setContextMenuPosition(null);
    };

    const t = setTimeout(() => document.addEventListener('click', handleClick), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('click', handleClick);
    };
  }, [contextMenuNodeId]);

  const ensureJoint = async (): Promise<JointModule> => {
    if (jointRef.current) return jointRef.current;
    const mod = await import('jointjs');
    jointRef.current = mod;
    return mod;
  };

  const defineShapesOnce = (joint: JointModule) => {
    // Avoid redefining on hot reload / rerenders.
    const ns = (joint as any).shapes?.mb;
    if (ns?.CharacterNode && ns?.RelationshipLink) return;

    (joint as any).shapes.mb = (joint as any).shapes.mb || {};
    const shapes = (joint as any).shapes.mb;

    // Character node: circle + name
    shapes.CharacterNode = joint.dia.Element.define(
      'mb.CharacterNode',
      {
        size: { width: 120, height: 60 },
        attrs: {
          body: {
            // we will render as a circle-ish pill; feel free to tune
            fill: 'var(--color-df-node-bg)',
            stroke: 'var(--color-df-node-border)',
            strokeWidth: 2,
          },
          label: {
            text: '',
            fill: 'var(--color-df-text-primary)',
            fontSize: 12,
            fontWeight: 700,
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            pointerEvents: 'none',
          },
          ring: {
            fill: 'transparent',
            stroke: 'transparent',
            strokeWidth: 0,
            pointerEvents: 'none',
          },
        },
      },
      {
        markup: [
          { tagName: 'ellipse', selector: 'body' },
          { tagName: 'ellipse', selector: 'ring' },
          { tagName: 'text', selector: 'label' },
        ],
      }
    );

    // Relationship link
    shapes.RelationshipLink = joint.dia.Link.define('mb.RelationshipLink', {
      attrs: {
        line: {
          stroke: 'var(--color-df-edge-default)',
          strokeWidth: 2,
          targetMarker: {
            type: 'path',
            d: 'M 10 -5 0 0 10 5 z',
            fill: 'var(--color-df-edge-default)',
          },
        },
      },
      labels: [],
      router: { name: 'normal' },
      connector: { name: 'rounded' },
    });
  };

  const applyNodeStyling = (cell: any, isPerspective: boolean, isSelected: boolean) => {
    // Mirror your SVG styling logic with CSS vars.
    if (isPerspective) {
      cell.attr('body/fill', 'var(--color-df-success)');
      cell.attr('body/stroke', 'var(--color-df-success)');
      cell.attr('body/strokeWidth', 3);
    } else if (isSelected) {
      cell.attr('body/fill', 'var(--color-df-node-selected)');
      cell.attr('body/stroke', 'var(--color-df-node-selected)');
      cell.attr('body/strokeWidth', 3);
    } else {
      cell.attr('body/fill', 'var(--color-df-node-bg)');
      cell.attr('body/stroke', 'var(--color-df-node-border)');
      cell.attr('body/strokeWidth', 2);
    }

    // Add a subtle selection ring if desired
    if (isSelected) {
      cell.attr('ring/stroke', 'var(--color-df-node-selected)');
      cell.attr('ring/strokeWidth', 2);
    } else {
      cell.attr('ring/stroke', 'transparent');
      cell.attr('ring/strokeWidth', 0);
    }
  };

  const setNodeGeometry = (cell: any) => {
    // This matches your old "circle r=30".
    // We render ellipse centered at (0,0) conceptually, but JointJS positions are top-left.
    // We'll just set element size and style ellipse in the bbox.
    const w = 70;
    const h = 70;
    cell.resize(w, h);
    cell.attr('body/cx', w / 2);
    cell.attr('body/cy', h / 2);
    cell.attr('body/rx', w / 2);
    cell.attr('body/ry', h / 2);

    cell.attr('ring/cx', w / 2);
    cell.attr('ring/cy', h / 2);
    cell.attr('ring/rx', w / 2 + 4);
    cell.attr('ring/ry', h / 2 + 4);

    cell.attr('label/x', w / 2);
    cell.attr('label/y', h / 2);
  };

  const setLinkLabel = (link: any, label?: string) => {
    if (!label) {
      link.labels([]);
      return;
    }
    link.labels([
      {
        position: 0.5,
        attrs: {
          text: {
            text: label,
            fill: 'var(--color-df-text-primary)',
            fontSize: 12,
            fontWeight: 600,
            pointerEvents: 'none',
          },
          rect: {
            fill: 'transparent',
          },
        },
      },
    ]);
  };

  const installLinkTools = (joint: JointModule, paper: any, link: any) => {
    // Adds a remove tool similar to your midpoint delete circle.
    // We install tools on selection for performance; but we can also keep it always on.
    const tools = new joint.dia.ToolsView({
      tools: [
        new joint.linkTools.Remove({
          distance: '50%',
          action: (_evt: any, l: any) => {
            // Remove link and sync back to flow via listeners.
            l.remove();
          },
        }),
      ],
    });

    const view = link.findView(paper);
    if (view) view.addTools(tools);
  };

  const flowToJoint = (joint: JointModule, flow: RelationshipFlow) => {
    const diaGraph = diaGraphRef.current;
    if (!diaGraph) return;

    const normalized = normalizeFlow(flow);

    applyingExternalFlowRef.current = true;
    try {
      const existingCells = diaGraph.getCells();
      const existingById = new Map<string, any>();
      for (const c of existingCells) existingById.set(c.id.toString(), c);

      // 1) Elements (nodes)
      for (const n of normalized.nodes) {
        const id = n.id;
        const name = clampStr(getCharName(characters, id), 10);

        let el = existingById.get(id);
        if (!el) {
          const CharacterNode = (joint as any).shapes.mb.CharacterNode;
          el = new CharacterNode({ id });
          diaGraph.addCell(el);
        }

        el.position(n.position.x, n.position.y);

        setNodeGeometry(el);
        el.attr('label/text', name);

        const isPerspective = id === activeCharacterId;
        const isSelected = selectedNodeId === id;
        applyNodeStyling(el, isPerspective, isSelected);
      }

      // Remove elements not in flow
      for (const c of existingCells) {
        if (c.isElement && c.isElement()) {
          const id = c.id.toString();
          if (!normalized.nodes.some(n => n.id === id)) c.remove();
        }
      }

      // 2) Links (edges)
      for (const e of normalized.edges) {
        const id = e.id;

        let link = existingById.get(id);
        if (!link) {
          const RelationshipLink = (joint as any).shapes.mb.RelationshipLink;
          link = new RelationshipLink({ id });
          diaGraph.addCell(link);
        }

        link.source({ id: e.source });
        link.target({ id: e.target });

        // Store extra data on the model so it roundtrips.
        link.set('mbData', { ...(e.data ?? {}) });

        setLinkLabel(link, e.data?.label);
      }

      // Remove links not in flow
      const cellsAfter = diaGraph.getCells();
      for (const c of cellsAfter) {
        if (c.isLink && c.isLink()) {
          const id = c.id.toString();
          if (!normalized.edges.some(e => e.id === id)) c.remove();
        }
      }
    } finally {
      applyingExternalFlowRef.current = false;
    }
  };

  const jointToFlow = (): RelationshipFlow => {
    const diaGraph = diaGraphRef.current;
    if (!diaGraph) return { nodes: [], edges: [] };

    const nodes: RelationshipFlowNode[] = [];
    const edges: RelationshipFlowEdge[] = [];

    const elements = diaGraph.getElements();
    for (const el of elements) {
      const id = el.id.toString();
      const pos = el.position();
      nodes.push({
        id,
        type: 'character',
        position: { x: pos.x, y: pos.y },
        data: { characterId: id },
      });
    }

    const links = diaGraph.getLinks();
    for (const link of links) {
      const id = link.id.toString();
      const src = link.source();
      const tgt = link.target();

      const sourceId = (src && (src.id as string)) ? (src.id as string) : '';
      const targetId = (tgt && (tgt.id as string)) ? (tgt.id as string) : '';
      if (!sourceId || !targetId) continue;

      const mbData = link.get('mbData') || {};
      edges.push({
        id,
        source: sourceId,
        target: targetId,
        type: 'relationship',
        data: {
          label: mbData.label,
          why: mbData.why,
        },
      });
    }

    return normalizeFlow({ nodes, edges });
  };

  useImperativeHandle(
    ref,
    () => ({
      getJointGraphJson(): object | null {
        const g = diaGraphRef.current;
        return g && typeof (g as any).toJSON === 'function' ? (g as any).toJSON() : null;
      },
      getRelationshipFlow(): RelationshipFlow | null {
        return graph ?? null;
      },
    }),
    [graph]
  );

  const addCharacterToFlow = (characterId: string, position?: { x: number; y: number }) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    if (graph.nodes.some(n => n.id === characterId)) return;

    let nodePosition: { x: number; y: number };
    if (position) {
      nodePosition = position;
    } else {
      if (!activeCharacterId) {
        nodePosition = { x: 400 + graph.nodes.length * 150, y: 300 };
      } else {
        const perspectiveNode = graph.nodes.find(n => n.id === activeCharacterId);
        const baseX = perspectiveNode?.position.x || 400;
        const baseY = perspectiveNode?.position.y || 300;
        nodePosition = { x: baseX + 200, y: baseY + graph.nodes.length * 50 };
      }
    }

    const newNode: RelationshipFlowNode = {
      id: characterId,
      type: 'character',
      position: nodePosition,
      data: { characterId },
    };

    const updatedNodes = [...graph.nodes, newNode];

    let updatedEdges = [...graph.edges];
    if (activeCharacterId && characterId !== activeCharacterId) {
      const edgeId = `${activeCharacterId}->${characterId}`;
      if (!updatedEdges.some(e => e.id === edgeId)) {
        updatedEdges.push({
          id: edgeId,
          source: activeCharacterId,
          target: characterId,
          type: 'relationship',
          data: undefined,
        });
      }
    }

    onGraphChange(normalizeFlow({ nodes: updatedNodes, edges: updatedEdges }));
  };

  // --- Init JointJS once ---
  useEffect(() => {
    let destroyed = false;

    const init = async () => {
      const joint = await ensureJoint();
      if (destroyed) return;

      defineShapesOnce(joint);

      const diaGraph = new joint.dia.Graph({}, { cellNamespace: (joint as any).shapes });
      diaGraphRef.current = diaGraph;

      const paperEl = paperElRef.current;
      if (!paperEl) return;

      const paper = new joint.dia.Paper({
        el: paperEl,
        model: diaGraph,
        cellViewNamespace: (joint as any).shapes,
        width: 3000,
        height: 2000,
        gridSize: 10,
        drawGrid: false, // we keep your CSS grid
        async: true,
        background: { color: 'transparent' },
        interactive: (cellView: any) => {
          // Allow moving elements, clicking links, etc.
          if (cellView.model.isLink && cellView.model.isLink()) return true;
          return true;
        },
        // Prevent default context menu so we can provide ours
        preventContextMenu: true,
      });

      paperRef.current = paper;

      // Blank click clears selection
      paper.on('blank:pointerdown', () => {
        setSelectedNodeId(null);
      });

      // Element click selects
      paper.on('element:pointerdown', (elementView: any) => {
        const id = elementView.model.id.toString();
        setSelectedNodeId(id);
      });

      // Element right click context menu
      paper.on('element:contextmenu', (elementView: any, evt: MouseEvent) => {
        evt.preventDefault();
        evt.stopPropagation();
        const id = elementView.model.id.toString();
        setContextMenuNodeId(id);
        setContextMenuPosition({ x: evt.clientX, y: evt.clientY });
      });

      // Link click opens label dialog
      paper.on('link:pointerdown', (linkView: any, evt: MouseEvent) => {
        evt.preventDefault();
        evt.stopPropagation();

        const link = linkView.model;
        const id = link.id.toString();
        setEditingEdgeId(id);
        setLabelDialogOpen(true);

        // Install remove tool (midpoint remove) on click.
        installLinkTools(joint, paper, link);
      });

      // Sync back when element moves (Graph extends Backbone.Events; cast for TS)
      const g = diaGraph as unknown as { on: (events: string, callback: () => void) => unknown };
      g.on('change:position', () => {
        if (applyingExternalFlowRef.current) return;
        const next = jointToFlow();
        onGraphChange(next);
      });

      // Sync back when links added/removed/changed (see JointJS Graph cell events)
      g.on('add remove change:source change:target', () => {
        if (applyingExternalFlowRef.current) return;
        const next = jointToFlow();
        onGraphChange(next);
      });

      // Initial render from props
      flowToJoint(joint, graph);
    };

    init();

    return () => {
      destroyed = true;
      try {
        paperRef.current?.remove?.();
      } catch {}
      paperRef.current = null;
      diaGraphRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Apply external graph updates into JointJS ---
  useEffect(() => {
    const joint = jointRef.current;
    if (!joint) return;
    if (!diaGraphRef.current) return;
    flowToJoint(joint, graph);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, characters, activeCharacterId, selectedNodeId]);

  // Handle drop from CharacterSidebar
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const characterId = e.dataTransfer.getData('application/character');
    if (!characterId) return;

    const paper = paperRef.current;
    if (!paper) return;

    // Convert client point to local paper coords
    const p = paper.clientToLocalPoint({ x: e.clientX, y: e.clientY });
    addCharacterToFlow(characterId, { x: p.x, y: p.y });
  };

  // Available relationship targets (same rule as before)
  const availableRelationshipTargets = useMemo(() => {
    return graph.nodes.filter(
      n =>
        n.id !== activeCharacterId &&
        !graph.edges.some(e => e.source === activeCharacterId && e.target === n.id)
    );
  }, [graph.nodes, graph.edges, activeCharacterId]);

  // Keep “active-only add relationship” behavior:
  // In the SVG version you had a + bubble; in JointJS version you can either:
  // A) keep it in sidebar/toolbar (recommended) or
  // B) add a JointJS element tool on the active node
  //
  // For now we keep behavior via existing sidebar interactions + drag/drop + auto-edge.
  // If you want the "+ button on green node" exactly, we’ll add an element tool next.

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 min-h-0">
        {/* Active Character Panel - Left side (editable) */}
        <ActiveCharacterPanel
          character={activeCharacter}
          onUpdate={
            onCharacterUpdate && activeCharacterId
              ? updates => onCharacterUpdate(activeCharacterId, updates)
              : undefined
          }
          dataAdapter={dataAdapter}
        />

        {/* Graph Visualization */}
        <div
          ref={containerRef}
          className="flex-1 border-2 rounded-lg relative overflow-auto"
          style={{
            minHeight: '400px',
            borderColor: 'var(--color-df-control-border)',
            backgroundColor: 'var(--color-df-canvas-bg)',
          }}
          onDragOver={e => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={handleDrop}
        >
          {/* Grid Background Pattern (keep your existing CSS grid) */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: 'var(--color-df-canvas-bg)',
              backgroundImage: `
                linear-gradient(to right, var(--color-df-canvas-grid) 1px, transparent 1px),
                linear-gradient(to bottom, var(--color-df-canvas-grid) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }}
          />

          {/* JointJS paper mounts here */}
          <div ref={paperElRef} className="absolute inset-0 z-10" />

          {/* Instructions overlay */}
          {!activeCharacterId ? (
            <div className="absolute top-4 left-4 bg-white/90 p-3 rounded-md shadow-sm text-sm max-w-xs z-20">
              <div className="font-semibold mb-2">Getting Started</div>
              <ul className="space-y-1 text-xs text-gray-600">
                <li>• Right-click a character in the sidebar and select &quot;Edit&quot; to load their graph</li>
                <li>• Or drag characters from the sidebar onto the graph</li>
              </ul>
            </div>
          ) : graph.nodes.length === 1 && graph.edges.length === 0 ? (
            <div className="absolute top-4 left-4 bg-white/90 p-3 rounded-md shadow-sm text-sm max-w-xs z-20">
              <div className="font-semibold mb-2">Getting Started</div>
              <ul className="space-y-1 text-xs text-gray-600">
                <li>• Drag characters from the sidebar to add them to the graph</li>
                <li>• Click relationships to edit labels</li>
                <li>• Drag nodes to reposition them</li>
              </ul>
            </div>
          ) : null}

          {/* Right Side Panel Container */}
          <div className="absolute top-0 right-0 h-full w-64 z-20 shadow-lg flex flex-col bg-background">
            <div className="flex-1 min-h-0">
              <CharacterSidebar
                characters={characters}
                activeCharacterId={activeCharacterId}
                onCharacterSelect={onCharacterSelect}
                onCreateCharacter={onCreateCharacter}
                charactersInGraph={graph.nodes.map(n => n.id)}
                graph={graph}
                onGraphChange={onGraphChange}
                className="h-full"
              />
            </div>

            {selectedCharacter && (
              <div className="border-t border-border flex-shrink-0" style={{ maxHeight: '300px' }}>
                <CharacterDetailsPanel
                  character={selectedCharacter}
                  isActiveCharacter={selectedNodeId === activeCharacterId}
                  className="h-auto"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Relationship Label Dialog */}
      <RelationshipLabelDialog
        open={labelDialogOpen}
        onOpenChange={setLabelDialogOpen}
        currentLabel={
          editingEdgeId
            ? graph.edges.find(e => e.id === editingEdgeId)?.data?.label || ''
            : ''
        }
        currentWhy={
          editingEdgeId
            ? graph.edges.find(e => e.id === editingEdgeId)?.data?.why || ''
            : ''
        }
        onConfirm={(label, why) => {
          if (!editingEdgeId) return;

          // Update in canonical flow
          const nextFlow: RelationshipFlow = {
            ...graph,
            edges: graph.edges.map(e =>
              e.id === editingEdgeId ? { ...e, data: { ...(e.data ?? {}), label, why } } : e
            ),
          };
          onGraphChange(normalizeFlow(nextFlow));

          // Update in JointJS model immediately (so UI updates without waiting)
          const diaGraph = diaGraphRef.current;
          const link = diaGraph?.getCell?.(editingEdgeId);
          if (link) {
            link.set('mbData', { label, why });
            setLinkLabel(link, label);
          }

          setEditingEdgeId(null);
        }}
      />

      {/* Context Menu Portal */}
      {contextMenuNodeId && contextMenuPosition && typeof window !== 'undefined' &&
        createPortal(
          <div
            className="fixed z-50 bg-popover border border-border rounded-md shadow-md min-w-[180px] py-1"
            style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent transition-colors"
              onClick={() => {
                if (contextMenuNodeId && onCharacterSelect) {
                  onCharacterSelect(contextMenuNodeId);
                }
                setContextMenuNodeId(null);
                setContextMenuPosition(null);
              }}
            >
              <Users className="mr-2 h-4 w-4" />
              Load as Active Character
            </div>
          </div>,
          document.body
        )
      }
    </div>
  );
});

export { RelationshipGraphEditor };
