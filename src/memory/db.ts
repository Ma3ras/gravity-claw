import { createClient, type Client } from "@libsql/client";
import { config } from "../config.js";
import { log } from "../utils/logger.js";

/**
 * Initialize and return a Turso/libSQL database client.
 *
 * Supports two modes:
 * - Cloud (Turso): set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN
 * - Local fallback: uses a local SQLite file (for dev)
 */
export function initDatabase(): Client {
    const url = config.tursoDbUrl;
    const authToken = config.tursoAuthToken;

    const db = createClient({
        url,
        authToken: authToken || undefined,
    });

    log.info("Database client created", { url: url.startsWith("libsql://") ? "turso-cloud" : "local" });
    return db;
}

/**
 * Create all required tables if they don't exist.
 */
export async function createTables(db: Client): Promise<void> {
    await db.executeMultiple(`
        -- Conversation log — every message verbatim
        CREATE TABLE IF NOT EXISTS messages (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            role        TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
            content     TEXT NOT NULL,
            session_id  TEXT NOT NULL,
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_messages_session
            ON messages(session_id, created_at);

        -- Semantic facts — extracted knowledge with embeddings
        CREATE TABLE IF NOT EXISTS facts (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            content             TEXT NOT NULL,
            category            TEXT NOT NULL DEFAULT 'general',
            embedding           BLOB,
            source_message_id   INTEGER,
            created_at          TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- Session summaries — compressed conversation history
        CREATE TABLE IF NOT EXISTS sessions (
            id              TEXT PRIMARY KEY,
            summary         TEXT,
            message_count   INTEGER DEFAULT 0,
            started_at      TEXT NOT NULL DEFAULT (datetime('now')),
            ended_at        TEXT
        );
    `);

    // ── Migrations: Self-evolving memory columns ──────────────────
    // Safe to run multiple times — ALTER TABLE IF NOT EXISTS
    const migrations = [
        `ALTER TABLE facts ADD COLUMN hit_count INTEGER DEFAULT 0`,
        `ALTER TABLE facts ADD COLUMN last_accessed TEXT`,
        `ALTER TABLE facts ADD COLUMN importance_score REAL DEFAULT 1.0`,
    ];

    for (const sql of migrations) {
        try {
            await db.execute(sql);
        } catch {
            // Column already exists — ignore
        }
    }

    log.info("Database tables ready");
}

export type { Client };
