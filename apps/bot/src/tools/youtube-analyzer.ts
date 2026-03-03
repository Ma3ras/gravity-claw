import type { Tool } from "./index.js";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { fileURLToPath } from "url";

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const youtubeAnalyzerTool: Tool = {
    name: "analyze_youtube_video",
    description: "Analyze a YouTube video URL to extract transcript, chapters, metadata, key insights, and actionable items. You can also specify a section like 'point 4' or request the full transcript.",
    inputSchema: {
        type: "object",
        properties: {
            url: {
                type: "string",
                description: "The YouTube video URL (e.g., https://youtube.com/watch?v=... or https://youtu.be/...)",
            },
            section: {
                type: "string",
                description: "(Optional) A specific chapter, point, or section to analyze, e.g., 'point 4' or 'Chapter 2'",
            },
            fullTranscript: {
                type: "boolean",
                description: "(Optional) Set to true to retrieve the entire video transcript. Default is false to save tokens.",
            }
        },
        required: ["url"],
    },
    async execute(args: Record<string, unknown>): Promise<string> {
        const url = String(args.url || "");
        if (!url) return "Error: YouTube URL is required.";

        const section = args.section ? String(args.section) : null;
        const fullTranscript = Boolean(args.fullTranscript);

        const scriptPath = path.join(__dirname, "youtube", "analyze-yt.js");

        let command = `node "${scriptPath}" "${url}" --markdown`;
        if (section) {
            command += ` --section "${section.replace(/"/g, '\\"')}"`;
        }
        if (fullTranscript) {
            command += ` --full-transcript`;
        }

        try {
            const { stdout, stderr } = await execPromise(command, { maxBuffer: 10 * 1024 * 1024 });
            if (stderr && !stdout) {
                return `Error analyzing video:\n${stderr}`;
            }
            return stdout.trim();
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            return `Failed to analyze YouTube video:\n${msg}`;
        }
    },
};
