import type Database from "better-sqlite3";
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

const SIMILARITY_THRESHOLD = 0.85; // Consider facts duplicates above this
const FACT_SEARCH_LIMIT = 10;
const MESSAGE_SEARCH_LIMIT = 10;

export class MemoryManager {
    private db: Database.Database;

    // Prepared statements (lazy-initialized)
    private stmtInsertMessage!: Database.Statement;
    private stmtInsertFact!: Database.Statement;
    private stmtUpdateFact!: Database.Statement;
    private stmtGetAllFacts!: Database.Statement;
    private stmtFtsSearch!: Database.Statement;
    private stmtRecentMessages!: Database.Statement;
    private stmtInsertSession!: Database.Statement;
    private stmtUpdateSession!: Database.Statement;
    private stmtSessionMessageCount!: Database.Statement;
    private stmtOlderMessages!: Database.Statement;
    private stmtGetSessionSummary!: Database.Statement;

    constructor(db: Database.Database) {
        this.db = db;
        this.prepareStatements();
    }

    private prepareStatements(): void {
        this.stmtInsertMessage = this.db.prepare(
            `INSERT INTO messages (role, content, session_id) VALUES (?, ?, ?)`
        );

        this.stmtInsertFact = this.db.prepare(
            `INSERT INTO facts (content, category, embedding, source_message_id) VALUES (?, ?, ?, ?)`
        );

        this.stmtUpdateFact = this.db.prepare(
            `UPDATE facts SET content = ?, category = ?, embedding = ?, updated_at = datetime('now') WHERE id = ?`
        );

        this.stmtGetAllFacts = this.db.prepare(
            `SELECT id, content, category, embedding, created_at, updated_at FROM facts`
        );

        this.stmtFtsSearch = this.db.prepare(
            `SELECT m.id, m.role, m.content, m.session_id, m.created_at,
                    rank
             FROM messages_fts fts
             JOIN messages m ON m.id = fts.rowid
             WHERE messages_fts MATCH ?
             ORDER BY rank
             LIMIT ?`
        );

        this.stmtRecentMessages = this.db.prepare(
            `SELECT id, role, content, session_id, created_at
             FROM messages
             WHERE session_id = ?
             ORDER BY created_at DESC
             LIMIT ?`
        );

        this.stmtInsertSession = this.db.prepare(
            `INSERT OR IGNORE INTO sessions (id, started_at, message_count) VALUES (?, datetime('now'), 0)`
        );

        this.stmtUpdateSession = this.db.prepare(
            `UPDATE sessions SET summary = ?, message_count = ?, ended_at = datetime('now') WHERE id = ?`
        );

        this.stmtSessionMessageCount = this.db.prepare(
            `SELECT COUNT(*) as count FROM messages WHERE session_id = ?`
        );

        this.stmtOlderMessages = this.db.prepare(
            `SELECT id, role, content, session_id, created_at
             FROM messages
             WHERE session_id = ?
             ORDER BY created_at ASC
             LIMIT ? OFFSET 0`
        );

        this.stmtGetSessionSummary = this.db.prepare(
            `SELECT summary FROM sessions WHERE id = ?`
        );
    }

    // ── Tier 1: Conversation Logging ──────────────────────────────────────

    /**
     * Store a message in the conversation log.
     */
    logMessage(role: "user" | "assistant", content: string, sessionId: string): number {
        // Ensure session exists
        this.stmtInsertSession.run(sessionId);

        const result = this.stmtInsertMessage.run(role, content, sessionId);
        return result.lastInsertRowid as number;
    }

    /**
     * Get recent messages from the current session (for context injection).
     */
    getRecentMessages(sessionId: string, limit = 20): MemoryMessage[] {
        const rows = this.stmtRecentMessages.all(sessionId, limit) as MemoryMessage[];
        return rows.reverse(); // Oldest first for context
    }

    /**
     * Get total message count for a session.
     */
    getSessionMessageCount(sessionId: string): number {
        const row = this.stmtSessionMessageCount.get(sessionId) as { count: number } | undefined;
        return row?.count ?? 0;
    }

    /**
     * Get older messages (beyond the recent buffer) for summarization.
     */
    getOlderMessages(sessionId: string, count: number): MemoryMessage[] {
        return this.stmtOlderMessages.all(sessionId, count) as MemoryMessage[];
    }

    /**
     * Get stored session summary (if any).
     */
    getSessionSummary(sessionId: string): string | null {
        const row = this.stmtGetSessionSummary.get(sessionId) as { summary: string | null } | undefined;
        return row?.summary ?? null;
    }

    // ── Tier 2: Semantic Facts ────────────────────────────────────────────

    /**
     * Save a fact with automatic deduplication.
     * If a semantically similar fact exists (>85% similarity), updates it instead.
     */
    async saveFact(
        content: string,
        category: string = "general",
        sourceMessageId?: number
    ): Promise<{ action: "added" | "updated" | "skipped"; factId: number }> {
        // Generate embedding for the new fact
        let newEmbedding: Float32Array;
        try {
            newEmbedding = await embed(content);
        } catch (error) {
            log.warn("Failed to generate embedding, saving fact without vector", {
                error: error instanceof Error ? error.message : String(error),
            });
            // Save without embedding — it can be backfilled later
            const result = this.stmtInsertFact.run(content, category, null, sourceMessageId ?? null);
            return { action: "added", factId: result.lastInsertRowid as number };
        }

        // Check for duplicate/similar facts
        const existingFacts = this.stmtGetAllFacts.all() as Array<{
            id: number;
            content: string;
            category: string;
            embedding: Buffer | null;
            created_at: string;
            updated_at: string;
        }>;

        let bestMatch: { id: number; similarity: number } | null = null;

        for (const fact of existingFacts) {
            if (!fact.embedding) continue;
            const existingEmbedding = bufferToEmbedding(fact.embedding);
            const similarity = cosineSimilarity(newEmbedding, existingEmbedding);

            if (similarity > SIMILARITY_THRESHOLD && (!bestMatch || similarity > bestMatch.similarity)) {
                bestMatch = { id: fact.id, similarity };
            }
        }

        const embeddingBuf = embeddingToBuffer(newEmbedding);

        if (bestMatch) {
            // Update existing fact with new content
            this.stmtUpdateFact.run(content, category, embeddingBuf, bestMatch.id);
            log.info("Updated existing fact (dedup)", {
                factId: bestMatch.id,
                similarity: bestMatch.similarity.toFixed(3),
            });
            return { action: "updated", factId: bestMatch.id };
        }

        // Insert new fact
        const result = this.stmtInsertFact.run(content, category, embeddingBuf, sourceMessageId ?? null);
        log.info("Saved new fact", { factId: result.lastInsertRowid, category });
        return { action: "added", factId: result.lastInsertRowid as number };
    }

    /**
     * Search facts by semantic similarity.
     */
    async searchFactsBySemantic(query: string, limit = FACT_SEARCH_LIMIT): Promise<MemorySearchResult[]> {
        let queryEmbedding: Float32Array;
        try {
            queryEmbedding = await embed(query);
        } catch (error) {
            log.warn("Failed to generate query embedding, falling back to FTS", {
                error: error instanceof Error ? error.message : String(error),
            });
            return [];
        }

        const allFacts = this.stmtGetAllFacts.all() as Array<{
            id: number;
            content: string;
            category: string;
            embedding: Buffer | null;
            created_at: string;
            updated_at: string;
        }>;

        const scored: MemorySearchResult[] = [];

        for (const fact of allFacts) {
            if (!fact.embedding) continue;
            const factEmbedding = bufferToEmbedding(fact.embedding);
            const score = cosineSimilarity(queryEmbedding, factEmbedding);

            if (score > 0.3) {
                scored.push({
                    type: "fact",
                    content: fact.content,
                    score,
                    category: fact.category,
                    created_at: fact.created_at,
                });
            }
        }

        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    // ── Hybrid Search ─────────────────────────────────────────────────────

    /**
     * Hybrid recall: combines FTS5 keyword search + vector semantic search.
     * Returns merged, deduplicated, ranked results.
     */
    async recall(query: string, limit = 10): Promise<MemorySearchResult[]> {
        const results: MemorySearchResult[] = [];

        // 1. FTS5 keyword search on messages
        try {
            // Sanitize query for FTS5 — wrap each word in quotes
            const ftsQuery = query
                .split(/\s+/)
                .filter(Boolean)
                .map((w) => `"${w.replace(/"/g, "")}"`)
                .join(" OR ");

            if (ftsQuery) {
                const ftsResults = this.stmtFtsSearch.all(ftsQuery, MESSAGE_SEARCH_LIMIT) as Array<{
                    id: number;
                    role: string;
                    content: string;
                    session_id: string;
                    created_at: string;
                    rank: number;
                }>;

                for (const row of ftsResults) {
                    results.push({
                        type: "message",
                        content: `[${row.role}] ${row.content}`,
                        score: Math.max(0, 1 + row.rank), // FTS5 rank is negative, normalize
                        created_at: row.created_at,
                    });
                }
            }
        } catch (error) {
            log.debug("FTS5 search failed", {
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

    /**
     * Save a session summary.
     */
    saveSessionSummary(sessionId: string, summary: string): void {
        const countRow = this.stmtSessionMessageCount.get(sessionId) as { count: number } | undefined;
        const count = countRow?.count ?? 0;
        this.stmtUpdateSession.run(summary, count, sessionId);
        log.info("Saved session summary", { sessionId, messageCount: count });
    }

    // ── Stats ─────────────────────────────────────────────────────────────

    getStats(): { messages: number; facts: number; sessions: number } {
        const messages = (this.db.prepare("SELECT COUNT(*) as c FROM messages").get() as { c: number }).c;
        const facts = (this.db.prepare("SELECT COUNT(*) as c FROM facts").get() as { c: number }).c;
        const sessions = (this.db.prepare("SELECT COUNT(*) as c FROM sessions").get() as { c: number }).c;
        return { messages, facts, sessions };
    }
}
