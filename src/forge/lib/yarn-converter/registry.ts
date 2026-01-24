/**
 * Node Handler Registry
 * 
 * Central registry for mapping ForgeNodeType to handlers.
 * Uses the Registry pattern to allow easy extension of new node types.
 */

import type { ForgeNodeType } from '@/forge/types/forge-graph';
import type { NodeHandler } from './types';

/**
 * NodeHandlerRegistry - Maps node types to handlers
 * 
 * Provides a central place to register and retrieve node handlers.
 * Makes it easy to add new node types by registering a handler.
 */
export class NodeHandlerRegistry {
  private handlers: Map<ForgeNodeType, NodeHandler> = new Map();

  /**
   * Register a handler for a node type
   * 
   * @param nodeType - The ForgeNodeType this handler handles
   * @param handler - The handler instance
   */
  registerHandler(nodeType: ForgeNodeType, handler: NodeHandler): void {
    this.handlers.set(nodeType, handler);
  }

  /**
   * Get handler for a node type
   * 
   * @param nodeType - The ForgeNodeType to get handler for
   * @returns Handler instance, or throws if not found
   */
  getHandler(nodeType: ForgeNodeType): NodeHandler {
    const handler = this.handlers.get(nodeType);
    if (!handler) {
      throw new Error(`No handler registered for node type: ${nodeType}`);
    }
    return handler;
  }

  /**
   * Check if a handler exists for a node type
   * 
   * @param nodeType - The ForgeNodeType to check
   * @returns True if handler exists
   */
  hasHandler(nodeType: ForgeNodeType): boolean {
    return this.handlers.has(nodeType);
  }

  /**
   * Get all registered node types
   * 
   * @returns Array of registered ForgeNodeType values
   */
  getRegisteredTypes(): ForgeNodeType[] {
    return Array.from(this.handlers.keys());
  }
}

/**
 * Default registry instance
 * 
 * This is the global registry that will be populated with handlers.
 * Handlers should register themselves with this instance.
 */
export const defaultRegistry = new NodeHandlerRegistry();
