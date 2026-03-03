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
    factId?: number;
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
            `SELECT id, content, category, embedding, created_at, updated_at, COALESCE(importance_score, 1.0) as importance_score FROM facts`
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
                const importance = Number(fact.importance_score) || 1.0;
                scored.push({
                    type: "fact",
                    content: fact.content as string,
                    score: score * importance,
                    category: fact.category as string,
                    created_at: fact.created_at as string,
                    factId: Number(fact.id),
                });
            }
        }

        const topResults = scored
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        // Track access on returned facts (fire-and-forget)
        for (const r of topResults) {
            if (r.factId) {
                void this.trackAccess(r.factId);
            }
        }

        return topResults;
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
        // Optimization: Skip expensive vector generation for very short/generic messages
        // that won't match any useful facts anyway (e.g., "ok", "yes", "thanks").
        const isGeneric = /^(ok|okay|yes|no|ja|nein|danke|thanks|bitte|please|gut|good|cool|nice)\.?$/i.test(query.trim());
        if (query.trim().length > 8 && !isGeneric) {
            const semanticResults = await this.searchFactsBySemantic(query, limit);
            results.push(...semanticResults);
        } else {
            log.debug("Skipping semantic memory search for short/generic input", { query });
        }

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

    // ── Self-Evolving Memory ──────────────────────────────────────────

    /**
     * Track that a fact was accessed (bumps hit_count and last_accessed).
     */
    async trackAccess(factId: number): Promise<void> {
        await this.db.execute({
            sql: `UPDATE facts SET hit_count = COALESCE(hit_count, 0) + 1, last_accessed = datetime('now') WHERE id = ?`,
            args: [factId],
        });
    }

    /**
     * Apply memory decay — reduce importance of facts not accessed recently.
     * Facts accessed in the last 7 days keep full score.
     * Older facts decay towards a minimum of 0.1.
     */
    async applyDecay(): Promise<number> {
        const result = await this.db.execute(`
            UPDATE facts
            SET importance_score = MAX(0.1,
                COALESCE(importance_score, 1.0) * 0.95
            )
            WHERE last_accessed IS NOT NULL
              AND last_accessed < datetime('now', '-7 days')
              AND COALESCE(importance_score, 1.0) > 0.1
        `);
        const affected = result.rowsAffected ?? 0;
        if (affected > 0) {
            log.info("Memory decay applied", { factsDecayed: affected });
        }
        return Number(affected);
    }

    /**
     * Boost importance for frequently accessed facts.
     */
    async boostPopular(): Promise<number> {
        const result = await this.db.execute(`
            UPDATE facts
            SET importance_score = MIN(2.0,
                COALESCE(importance_score, 1.0) * 1.05
            )
            WHERE COALESCE(hit_count, 0) > 5
              AND COALESCE(importance_score, 1.0) < 2.0
        `);
        const affected = result.rowsAffected ?? 0;
        if (affected > 0) {
            log.info("Popular facts boosted", { factsBoosted: affected });
        }
        return Number(affected);
    }

    /**
     * Auto-merge very similar facts (>90% similarity).
     * Keeps the newer/longer version, deletes the duplicate.
     */
    async autoMerge(): Promise<number> {
        const allFacts = await this.db.execute(
            `SELECT id, content, embedding, hit_count, importance_score FROM facts ORDER BY id`
        );

        const toDelete: number[] = [];

        for (let i = 0; i < allFacts.rows.length; i++) {
            const factA = allFacts.rows[i]!;
            if (toDelete.includes(Number(factA.id))) continue;
            if (!factA.embedding) continue;

            const bufA = typeof factA.embedding === "string"
                ? Buffer.from(factA.embedding, "base64")
                : Buffer.from(factA.embedding as ArrayBuffer);
            const embA = bufferToEmbedding(bufA);

            let iterations = 0;
            for (let j = i + 1; j < allFacts.rows.length; j++) {
                if (++iterations % 500 === 0) await new Promise(r => setTimeout(r, 0)); // Yield to event loop

                const factB = allFacts.rows[j]!;
                if (toDelete.includes(Number(factB.id))) continue;
                if (!factB.embedding) continue;

                const bufB = typeof factB.embedding === "string"
                    ? Buffer.from(factB.embedding, "base64")
                    : Buffer.from(factB.embedding as ArrayBuffer);
                const embB = bufferToEmbedding(bufB);

                const similarity = cosineSimilarity(embA, embB);

                if (similarity > 0.90) {
                    // Keep the longer/more detailed fact
                    const contentA = factA.content as string;
                    const contentB = factB.content as string;
                    const keepId = contentA.length >= contentB.length ? Number(factA.id) : Number(factB.id);
                    const deleteId = keepId === Number(factA.id) ? Number(factB.id) : Number(factA.id);

                    // Merge hit counts
                    const totalHits = (Number(factA.hit_count) || 0) + (Number(factB.hit_count) || 0);
                    const maxImportance = Math.max(
                        Number(factA.importance_score) || 1.0,
                        Number(factB.importance_score) || 1.0
                    );

                    await this.db.execute({
                        sql: `UPDATE facts SET hit_count = ?, importance_score = ? WHERE id = ?`,
                        args: [totalHits, maxImportance, keepId],
                    });

                    toDelete.push(deleteId);
                    log.info("Auto-merged duplicate fact", {
                        kept: keepId,
                        deleted: deleteId,
                        similarity: similarity.toFixed(3),
                    });
                }
            }
        }

        // Delete merged duplicates
        for (const id of toDelete) {
            await this.db.execute({ sql: `DELETE FROM facts WHERE id = ?`, args: [id] });
        }

        if (toDelete.length > 0) {
            log.info("Auto-merge complete", { merged: toDelete.length });
        }
        return toDelete.length;
    }

    /**
     * Run all evolution steps. Call this periodically (e.g., every 50 messages).
     */
    async evolve(): Promise<void> {
        log.info("Running memory evolution...");
        await this.applyDecay();
        await this.boostPopular();
        await this.autoMerge();
        log.info("Memory evolution complete");
    }

    // ── Background Monitors ─────────────────────────────────────────

    async createMonitor(userId: number, prompt: string, intervalMinutes: number): Promise<number> {
        const result = await this.db.execute({
            sql: `INSERT INTO monitors (user_id, prompt, interval_minutes, last_run) VALUES (?, ?, ?, datetime('now', '-1 hour'))`,
            args: [userId, prompt, intervalMinutes],
        });
        log.info("Created background monitor", { monitorId: Number(result.lastInsertRowid), userId });
        return Number(result.lastInsertRowid);
    }

    async getDueMonitors(): Promise<Array<{ id: number; user_id: number; prompt: string }>> {
        const result = await this.db.execute(`
            SELECT id, user_id, prompt
            FROM monitors
            WHERE last_run <= datetime('now', '-' || interval_minutes || ' minutes')
        `);
        return result.rows.map(r => ({
            id: Number(r.id),
            user_id: Number(r.user_id),
            prompt: r.prompt as string,
        }));
    }

    async updateMonitorLastRun(monitorId: number): Promise<void> {
        await this.db.execute({
            sql: `UPDATE monitors SET last_run = datetime('now') WHERE id = ?`,
            args: [monitorId],
        });
    }

    async deleteMonitor(monitorId: number): Promise<void> {
        await this.db.execute({
            sql: `DELETE FROM monitors WHERE id = ?`,
            args: [monitorId],
        });
        log.info("Deleted background monitor", { monitorId });
    }

    // ── Orchestrator Messages ───────────────────────────────────────

    async getUnreadOrchestratorMessages(): Promise<Array<{ id: number; project_id: string; message: string }>> {
        const result = await this.db.execute(`
            SELECT id, project_id, message
            FROM orchestrator_messages
            WHERE status = 'unread'
            ORDER BY created_at ASC
        `);
        return result.rows.map(r => ({
            id: Number(r.id),
            project_id: r.project_id as string,
            message: r.message as string,
        }));
    }

    async markOrchestratorMessageRead(msgId: number): Promise<void> {
        await this.db.execute({
            sql: `UPDATE orchestrator_messages SET status = 'read' WHERE id = ?`,
            args: [msgId],
        });
    }
}
