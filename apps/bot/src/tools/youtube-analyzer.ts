import type { Tool } from "./index.js";
import { analyze } from "./youtube/analyze-yt.js";

export const youtubeAnalyzerTool: Tool = {
    name: "youtube_analyzer",
    description: "Analyze YouTube videos end-to-end to extract metadata, chapters, transcripts, summaries, and key points. Use when providing detailed breakdowns or answering questions about specific YouTube video content.",
    inputSchema: {
        type: "object",
        properties: {
            videoInput: {
                type: "string",
                description: "The YouTube Video URL or ID to analyze."
            },
            sectionQuery: {
                type: "string",
                description: "Optional. Request a specific section (e.g., 'point 4', 'chapter 2', 'kapitel 1')."
            },
            includeTranscript: {
                type: "boolean",
                description: "Include full transcript in output. Recommend leaving false unless specifically requested or searching for exact quotes across the entire video."
            },
            noCache: {
                type: "boolean",
                description: "Ignore cached analysis and fetch fresh data."
            }
        },
        required: ["videoInput"]
    },
    async execute(input: Record<string, unknown>): Promise<string> {
        const videoInput = input.videoInput as string;
        const options = {
            asJson: false,
            sectionQuery: (input.sectionQuery as string) || null,
            includeTranscript: (input.includeTranscript as boolean) || false,
            noCache: (input.noCache as boolean) || false
        };

        try {
            const result = await analyze(videoInput, options);
            return JSON.stringify(result, null, 2);
        } catch (error) {
            return `YouTube Analyzer Error: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
};
