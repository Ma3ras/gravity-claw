import type { Client } from "@libsql/client";
import { log } from "../utils/logger.js";
import {
    embed,
    cosineSimilarity,
    embeddingToBuffer,
    bufferToEmbedding,
} from "./embeddings.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface MemoryMessage {
    id: number;
    role: "user" | "assistant";
    content: string;
    session_id: string;
    created_at: string;
}

export interface MemoryFact {
    id: number;
    content: string;
    category: string;
    created_at: string;
    updated_at: string;
}

export interface MemorySearchResult {
    type: "message" | "fact" | "session";
    content: string;
    score: number;
    category?: string;
    created_at: string;
}

// ── Memory Manager ──────────────────────────────────────────────────────────

const SIMILARITY_THRESHOLD = 0.85;
const FACT_SEARCH_LIMIT = 10;

export class MemoryManager {
    private db: Client;

    constructor(db: Client) {
        this.db = db;
    }

    // ── Tier 1: Conversation Logging ──────────────────────────────────────

    async logMessage(role: "user" | "assistant", content: string, sessionId: string): Promise<number> {
        // Ensure session exists
        await this.db.execute({
            sql: `INSERT OR IGNORE INTO sessions (id, started_at, message_count) VALUES (?, datetime('now'), 0)`,
            args: [sessionId],
        });

        const result = await this.db.execute({
            sql: `INSERT INTO messages (role, content, session_id) VALUES (?, ?, ?)`,
            args: [role, content, sessionId],
        });

        return Number(result.lastInsertRowid);
    }

    async getRecentMessages(sessionId: string, limit = 20): Promise<MemoryMessage[]> {
        const result = await this.db.execute({
            sql: `SELECT id, role, content, session_id, created_at
                  FROM messages
                  WHERE session_id = ?
                  ORDER BY created_at DESC
                  LIMIT ?`,
            args: [sessionId, limit],
        });

        const rows = result.rows.map((r) => ({
            id: Number(r.id),
            role: r.role as "user" | "assistant",
            content: r.content as string,
            session_id: r.session_id as string,
            created_at: r.created_at as string,
        }));

        return rows.reverse(); // Oldest first for context
    }

    async getSessionMessageCount(sessionId: string): Promise<number> {
        const result = await this.db.execute({
            sql: `SELECT COUNT(*) as count FROM messages WHERE session_id = ?`,
            args: [sessionId],
        });
        return Number(result.rows[0]?.count ?? 0);
    }

    async getOlderMessages(sessionId: string, count: number): Promise<MemoryMessage[]> {
        const result = await this.db.execute({
            sql: `SELECT id, role, content, session_id, created_at
                  FROM messages
                  WHERE session_id = ?
                  ORDER BY created_at ASC
                  LIMIT ?`,
            args: [sessionId, count],
        });

        return result.rows.map((r) => ({
            id: Number(r.id),
            role: r.role as "user" | "assistant",
            content: r.content as string,
            session_id: r.session_id as string,
            created_at: r.created_at as string,
        }));
    }

    async getSessionSummary(sessionId: string): Promise<string | null> {
        const result = await this.db.execute({
            sql: `SELECT summary FROM sessions WHERE id = ?`,
            args: [sessionId],
        });
        return (result.rows[0]?.summary as string | null) ?? null;
    }

    // ── Tier 2: Semantic Facts ────────────────────────────────────────────

    async saveFact(
        content: string,
        category: string = "general",
        sourceMessageId?: number
    ): Promise<{ action: "added" | "updated" | "skipped"; factId: number }> {
        let newEmbedding: Float32Array;
        try {
            newEmbedding = await embed(content);
        } catch (error) {
            log.warn("Failed to generate embedding, saving fact without vector", {
                error: error instanceof Error ? error.message : String(error),
            });
            const result = await this.db.execute({
                sql: `INSERT INTO facts (content, category, source_message_id) VALUES (?, ?, ?)`,
                args: [content, category, sourceMessageId ?? null],
            });
            return { action: "added", factId: Number(result.lastInsertRowid) };
        }

        // Check for duplicate/similar facts
        const existingFacts = await this.db.execute(
            `SELECT id, content, category, embedding, created_at, updated_at FROM facts`
        );

        let bestMatch: { id: number; similarity: number } | null = null;

        for (const fact of existingFacts.rows) {
            if (!fact.embedding) continue;
            const buf = typeof fact.embedding === "string"
                ? Buffer.from(fact.embedding, "base64")
                : Buffer.from(fact.embedding as ArrayBuffer);
            const existingEmbedding = bufferToEmbedding(buf);
            const similarity = cosineSimilarity(newEmbedding, existingEmbedding);

            if (similarity > SIMILARITY_THRESHOLD && (!bestMatch || similarity > bestMatch.similarity)) {
                bestMatch = { id: Number(fact.id), similarity };
            }
        }

        const embeddingBuf = embeddingToBuffer(newEmbedding);

        if (bestMatch) {
            await this.db.execute({
                sql: `UPDATE facts SET content = ?, category = ?, embedding = ?, updated_at = datetime('now') WHERE id = ?`,
                args: [content, category, embeddingBuf, bestMatch.id],
            });
            log.info("Updated existing fact (dedup)", {
                factId: bestMatch.id,
                similarity: bestMatch.similarity.toFixed(3),
            });
            return { action: "updated", factId: bestMatch.id };
        }

        const result = await this.db.execute({
            sql: `INSERT INTO facts (content, category, embedding, source_message_id) VALUES (?, ?, ?, ?)`,
            args: [content, category, embeddingBuf, sourceMessageId ?? null],
        });
        log.info("Saved new fact", { factId: Number(result.lastInsertRowid), category });
        return { action: "added", factId: Number(result.lastInsertRowid) };
    }

    async searchFactsBySemantic(query: string, limit = FACT_SEARCH_LIMIT): Promise<MemorySearchResult[]> {
        let queryEmbedding: Float32Array;
        try {
            queryEmbedding = await embed(query);
        } catch (error) {
            log.warn("Failed to generate query embedding", {
                error: error instanceof Error ? error.message : String(error),
            });
            return [];
        }

        const allFacts = await this.db.execute(
            `SELECT id, content, category, embedding, created_at, updated_at FROM facts`
        );

        const scored: MemorySearchResult[] = [];

        for (const fact of allFacts.rows) {
            if (!fact.embedding) continue;
            const buf = typeof fact.embedding === "string"
                ? Buffer.from(fact.embedding, "base64")
                : Buffer.from(fact.embedding as ArrayBuffer);
            const factEmbedding = bufferToEmbedding(buf);
            const score = cosineSimilarity(queryEmbedding, factEmbedding);

            if (score > 0.3) {
                scored.push({
                    type: "fact",
                    content: fact.content as string,
                    score,
                    category: fact.category as string,
                    created_at: fact.created_at as string,
                });
            }
        }

        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    // ── Hybrid Search ─────────────────────────────────────────────────────

    async recall(query: string, limit = 10): Promise<MemorySearchResult[]> {
        const results: MemorySearchResult[] = [];

        // 1. Keyword search on messages (LIKE-based, since Turso doesn't support FTS5)
        try {
            const keywords = query.split(/\s+/).filter(Boolean).slice(0, 5);
            if (keywords.length > 0) {
                const conditions = keywords.map(() => `content LIKE ?`).join(" OR ");
                const args = keywords.map((k) => `%${k}%`);

                const ftsResults = await this.db.execute({
                    sql: `SELECT id, role, content, session_id, created_at
                          FROM messages
                          WHERE ${conditions}
                          ORDER BY created_at DESC
                          LIMIT 10`,
                    args,
                });

                for (const row of ftsResults.rows) {
                    results.push({
                        type: "message",
                        content: `[${row.role}] ${row.content}`,
                        score: 0.5, // Fixed score for keyword matches
                        created_at: row.created_at as string,
                    });
                }
            }
        } catch (error) {
            log.debug("Keyword search failed", {
                error: error instanceof Error ? error.message : String(error),
            });
        }

        // 2. Semantic vector search on facts
        const semanticResults = await this.searchFactsBySemantic(query, limit);
        results.push(...semanticResults);

        // 3. Deduplicate and sort by score
        const seen = new Set<string>();
        const unique = results.filter((r) => {
            const key = r.content.substring(0, 100);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        return unique
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    // ── Tier 3: Session Management ────────────────────────────────────────

    async saveSessionSummary(sessionId: string, summary: string): Promise<void> {
        const countResult = await this.db.execute({
            sql: `SELECT COUNT(*) as count FROM messages WHERE session_id = ?`,
            args: [sessionId],
        });
        const count = Number(countResult.rows[0]?.count ?? 0);

        await this.db.execute({
            sql: `UPDATE sessions SET summary = ?, message_count = ?, ended_at = datetime('now') WHERE id = ?`,
            args: [summary, count, sessionId],
        });
        log.info("Saved session summary", { sessionId, messageCount: count });
    }

    // ── Stats ─────────────────────────────────────────────────────────────

    async getStats(): Promise<{ messages: number; facts: number; sessions: number }> {
        const [m, f, s] = await Promise.all([
            this.db.execute("SELECT COUNT(*) as c FROM messages"),
            this.db.execute("SELECT COUNT(*) as c FROM facts"),
            this.db.execute("SELECT COUNT(*) as c FROM sessions"),
        ]);
        return {
            messages: Number(m.rows[0]?.c ?? 0),
            facts: Number(f.rows[0]?.c ?? 0),
            sessions: Number(s.rows[0]?.c ?? 0),
        };
    }
}
