/**
 * Tool interface — every tool implements this.
 */
export interface Tool {
    /** Unique tool name (lowercase, underscores) */
    name: string;

    /** Human-readable description for the LLM */
    description: string;

    /** JSON Schema for the tool's input parameters */
    inputSchema: {
        type: "object";
        properties: Record<string, unknown>;
        required?: string[];
    };

    /** Execute the tool and return a string result */
    execute(input: Record<string, unknown>): Promise<string>;
}

/**
 * Tool registry — manages all available tools.
 */
export class ToolRegistry {
    private tools = new Map<string, Tool>();

    register(tool: Tool): void {
        if (this.tools.has(tool.name)) {
            throw new Error(`Tool "${tool.name}" is already registered`);
        }
        this.tools.set(tool.name, tool);
    }

    get(name: string): Tool | undefined {
        return this.tools.get(name);
    }

    getAll(): Tool[] {
        return Array.from(this.tools.values());
    }

    async execute(name: string, input: Record<string, unknown>): Promise<string> {
        const tool = this.tools.get(name);
        if (!tool) {
            return `Error: Unknown tool "${name}". Available tools: ${Array.from(this.tools.keys()).join(", ")}`;
        }

        try {
            return await tool.execute(input);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return `Error executing tool "${name}": ${message}`;
        }
    }
}
