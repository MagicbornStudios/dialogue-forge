/**
 * Forge Workspace Action Types
 * 
 * Type definitions for workspace-level CopilotKit actions.
 */

import type { Parameter } from '@copilotkit/shared';
import type { FrontendAction } from '@copilotkit/react-core';

/**
 * Parameters for getCurrentGraph action (no parameters)
 */
export type GetCurrentGraphParameters = [];

/**
 * Parameters for listGraphs action (no parameters)
 */
export type ListGraphsParameters = [];

/**
 * Parameters for switchGraph action
 */
export type SwitchGraphParameters = [
  {
    name: 'graphId';
    type: 'string';
    description: string;
    required: true;
  },
  {
    name: 'scope';
    type: 'string';
    description: string;
    required: false;
  },
];

/**
 * Parameters for getFlagSchema action (no parameters)
 */
export type GetFlagSchemaParameters = [];

/**
 * Parameters for getGameState action (no parameters)
 */
export type GetGameStateParameters = [];

/**
 * Action type definitions
 */
export type GetCurrentGraphAction = FrontendAction<GetCurrentGraphParameters>;
export type ListGraphsAction = FrontendAction<ListGraphsParameters>;
export type SwitchGraphAction = FrontendAction<SwitchGraphParameters>;
export type GetFlagSchemaAction = FrontendAction<GetFlagSchemaParameters>;
export type GetGameStateAction = FrontendAction<GetGameStateParameters>;
