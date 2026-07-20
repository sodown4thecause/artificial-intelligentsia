import { ActionMetadata, PermissionClass } from "./types.js";

/** A registered tool action, including the permission class it declares. */
export interface ToolDefinition extends ActionMetadata {
  name: string;
}

/**
 * Registry for executable tools. Registration requires permission metadata so an
 * unclassified tool cannot bypass the approval gate.
 */
export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.id)) {
      throw new Error(`A tool with id "${tool.id}" is already registered.`);
    }

    this.tools.set(tool.id, Object.freeze({ ...tool }));
  }

  get(toolId: string): ToolDefinition | undefined {
    return this.tools.get(toolId);
  }

  has(toolId: string): boolean {
    return this.tools.has(toolId);
  }
}

/** Convenience declaration helper for tools that only need an id and class. */
export function defineTool(
  id: string,
  name: string,
  permissionClass: PermissionClass,
): ToolDefinition {
  return { id, name, permissionClass };
}
