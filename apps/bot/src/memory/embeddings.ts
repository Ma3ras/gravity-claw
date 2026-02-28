import { config } from "../config.js";
import { log } from "../utils/logger.js";

const EMBEDDING_DIM = 768;

/**
 * Generate a vector embedding using a configurable cloud API.
 *
 * Supports any OpenAI-compatible embedding endpoint:
 * - Jina AI (free, 1M tokens): https://api.jina.ai/v1
 * - Ollama cloud: configured via EMBEDDING_BASE_URL
 * - OpenAI, Voyage, etc.
 *
 * Returns a Float32Array of EMBEDDING_DIM dimensions.
 */
export async function embed(text: string): Promise<Float32Array> {
    const baseUrl = config.embeddingBaseUrl;
    const model = config.embeddingModel;
    const apiKey = config.embeddingApiKey;

    const response = await fetch(`${baseUrl}/v1/embeddings`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            input: text,
        }),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Embedding failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as {
        data: Array<{ embedding: number[] }>;
    };

    if (!data.data || data.data.length === 0 || !data.data[0]?.embedding) {
        throw new Error("Embedding response missing data array");
    }

    return new Float32Array(data.data[0].embedding);
}

/**
 * Compute cosine similarity between two vectors.
 * Returns a value between -1 and 1 (1 = identical meaning).
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) {
        log.warn("Vector dimensions mismatch, returning 0 similarity", { aLen: a.length, bLen: b.length });
        return 0; // Don't crash when switching embedding providers
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i]! * b[i]!;
        normA += a[i]! * a[i]!;
        normB += b[i]! * b[i]!;
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
}

/**
 * Convert a Float32Array to a Buffer for SQLite BLOB storage.
 */
export function embeddingToBuffer(embedding: Float32Array): Buffer {
    return Buffer.from(embedding.buffer, embedding.byteOffset, embedding.byteLength);
}

/**
 * Convert a SQLite BLOB Buffer back to a Float32Array.
 */
export function bufferToEmbedding(buffer: Buffer): Float32Array {
    return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / Float32Array.BYTES_PER_ELEMENT);
}

export { EMBEDDING_DIM };
