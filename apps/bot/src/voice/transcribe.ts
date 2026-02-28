import OpenAI from "openai";
import { config } from "../config.js";
import { log } from "../utils/logger.js";

/**
 * Transcribe audio using Groq's Whisper API (OpenAI-compatible).
 *
 * Groq supports: whisper-large-v3, whisper-large-v3-turbo, distil-whisper-large-v3-en
 * whisper-large-v3-turbo is the best balance of speed and accuracy.
 */

const WHISPER_MODEL = "whisper-large-v3-turbo";

let groqClient: OpenAI | null = null;

function getGroqClient(): OpenAI {
    if (!groqClient) {
        if (!config.groqApiKey) {
            throw new Error("GROQ_API_KEY is not set — voice transcription is disabled.");
        }
        groqClient = new OpenAI({
            baseURL: "https://api.groq.com/openai/v1",
            apiKey: config.groqApiKey,
        });
    }
    return groqClient;
}

/**
 * Transcribe an audio buffer to text.
 *
 * @param audioBuffer - The audio file as a Buffer
 * @param filename - Original filename (helps Whisper detect format)
 * @returns The transcribed text
 */
export async function transcribeAudio(
    audioBuffer: Buffer,
    filename: string = "voice.ogg"
): Promise<string> {
    const client = getGroqClient();

    log.info("Transcribing audio", { size: audioBuffer.length, filename });

    // Telegram sends .oga files — Groq only accepts .ogg/.opus
    // They are the same format, just rename the extension
    const safeFilename = filename.replace(/\.oga$/, ".ogg");
    const uint8 = new Uint8Array(audioBuffer);
    const file = new File([uint8], safeFilename, { type: "audio/ogg" });

    const transcription = await client.audio.transcriptions.create({
        file,
        model: WHISPER_MODEL,
        response_format: "text",
    });

    const text = typeof transcription === "string"
        ? transcription
        : (transcription as unknown as { text: string }).text;

    log.info("Transcription complete", { textLength: text.length });
    return text.trim();
}

/**
 * Check if voice transcription is available.
 */
export function isVoiceEnabled(): boolean {
    return !!config.groqApiKey;
}
