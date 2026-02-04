/**
 * Writer Workspace Action Types
 * 
 * Type definitions for workspace-level CopilotKit actions.
 */

import type { Parameter } from '@copilotkit/shared';
import type { FrontendAction } from '@copilotkit/react-core';

/**
 * Parameters for proposeTextEdit action
 */
export type ProposeTextEditParameters = [
  {
    name: 'instruction';
    type: 'string';
    description: string;
    required: true;
  },
];

/**
 * Parameters for getCurrentPage action (no parameters)
 */
export type GetCurrentPageParameters = [];

/**
 * Parameters for listPages action (no parameters)
 */
export type ListPagesParameters = [];

/**
 * Parameters for switchPage action
 */
export type SwitchPageParameters = [
  {
    name: 'pageId';
    type: 'number';
    description: string;
    required: true;
  },
];

/**
 * Action type definitions
 */
export type ProposeTextEditAction = FrontendAction<ProposeTextEditParameters>;
export type GetCurrentPageAction = FrontendAction<GetCurrentPageParameters>;
export type ListPagesAction = FrontendAction<ListPagesParameters>;
export type SwitchPageAction = FrontendAction<SwitchPageParameters>;
