'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { RelationshipFlow, RelationshipFlowNode, RelationshipFlowEdge } from '@/characters/types';
import type { CharacterDoc } from '@/characters/types';
import { CharacterSidebar } from './CharacterSidebar';
import { RelationshipLabelDialog } from './RelationshipLabelDialog';
import { CharacterDetailsPanel } from './CharacterDetailsPanel';
import { ActiveCharacterPanel } from './ActiveCharacterPanel';
import { Users } from 'lucide-react';

import type { CharacterWorkspaceAdapter } from '@/characters/types';

interface RelationshipGraphEditorProps {
  graph: RelationshipFlow;
  activeCharacterId: string; // Can be empty string when no character selected
  characters: CharacterDoc[];
  onGraphChange: (graph: RelationshipFlow) => void;
  onCharacterSelect?: (characterId: string) => void;
  onCreateCharacter?: () => void;
  onCharacterUpdate?: (characterId: string, updates: { name?: string; description?: string; imageUrl?: string; avatarId?: string | null }) => Promise<void>;
  dataAdapter?: CharacterWorkspaceAdapter;
}

/**
 * Relationship graph editor for character relationship flows
 * Custom SVG-based graph visualization (not JointJS)
 * Shows nodes and edges, allows adding characters and relationships
 */
export function RelationshipGraphEditor({
  graph,
  activeCharacterId,
  characters,
  onGraphChange,
  onCharacterSelect,
  onCreateCharacter,
  onCharacterUpdate,
  dataAdapter,
}: RelationshipGraphEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [contextMenuNodeId, setContextMenuNodeId] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    if (!contextMenuNodeId) return;

    const handleClick = () => {
      setContextMenuNodeId(null);
      setContextMenuPosition(null);
    };

    // Use setTimeout to avoid immediate closure
    const timeout = setTimeout(() => {
      document.addEventListener('click', handleClick);
    }, 0);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('click', handleClick);
    };
  }, [contextMenuNodeId]);

  // Get character info for nodes
  const getCharacterInfo = (characterId: string): CharacterDoc | undefined => {
    return characters.find(c => c.id === characterId);
  };

  // Handle node drag start
  const handleNodeMouseDown = (nodeId: string, event: React.MouseEvent) => {
    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = event.clientX;
    const startY = event.clientY;
    let hasMoved = false;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = Math.abs(e.clientX - startX);
      const deltaY = Math.abs(e.clientY - startY);
      
      // Start dragging if mouse moved more than 3px
      if (!hasMoved && (deltaX > 3 || deltaY > 3)) {
        hasMoved = true;
        setDraggingNodeId(nodeId);
        setDragOffset({
          x: startX - rect.left - node.position.x,
          y: startY - rect.top - node.position.y,
        });
      }
    };
    
    const handleMouseUp = () => {
      if (!hasMoved) {
        // It was just a click, select the node
        setSelectedNodeId(nodeId);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Handle node dragging
  useEffect(() => {
    if (!draggingNodeId || !dragOffset) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;

      const newX = event.clientX - rect.left - dragOffset.x;
      const newY = event.clientY - rect.top - dragOffset.y;

      onGraphChange({
        ...graph,
        nodes: graph.nodes.map(n =>
          n.id === draggingNodeId
            ? { ...n, position: { x: newX, y: newY } }
            : n
        ),
      });
    };

    const handleMouseUp = () => {
      setDraggingNodeId(null);
      setDragOffset(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingNodeId, dragOffset, graph, onGraphChange]);

  // Handle adding a character node to the graph
  const handleAddCharacter = (characterId: string, position?: { x: number; y: number }) => {
    const character = getCharacterInfo(characterId);
    if (!character) return;

    // Check if character is already in the graph
    if (graph.nodes.some(n => n.id === characterId)) {
      return;
    }

    // Use provided position or calculate default position
    let nodePosition: { x: number; y: number };
    if (position) {
      nodePosition = position;
    } else {
      // If no active character, place in center
      if (!activeCharacterId) {
        nodePosition = {
          x: 400 + (graph.nodes.length * 150),
          y: 300,
        };
      } else {
        const perspectiveNode = graph.nodes.find(n => n.id === activeCharacterId);
        const baseX = perspectiveNode?.position.x || 400;
        const baseY = perspectiveNode?.position.y || 300;
        nodePosition = {
          x: baseX + 200,
          y: baseY + (graph.nodes.length * 50),
        };
      }
    }
    
    const newNode: RelationshipFlowNode = {
      id: characterId,
      type: 'character',
      position: nodePosition,
      data: { characterId },
    };

    const updatedNodes = [...graph.nodes, newNode];
    
    // Automatically create relationship edge from active character to new character
    let updatedEdges = [...graph.edges];
    if (activeCharacterId && characterId !== activeCharacterId) {
      const edgeId = `${activeCharacterId}->${characterId}`;
      // Only add edge if it doesn't already exist
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

    onGraphChange({
      ...graph,
      nodes: updatedNodes,
      edges: updatedEdges,
    });
  };

  // Handle adding a relationship edge
  const handleAddRelationship = (targetId: string, label?: string) => {
    if (targetId === activeCharacterId) return; // No self-edges

    const edgeId = `${activeCharacterId}->${targetId}`;
    
    // Check if edge already exists
    if (graph.edges.some(e => e.id === edgeId)) return;

    const newEdge: RelationshipFlowEdge = {
      id: edgeId,
      source: activeCharacterId,
      target: targetId,
      type: 'relationship',
      data: label ? { label } : undefined,
    };

    onGraphChange({
      ...graph,
      edges: [...graph.edges, newEdge],
    });
  };

  // Handle removing a node
  const handleRemoveNode = (nodeId: string) => {
    if (nodeId === activeCharacterId) return; // Can't remove perspective character

    onGraphChange({
      nodes: graph.nodes.filter(n => n.id !== nodeId),
      edges: graph.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
    });
  };

  // Handle removing an edge
  const handleRemoveEdge = (edgeId: string) => {
    onGraphChange({
      ...graph,
      edges: graph.edges.filter(e => e.id !== edgeId),
    });
  };

  // Handle updating edge label
  const handleUpdateEdgeLabel = (edgeId: string, label: string, why?: string) => {
    onGraphChange({
      ...graph,
      edges: graph.edges.map(e => 
        e.id === edgeId 
          ? { ...e, data: { ...e.data, label, why } }
          : e
      ),
    });
  };

  // Available targets for relationships (characters in graph, not perspective, not already connected)
  const availableRelationshipTargets = graph.nodes.filter(n => 
    n.id !== activeCharacterId && 
    !graph.edges.some(e => e.source === activeCharacterId && e.target === n.id)
  );

  // Get selected character info (for right panel)
  const selectedCharacter = selectedNodeId ? getCharacterInfo(selectedNodeId) : null;
  // Get active character info (for left panel)
  const activeCharacter = activeCharacterId ? getCharacterInfo(activeCharacterId) : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 min-h-0">
        {/* Active Character Panel - Left side (editable) */}
        <ActiveCharacterPanel
          character={activeCharacter}
          onUpdate={onCharacterUpdate && activeCharacterId ? (updates) => onCharacterUpdate(activeCharacterId, updates) : undefined}
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
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={(e) => {
          e.preventDefault();
          const characterId = e.dataTransfer.getData('application/character');
          if (!characterId) return;

          // Convert screen coordinates to SVG coordinates
          const svg = svgRef.current;
          if (!svg) return;

          const rect = svg.getBoundingClientRect();
          const scrollContainer = containerRef.current;
          if (!scrollContainer) return;

          // Get scroll offsets
          const scrollLeft = scrollContainer.scrollLeft || 0;
          const scrollTop = scrollContainer.scrollTop || 0;

          // Calculate position relative to SVG
          const x = e.clientX - rect.left + scrollLeft;
          const y = e.clientY - rect.top + scrollTop;

          handleAddCharacter(characterId, { x, y });
        }}
      >
        {/* Grid Background Pattern */}
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
        
        <svg 
          ref={svgRef}
          className="w-full h-full relative z-10" 
          style={{ minHeight: '600px' }}
          onMouseDown={() => setSelectedNodeId(null)}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent event from bubbling to container
            const characterId = e.dataTransfer.getData('application/character');
            if (!characterId) return;

            // Convert screen coordinates to SVG coordinates
            const svg = svgRef.current;
            if (!svg) return;

            const rect = svg.getBoundingClientRect();
            const scrollContainer = containerRef.current;
            if (!scrollContainer) return;

            // Get scroll offsets
            const scrollLeft = scrollContainer.scrollLeft || 0;
            const scrollTop = scrollContainer.scrollTop || 0;

            // Calculate position relative to SVG
            const x = e.clientX - rect.left + scrollLeft;
            const y = e.clientY - rect.top + scrollTop;

            handleAddCharacter(characterId, { x, y });
          }}
        >
          {/* Render edges first (so they appear behind nodes) */}
          {graph.edges.map((edge) => {
            const sourceNode = graph.nodes.find(n => n.id === edge.source);
            const targetNode = graph.nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const x1 = sourceNode.position.x;
            const y1 = sourceNode.position.y;
            const x2 = targetNode.position.x;
            const y2 = targetNode.position.y;

            return (
              <g key={edge.id}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="var(--color-df-edge-default)"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.setAttribute('stroke', 'var(--color-df-edge-default-hover)');
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.setAttribute('stroke', 'var(--color-df-edge-default)');
                  }}
                  onClick={() => {
                    setEditingEdgeId(edge.id);
                    setLabelDialogOpen(true);
                  }}
                />
                {edge.data?.label && (
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 5}
                    textAnchor="middle"
                    fontSize="12"
                    fill="var(--color-df-text-primary)"
                    className="pointer-events-none"
                  >
                    {edge.data.label}
                  </text>
                )}
                <circle
                  cx={(x1 + x2) / 2}
                  cy={(y1 + y2) / 2}
                  r="4"
                  fill="var(--color-df-edge-default)"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.setAttribute('fill', 'var(--color-df-error)');
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.setAttribute('fill', 'var(--color-df-edge-default)');
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Remove this relationship?')) {
                      handleRemoveEdge(edge.id);
                    }
                  }}
                />
              </g>
            );
          })}

          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="var(--color-df-edge-default)" />
            </marker>
          </defs>

          {/* Render nodes */}
          {graph.nodes.map((node) => {
            const character = getCharacterInfo(node.id);
            const isPerspective = node.id === activeCharacterId;
            const isSelected = selectedNodeId === node.id;
            const isDragging = draggingNodeId === node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${node.position.x}, ${node.position.y})`}
                className={isDragging ? "cursor-grabbing" : "cursor-grab"}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleNodeMouseDown(node.id, e);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Get mouse position relative to viewport
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  
                  // Calculate position relative to container
                  const scrollContainer = containerRef.current;
                  const scrollLeft = scrollContainer?.scrollLeft || 0;
                  const scrollTop = scrollContainer?.scrollTop || 0;
                  
                  // Position context menu at mouse location
                  setContextMenuPosition({
                    x: e.clientX,
                    y: e.clientY,
                  });
                  setContextMenuNodeId(node.id);
                }}
              >
                {/* Node circle */}
                <circle
                  r="30"
                  fill={isPerspective 
                    ? "var(--color-df-success)" 
                    : isSelected 
                    ? "var(--color-df-node-selected)" 
                    : "var(--color-df-node-bg)"}
                  stroke={isSelected 
                    ? "var(--color-df-node-selected)" 
                    : "var(--color-df-node-border)"}
                  strokeWidth={isSelected ? "3" : "2"}
                  className="hover:opacity-80"
                />
                
                {/* Character name */}
                <text
                  y="5"
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--color-df-text-primary)"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {character?.name.substring(0, 8) || node.id.substring(0, 8)}
                </text>

                {/* Remove button (if not perspective) */}
                {!isPerspective && (
                  <circle
                    r="8"
                    cx="20"
                    cy="-20"
                    fill="var(--color-df-error)"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.setAttribute('fill', 'var(--color-df-error)');
                      e.currentTarget.style.opacity = '0.8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.setAttribute('fill', 'var(--color-df-error)');
                      e.currentTarget.style.opacity = '1';
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Remove ${character?.name || node.id} from graph?`)) {
                        handleRemoveNode(node.id);
                      }
                    }}
                  >
                    <title>Remove character</title>
                  </circle>
                )}

                {/* Add relationship button (only on perspective character, and only if active character is set) */}
                {isPerspective && activeCharacterId && availableRelationshipTargets.length > 0 && (
                  <g>
                    <circle
                      r="8"
                      cx="20"
                      cy="-20"
                      fill="var(--color-df-info)"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAddingRelationship(true);
                      }}
                    >
                      <title>Add relationship</title>
                    </circle>
                    <text
                      x="20"
                      y="-20"
                      textAnchor="middle"
                      fontSize="10"
                      fill="white"
                      className="pointer-events-none"
                    >
                      +
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Instructions overlay */}
        {!activeCharacterId ? (
          <div className="absolute top-4 left-4 bg-white/90 p-3 rounded-md shadow-sm text-sm max-w-xs z-20">
            <div className="font-semibold mb-2">Getting Started</div>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>• Right-click a character in the sidebar and select "Edit" to load their graph</li>
              <li>• Or drag characters from the sidebar onto the graph</li>
            </ul>
          </div>
        ) : graph.nodes.length === 1 && graph.edges.length === 0 ? (
          <div className="absolute top-4 left-4 bg-white/90 p-3 rounded-md shadow-sm text-sm max-w-xs z-20">
            <div className="font-semibold mb-2">Getting Started</div>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>• Drag characters from the sidebar to add them to the graph</li>
              <li>• Click the blue button on the green node to add relationships</li>
              <li>• Click relationships to edit labels</li>
              <li>• Drag nodes to reposition them</li>
            </ul>
          </div>
        ) : null}

          {/* Right Side Panel Container */}
          <div className="absolute top-0 right-0 h-full w-64 z-20 shadow-lg flex flex-col bg-background">
            {/* Character Sidebar */}
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
            
            {/* Selected Character Details Panel - Below sidebar */}
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
              currentLabel={editingEdgeId ? graph.edges.find(e => e.id === editingEdgeId)?.data?.label || '' : ''}
              currentWhy={editingEdgeId ? graph.edges.find(e => e.id === editingEdgeId)?.data?.why || '' : ''}
              onConfirm={(label, why) => {
                if (editingEdgeId) {
                  handleUpdateEdgeLabel(editingEdgeId, label, why);
                }
                setEditingEdgeId(null);
              }}
            />

            {/* Context Menu Portal for Node Right-Click */}
            {contextMenuNodeId && contextMenuPosition && typeof window !== 'undefined' && createPortal(
              <div
                className="fixed z-50 bg-popover border border-border rounded-md shadow-md min-w-[180px] py-1"
                style={{
                  left: contextMenuPosition.x,
                  top: contextMenuPosition.y,
                }}
                onClick={(e) => e.stopPropagation()}
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
            )}
          </div>
        );
      }
