import { exec } from "child_process";
import { promisify } from "util";
import type { Tool } from "./index.js";
import { log } from "../utils/logger.js";
import * as path from "path";

const execAsync = promisify(exec);

export const youtubeAnalyzerTool: Tool = {
    name: "analyze_youtube_video",
    description: "Fetches the full text transcript of a YouTube video so you can 'watch' it. Use this immediately when the user provides a YouTube URL or asks questions about a video. This tool automatically runs a python extraction script.",
    inputSchema: {
        type: "object",
        properties: {
            urlOrId: {
                type: "string",
                description: "The full YouTube URL or simply the Video ID.",
            },
        },
        required: ["urlOrId"],
    },
    execute: async (input: Record<string, unknown>) => {
        const urlOrId = input.urlOrId as string;
        if (!urlOrId) return "Error: urlOrId is required.";

        try {
            log.info("Executing analyze_youtube_video tool", { input: urlOrId });
            // Execute the python script. It is located at apps/bot/scripts/yt_fetch.py
            const scriptPath = path.resolve(process.cwd(), "scripts", "yt_fetch.py");

            // Use python3 to ensure compatibility with debian slim / Railway
            const { stdout, stderr } = await execAsync(`python3 "${scriptPath}" "${urlOrId}"`);

            if (stderr && stderr.toLowerCase().includes("error")) {
                return `Error extracting transcript: ${stderr}`;
            }

            return stdout || "No transcript found.";
        } catch (error) {
            return `Execution Error: ${error instanceof Error ? error.message : String(error)}`;
        }
    },
};
