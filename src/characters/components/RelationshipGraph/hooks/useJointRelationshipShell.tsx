import { useEffect, useRef, useCallback } from 'react';
import { dia, shapes, linkTools, elementTools } from '@joint/core';
import type { RelationshipFlow, CharacterDoc, Position } from '@/characters/types';
import type { CharacterWorkspaceStore } from '../../CharacterWorkspace/store/character-workspace-store';

interface UseJointRelationshipShellOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  store: CharacterWorkspaceStore;
  activeCharacterId: string;
  characters: CharacterDoc[];
  graph: RelationshipFlow;
  onGraphChange: (graph: RelationshipFlow) => void;
}

/**
 * JointJS bridge hook for relationship graph editor
 * Translates between domain RelationshipFlow and JointJS cells
 * Enforces Option A: all edges must originate from active character
 */
export function useJointRelationshipShell({
  containerRef,
  store,
  activeCharacterId,
  characters,
  graph,
  onGraphChange,
}: UseJointRelationshipShellOptions) {
  const jointGraphRef = useRef<dia.Graph | null>(null);
  const paperRef = useRef<dia.Paper | null>(null);
  const isInitializedRef = useRef(false);

  // Get character info helper
  const getCharacterInfo = useCallback(
    (characterId: string) => {
      return characters.find((c) => c.id === characterId);
    },
    [characters]
  );

  // Create a character node element
  const createCharacterElement = useCallback(
    (characterId: string, position: Position) => {
      const character = getCharacterInfo(characterId);
      const isPerspective = characterId === activeCharacterId;

      const element = new shapes.standard.Circle({
        id: characterId,
        position: { x: position.x, y: position.y },
        size: { width: 80, height: 80 },
        attrs: {
          body: {
            fill: isPerspective ? '#10b981' : '#f3f4f6',
            stroke: isPerspective ? '#059669' : '#d1d5db',
            strokeWidth: 2,
            cursor: 'move',
          },
          label: {
            text: character?.name.substring(0, 12) || characterId.substring(0, 8),
            fill: isPerspective ? '#ffffff' : '#374151',
            fontSize: 12,
            fontFamily: 'sans-serif',
            textVerticalAnchor: 'middle',
            textAnchor: 'middle',
            cursor: 'pointer',
          },
        },
      });

      return element;
    },
    [activeCharacterId, getCharacterInfo]
  );

  // Create a relationship link
  const createRelationshipLink = useCallback(
    (sourceId: string, targetId: string, label?: string) => {
      const link = new shapes.standard.Link({
        id: `${sourceId}->${targetId}`,
        source: { id: sourceId },
        target: { id: targetId },
        attrs: {
          line: {
            stroke: '#6366f1',
            strokeWidth: 2,
            targetMarker: {
              type: 'path',
              d: 'M 10 -5 0 0 10 5 z',
              fill: '#6366f1',
            },
          },
        },
        labels: label
          ? [
              {
                attrs: {
                  text: {
                    text: label,
                    fill: '#374151',
                    fontSize: 12,
                    fontFamily: 'sans-serif',
                  },
                  rect: {
                    fill: '#ffffff',
                    stroke: '#d1d5db',
                    strokeWidth: 1,
                    rx: 4,
                    ry: 4,
                  },
                },
              },
            ]
          : [],
      });

      return link;
    },
    []
  );

  // Sync domain graph to JointJS
  const syncGraphToJoint = useCallback(() => {
    if (!jointGraphRef.current || !paperRef.current) return;

    const jointGraph = jointGraphRef.current;

    // Get current JointJS elements and links
    const currentElements = jointGraph.getElements();
    const currentLinks = jointGraph.getLinks();

    // Remove elements that are no longer in the domain graph
    currentElements.forEach((element) => {
      if (!graph.nodes.find((n) => n.id === element.id)) {
        element.remove();
      }
    });

    // Remove links that are no longer in the domain graph
    currentLinks.forEach((link) => {
      if (!graph.edges.find((e) => e.id === link.id)) {
        link.remove();
      }
    });

    // Add or update elements
    graph.nodes.forEach((node) => {
      let element = jointGraph.getCell(node.id) as dia.Element | undefined;

      if (!element) {
        // Create new element
        element = createCharacterElement(node.id, node.position);
        jointGraph.addCell(element);
      } else {
        // Update position if changed
        const currentPos = element.position();
        if (currentPos.x !== node.position.x || currentPos.y !== node.position.y) {
          element.position(node.position.x, node.position.y);
        }

        // Update appearance based on perspective status
        const isPerspective = node.id === activeCharacterId;
        element.attr('body/fill', isPerspective ? '#10b981' : '#f3f4f6');
        element.attr('body/stroke', isPerspective ? '#059669' : '#d1d5db');
        element.attr('label/fill', isPerspective ? '#ffffff' : '#374151');
      }
    });

    // Add or update links
    graph.edges.forEach((edge) => {
      let link = jointGraph.getCell(edge.id) as dia.Link | undefined;

      if (!link) {
        // Create new link
        link = createRelationshipLink(edge.source, edge.target, edge.data?.label);
        jointGraph.addCell(link);
      } else {
        // Update label if changed
        const currentLabels = link.labels();
        const newLabel = edge.data?.label || '';
        const currentLabel = currentLabels.length > 0 ? currentLabels[0].attrs?.text?.text : '';

        if (currentLabel !== newLabel) {
          if (newLabel) {
            link.labels([
              {
                attrs: {
                  text: {
                    text: newLabel,
                    fill: '#374151',
                    fontSize: 12,
                    fontFamily: 'sans-serif',
                  },
                  rect: {
                    fill: '#ffffff',
                    stroke: '#d1d5db',
                    strokeWidth: 1,
                    rx: 4,
                    ry: 4,
                  },
                },
              },
            ]);
          } else {
            link.labels([]);
          }
        }
      }
    });
  }, [graph, activeCharacterId, createCharacterElement, createRelationshipLink]);

  // Initialize JointJS
  useEffect(() => {
    if (!containerRef.current || isInitializedRef.current) return;

    const container = containerRef.current;

    // Create JointJS graph
    const jointGraph = new dia.Graph({}, { cellNamespace: shapes });
    jointGraphRef.current = jointGraph;

    // Create JointJS paper
    const paper = new dia.Paper({
      el: container,
      model: jointGraph,
      width: '100%',
      height: '100%',
      gridSize: 10,
      drawGrid: { name: 'dot', args: { color: '#e5e7eb', thickness: 1 } },
      background: { color: '#ffffff' },
      interactive: {
        linkMove: false, // Prevent moving entire link
        labelMove: false, // Prevent moving labels
      },
      defaultLink: () =>
        new shapes.standard.Link({
          attrs: {
            line: {
              stroke: '#6366f1',
              strokeWidth: 2,
              targetMarker: {
                type: 'path',
                d: 'M 10 -5 0 0 10 5 z',
                fill: '#6366f1',
              },
            },
          },
        }),
      validateConnection: (cellViewS, magnetS, cellViewT, magnetT, end, linkView) => {
        // Option A enforcement: Only allow links from the active character
        if (!activeCharacterId) return false;

        const sourceId = cellViewS.model.id;
        const targetId = cellViewT.model.id;

        // Must originate from active character
        if (sourceId !== activeCharacterId) {
          return false;
        }

        // No self-edges
        if (sourceId === targetId) {
          return false;
        }

        // Check if link already exists
        const edgeId = `${sourceId}->${targetId}`;
        if (graph.edges.some((e) => e.id === edgeId)) {
          return false;
        }

        return true;
      },
      cellNamespace: shapes,
    });

    paperRef.current = paper;
    isInitializedRef.current = true;

    // Handle element position changes
    paper.on('element:pointerup', (elementView) => {
      const element = elementView.model;
      const position = element.position();

      // Update domain graph
      onGraphChange({
        ...graph,
        nodes: graph.nodes.map((n) =>
          n.id === element.id ? { ...n, position: { x: position.x, y: position.y } } : n
        ),
      });
    });

    // Handle link creation
    paper.on('link:connect', (linkView) => {
      const link = linkView.model;
      const source = link.source();
      const target = link.target();

      if (source.id && target.id) {
        const sourceId = String(source.id);
        const targetId = String(target.id);
        const edgeId = `${sourceId}->${targetId}`;

        // Add edge to domain graph
        onGraphChange({
          ...graph,
          edges: [
            ...graph.edges,
            {
              id: edgeId,
              source: sourceId,
              target: targetId,
              type: 'relationship',
              data: undefined,
            },
          ],
        });
      }
    });

    // Handle link click (for editing labels)
    paper.on('link:pointerclick', (linkView) => {
      const link = linkView.model;
      const edgeId = String(link.id);
      const edge = graph.edges.find((e) => e.id === edgeId);

      if (edge) {
        const newLabel = prompt('Enter relationship label:', edge.data?.label || '');
        if (newLabel !== null) {
          onGraphChange({
            ...graph,
            edges: graph.edges.map((e) =>
              e.id === edgeId ? { ...e, data: { ...e.data, label: newLabel } } : e
            ),
          });
        }
      }
    });

    // Handle element click (for selection)
    paper.on('element:pointerclick', (elementView) => {
      const element = elementView.model;
      const characterId = String(element.id);

      // Update selected character in store
      store.getState().actions.setSelectedCharacterId(characterId);
    });

    // Handle blank canvas click (deselect)
    paper.on('blank:pointerclick', () => {
      store.getState().actions.setSelectedCharacterId(null);
    });

    // Cleanup
    return () => {
      paper.remove();
      isInitializedRef.current = false;
    };
  }, [containerRef, store, activeCharacterId]); // Don't include graph in deps to avoid re-initialization

  // Sync graph when it changes
  useEffect(() => {
    if (isInitializedRef.current) {
      syncGraphToJoint();
    }
  }, [graph, activeCharacterId, syncGraphToJoint]);

  return {
    jointGraph: jointGraphRef.current,
    paper: paperRef.current,
  };
}
