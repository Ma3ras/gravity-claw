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

        -- Sessions mapping
        CREATE TABLE IF NOT EXISTS sessions (
            id              TEXT PRIMARY KEY,
            summary         TEXT,
            message_count   INTEGER DEFAULT 0,
            started_at      TEXT NOT NULL DEFAULT (datetime('now')),
            ended_at        TEXT
        );

        -- Background Monitors — cheap intermittent checks
        CREATE TABLE IF NOT EXISTS monitors (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id             INTEGER NOT NULL,
            prompt              TEXT NOT NULL,
            interval_minutes    INTEGER NOT NULL DEFAULT 15,
            last_run            TEXT NOT NULL DEFAULT (datetime('now', '-1 year')),
            created_at          TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- Remote Headless Executor — proxy commands from cloud to local PC
        CREATE TABLE IF NOT EXISTS remote_commands (
            id              TEXT PRIMARY KEY,
            command_type    TEXT NOT NULL CHECK(command_type IN ('read_file', 'write_file', 'run_command')),
            filepath        TEXT,
            content         TEXT,
            status          TEXT NOT NULL DEFAULT 'pending', -- pending, completed, error
            created_at      TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- Antigravity Sync Bridge — Tasks for Gemini 3.1 to pick up locally
        CREATE TABLE IF NOT EXISTS antigravity_tasks (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            project_path    TEXT NOT NULL,
            prompt          TEXT NOT NULL,
            status          TEXT NOT NULL DEFAULT 'pending', -- pending, completed
            created_at      TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- Messages from Server-Side Orchestrator to Telegram Bot
        CREATE TABLE IF NOT EXISTS orchestrator_messages (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id  TEXT NOT NULL,
            message     TEXT NOT NULL,
            status      TEXT NOT NULL DEFAULT 'unread', -- unread, read
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_orchestrator_status ON orchestrator_messages(status);
        CREATE INDEX IF NOT EXISTS idx_monitors_last_run ON monitors(last_run, interval_minutes);
        CREATE INDEX IF NOT EXISTS idx_facts_accessed ON facts(last_accessed);
    `);

    // ── Migrations: Self-evolving memory columns ──────────────────
    // Safe to run multiple times — ALTER TABLE IF NOT EXISTS
    const migrations = [
        `ALTER TABLE facts ADD COLUMN hit_count INTEGER DEFAULT 0`,
        `ALTER TABLE facts ADD COLUMN last_accessed TEXT`,
        `ALTER TABLE facts ADD COLUMN importance_score REAL DEFAULT 1.0`,
        `ALTER TABLE antigravity_tasks ADD COLUMN result_data TEXT`,
        `ALTER TABLE antigravity_tasks ADD COLUMN repo_url TEXT`,
        `ALTER TABLE antigravity_tasks ADD COLUMN role TEXT`,
        `ALTER TABLE antigravity_tasks ADD COLUMN chain_id TEXT`,
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
