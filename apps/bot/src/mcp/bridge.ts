import { spawn, type ChildProcess } from "node:child_process";
import { readFile } from "node:fs/promises";
import { log } from "../utils/logger.js";
import type { Tool } from "../tools/index.js";

// ── Types ────────────────────────────────────────────────────────────────────

interface McpServerConfig {
    name: string;
    command: string;
    args?: string[];
    env?: Record<string, string>;
}

interface McpConfig {
    servers: McpServerConfig[];
}

interface JsonRpcRequest {
    jsonrpc: "2.0";
    id: number;
    method: string;
    params?: Record<string, unknown>;
}

interface JsonRpcResponse {
    jsonrpc: "2.0";
    id: number;
    result?: unknown;
    error?: { code: number; message: string };
}

interface McpToolSchema {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: Record<string, unknown>;
        required?: string[];
    };
}

// ── MCP Connection ───────────────────────────────────────────────────────────

class McpConnection {
    private process: ChildProcess | null = null;
    private requestId = 0;
    private pendingRequests = new Map<number, {
        resolve: (value: unknown) => void;
        reject: (reason: Error) => void;
    }>();
    private buffer = "";

    constructor(
        private config: McpServerConfig
    ) { }

    async connect(): Promise<void> {
        const env = { ...process.env, ...this.config.env };

        this.process = spawn(this.config.command, this.config.args ?? [], {
            stdio: ["pipe", "pipe", "pipe"],
            env,
        });

        this.process.stdout?.on("data", (data: Buffer) => {
            this.buffer += data.toString();
            this.processBuffer();
        });

        this.process.stderr?.on("data", (data: Buffer) => {
            log.debug(`MCP [${this.config.name}] stderr: ${data.toString().trim()}`);
        });

        this.process.on("exit", (code) => {
            log.warn(`MCP server ${this.config.name} exited`, { code });
            this.process = null;
        });

        // Initialize the connection
        await this.sendRequest("initialize", {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "gravity-claw", version: "1.0.0" },
        });

        // Send initialized notification
        this.sendNotification("notifications/initialized");
        log.info(`MCP server connected: ${this.config.name}`);
    }

    private processBuffer(): void {
        const lines = this.buffer.split("\n");
        this.buffer = lines.pop() ?? "";

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            try {
                const msg = JSON.parse(trimmed) as JsonRpcResponse;
                if (msg.id !== undefined && this.pendingRequests.has(msg.id)) {
                    const pending = this.pendingRequests.get(msg.id)!;
                    this.pendingRequests.delete(msg.id);
                    if (msg.error) {
                        pending.reject(new Error(msg.error.message));
                    } else {
                        pending.resolve(msg.result);
                    }
                }
            } catch {
                // Not valid JSON, skip
            }
        }
    }

    async sendRequest(method: string, params?: Record<string, unknown>): Promise<unknown> {
        if (!this.process?.stdin) {
            throw new Error(`MCP server ${this.config.name} is not connected`);
        }

        const id = ++this.requestId;
        const request: JsonRpcRequest = {
            jsonrpc: "2.0",
            id,
            method,
            params,
        };

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(id);
                reject(new Error(`MCP request timed out: ${method}`));
            }, 30000);

            this.pendingRequests.set(id, {
                resolve: (value) => {
                    clearTimeout(timeout);
                    resolve(value);
                },
                reject: (error) => {
                    clearTimeout(timeout);
                    reject(error);
                },
            });

            this.process!.stdin!.write(JSON.stringify(request) + "\n");
        });
    }

    sendNotification(method: string, params?: Record<string, unknown>): void {
        if (!this.process?.stdin) return;
        const notification = {
            jsonrpc: "2.0",
            method,
            ...(params ? { params } : {}),
        };
        this.process.stdin.write(JSON.stringify(notification) + "\n");
    }

    async listTools(): Promise<McpToolSchema[]> {
        const result = (await this.sendRequest("tools/list")) as { tools: McpToolSchema[] };
        return result.tools ?? [];
    }

    async callTool(name: string, args: Record<string, unknown>): Promise<string> {
        const result = (await this.sendRequest("tools/call", {
            name,
            arguments: args,
        })) as { content: Array<{ type: string; text?: string }> };

        return (
            result.content
                ?.map((c) => c.text ?? "")
                .join("\n") ?? "No result"
        );
    }

    disconnect(): void {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
    }
}

// ── MCP Bridge ───────────────────────────────────────────────────────────────

export class McpBridge {
    private connections = new Map<string, McpConnection>();

    /**
     * Load MCP server configs from a JSON file and connect to each.
     *
     * Config file format (mcp.json):
     * {
     *   "servers": [
     *     {
     *       "name": "filesystem",
     *       "command": "npx",
     *       "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
     *     }
     *   ]
     * }
     */
    async loadFromConfig(configPath: string): Promise<Tool[]> {
        let config: McpConfig;

        try {
            const content = await readFile(configPath, "utf-8");
            config = JSON.parse(content) as McpConfig;
        } catch {
            log.info("No MCP config found, skipping", { path: configPath });
            return [];
        }

        if (!config.servers || config.servers.length === 0) {
            log.info("No MCP servers configured");
            return [];
        }

        const allTools: Tool[] = [];

        for (const serverConfig of config.servers) {
            try {
                const connection = new McpConnection(serverConfig);
                await connection.connect();
                this.connections.set(serverConfig.name, connection);

                // Discover tools from this server
                const mcpTools = await connection.listTools();
                log.info(`MCP server "${serverConfig.name}" provides ${mcpTools.length} tool(s)`, {
                    tools: mcpTools.map((t) => t.name),
                });

                // Convert MCP tools to our Tool format
                for (const mcpTool of mcpTools) {
                    allTools.push(this.wrapMcpTool(serverConfig.name, mcpTool, connection));
                }
            } catch (error) {
                log.error(`Failed to connect to MCP server: ${serverConfig.name}`, {
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }

        return allTools;
    }

    /**
     * Wrap an MCP tool as a local Tool that delegates to the MCP server.
     */
    private wrapMcpTool(
        serverName: string,
        mcpTool: McpToolSchema,
        connection: McpConnection
    ): Tool {
        return {
            name: `mcp_${serverName}_${mcpTool.name}`,
            description: `[MCP/${serverName}] ${mcpTool.description}`,
            inputSchema: mcpTool.inputSchema,
            execute: async (input: Record<string, unknown>): Promise<string> => {
                log.info(`Calling MCP tool: ${serverName}/${mcpTool.name}`, { input });
                try {
                    return await connection.callTool(mcpTool.name, input);
                } catch (error) {
                    const msg = error instanceof Error ? error.message : String(error);
                    log.error("MCP tool call failed", { tool: mcpTool.name, error: msg });
                    return `MCP tool error: ${msg}`;
                }
            },
        };
    }

    /**
     * Disconnect all MCP servers.
     */
    disconnect(): void {
        for (const [name, conn] of this.connections) {
            log.info(`Disconnecting MCP server: ${name}`);
            conn.disconnect();
        }
        this.connections.clear();
    }
}
