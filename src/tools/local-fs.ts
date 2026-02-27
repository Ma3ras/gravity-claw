import type { Tool } from "./index.js";
import { log } from "../utils/logger.js";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Local fs tools operate within this space
const ALLOWED_ROOT = path.resolve("d:\\ai");

function getSafePath(relativePath: string): string {
    if (!relativePath) throw new Error("Filepath is required.");
    const absolutePath = path.resolve(ALLOWED_ROOT, relativePath);
    if (!absolutePath.startsWith(ALLOWED_ROOT)) {
        throw new Error(`Security Violation: Path ${absolutePath} is outside the allowed root directory ${ALLOWED_ROOT}`);
    }
    return absolutePath;
}

export function createLocalFsTools(): Tool[] {
    return [
        {
            name: "local_read_file",
            description: "Read a local file instantly on the PC. Path is relative to the d:\\ai directory.",
            inputSchema: {
                type: "object",
                properties: {
                    filepath: {
                        type: "string",
                        description: "Relative file path (e.g. 'gravity-claw/src/index.ts')",
                    },
                },
                required: ["filepath"],
            },
            execute: async (input: Record<string, unknown>) => {
                const filepath = input.filepath as string;
                if (!filepath) return "Error: filepath is required.";
                try {
                    const safePath = getSafePath(filepath);
                    return await fs.promises.readFile(safePath, "utf-8");
                } catch (error) {
                    return `Error: ${error instanceof Error ? error.message : String(error)}`;
                }
            },
        },
        {
            name: "local_write_file",
            description: "Write or overwrite a local file instantly. Specify the COMPLETE new content. Path is relative to d:\\ai.",
            inputSchema: {
                type: "object",
                properties: {
                    filepath: {
                        type: "string",
                        description: "Relative file path (e.g. 'gravity-claw/src/new.ts')",
                    },
                    content: {
                        type: "string",
                        description: "The complete new content of the file.",
                    }
                },
                required: ["filepath", "content"],
            },
            execute: async (input: Record<string, unknown>) => {
                const filepath = input.filepath as string;
                const content = input.content as string;
                if (!filepath || !content) return "Error: filepath and content are required.";
                try {
                    const safePath = getSafePath(filepath);
                    await fs.promises.mkdir(path.dirname(safePath), { recursive: true });
                    await fs.promises.writeFile(safePath, content, "utf-8");
                    return `Successfully wrote to ${filepath}`;
                } catch (error) {
                    return `Error: ${error instanceof Error ? error.message : String(error)}`;
                }
            },
        },
        {
            name: "local_run_command",
            description: "Run a bash/cmd command instantly on the local PC inside the d:\\ai directory. Use this to run compilers like `npx tsc`.",
            inputSchema: {
                type: "object",
                properties: {
                    command: {
                        type: "string",
                        description: "The command to run locally.",
                    },
                },
                required: ["command"],
            },
            execute: async (input: Record<string, unknown>) => {
                const command = input.command as string;
                if (!command) return "Error: command is required.";
                try {
                    log.warn("Executing local command", { command });
                    const { stdout, stderr } = await execAsync(command, { cwd: ALLOWED_ROOT });
                    return `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
                } catch (error) {
                    return `Error: ${error instanceof Error ? error.message : String(error)}`;
                }
            },
        },
        {
            name: "local_list_dir",
            description: "List the contents of a directory to see files and subdirectories. Path is relative to d:\\ai.",
            inputSchema: {
                type: "object",
                properties: {
                    dirpath: {
                        type: "string",
                        description: "Relative directory path (use '.' for the root d:\\ai, or 'gravity-claw' for the project).",
                    },
                },
                required: ["dirpath"],
            },
            execute: async (input: Record<string, unknown>) => {
                const dirpath = input.dirpath as string;
                if (!dirpath) return "Error: dirpath is required.";
                try {
                    const safePath = getSafePath(dirpath);
                    const files = await fs.promises.readdir(safePath, { withFileTypes: true });
                    return files.map(f => `${f.isDirectory() ? '[DIR]' : '[FILE]'} ${f.name}`).join("\n");
                } catch (error) {
                    return `Error: ${error instanceof Error ? error.message : String(error)}`;
                }
            },
        }
    ];
}
