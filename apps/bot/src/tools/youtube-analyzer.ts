import type { Tool } from "./index.js";
import { log } from "../utils/logger.js";
import { YoutubeTranscript } from "youtube-transcript";

export const youtubeAnalyzerTool: Tool = {
    name: "analyze_youtube_video",
    description: "Fetches the full text transcript of a YouTube video so you can 'watch' it. Use this immediately when the user provides a YouTube URL, video ID, or asks questions about a video.",
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

            // Extract Video ID to make it more reliable
            let videoId = urlOrId;
            if (urlOrId.includes("v=")) {
                videoId = urlOrId.split("v=")[1].split("&")[0];
            } else if (urlOrId.includes("youtu.be/")) {
                videoId = urlOrId.split("youtu.be/")[1].split("?")[0];
            }

            // Using the native npm package:
            const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);

            if (!transcriptData || transcriptData.length === 0) {
                return "Error: The transcript returned empty. Video might not have closed captions enabled.";
            }

            const fullText = transcriptData.map(t => t.text).join(" ");
            return fullText;

        } catch (error) {
            return `Error extracting transcript: ${error instanceof Error ? error.message : String(error)}. The video might not have closed captions enabled, or they are auto-generated and restricted.`;
        }
    },
};
