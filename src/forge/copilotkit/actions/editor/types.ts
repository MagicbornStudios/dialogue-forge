/**
 * Forge Editor Action Types
 * 
 * Type definitions for editor-level CopilotKit actions (graph editor).
 */

import type { Parameter } from '@copilotkit/shared';
import type { FrontendAction } from '@copilotkit/react-core';

/**
 * Parameters for createNode action
 */
export type CreateNodeParameters = [
  {
    name: 'nodeType';
    type: 'string';
    description: string;
    required: true;
  },
  {
    name: 'x';
    type: 'number';
    description: string;
    required: false;
  },
  {
    name: 'y';
    type: 'number';
    description: string;
    required: false;
  },
  {
    name: 'autoFocus';
    type: 'boolean';
    description: string;
    required: false;
  },
];

/**
 * Parameters for deleteNode action
 */
export type DeleteNodeParameters = [
  {
    name: 'nodeId';
    type: 'string';
    description: string;
    required: true;
  },
];

/**
 * Parameters for updateNode action
 */
export type UpdateNodeParameters = [
  {
    name: 'nodeId';
    type: 'string';
    description: string;
    required: true;
  },
  {
    name: 'updates';
    type: 'object';
    description: string;
    required: true;
  },
];

/**
 * Parameters for createEdge action
 */
export type CreateEdgeParameters = [
  {
    name: 'sourceNodeId';
    type: 'string';
    description: string;
    required: true;
  },
  {
    name: 'targetNodeId';
    type: 'string';
    description: string;
    required: true;
  },
  {
    name: 'sourceHandle';
    type: 'string';
    description: string;
    required: false;
  },
  {
    name: 'targetHandle';
    type: 'string';
    description: string;
    required: false;
  },
];

/**
 * Parameters for deleteEdge action
 */
export type DeleteEdgeParameters = [
  {
    name: 'edgeId';
    type: 'string';
    description: string;
    required: true;
  },
];

/**
 * Parameters for focusNode action
 */
export type FocusNodeParameters = [
  {
    name: 'nodeId';
    type: 'string';
    description: string;
    required: true;
  },
];

/**
 * Parameters for createAndConnectNode action
 */
export type CreateAndConnectNodeParameters = [
  {
    name: 'nodeType';
    type: 'string';
    description: string;
    required: true;
  },
  {
    name: 'sourceNodeId';
    type: 'string';
    description: string;
    required: true;
  },
  {
    name: 'x';
    type: 'number';
    description: string;
    required: false;
  },
  {
    name: 'y';
    type: 'number';
    description: string;
    required: false;
  },
  {
    name: 'autoFocus';
    type: 'boolean';
    description: string;
    required: false;
  },
];

/**
 * Action type definitions
 */
export type CreateNodeAction = FrontendAction<CreateNodeParameters>;
export type DeleteNodeAction = FrontendAction<DeleteNodeParameters>;
export type UpdateNodeAction = FrontendAction<UpdateNodeParameters>;
export type CreateEdgeAction = FrontendAction<CreateEdgeParameters>;
export type DeleteEdgeAction = FrontendAction<DeleteEdgeParameters>;
export type FocusNodeAction = FrontendAction<FocusNodeParameters>;
export type CreateAndConnectNodeAction = FrontendAction<CreateAndConnectNodeParameters>;
