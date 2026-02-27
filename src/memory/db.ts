import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import { log } from "../utils/logger.js";

/**
 * Initialize the memory database with all required tables.
 *
 * Schema:
 * - messages: Full conversation log (Tier 1)
 * - messages_fts: FTS5 virtual table for keyword search
 * - facts: Extracted semantic facts with embeddings (Tier 2)
 * - sessions: Conversation session summaries (Tier 3)
 */
export function initDatabase(dbPath: string): Database.Database {
    // Ensure the data directory exists
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }

    const db = new Database(dbPath);

    // Performance pragmas
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    // ── Tier 1: Conversation log ─────────────────────────────────────
    db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
            content TEXT NOT NULL,
            session_id TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_messages_session
            ON messages(session_id, created_at);
    `);

    // FTS5 virtual table for keyword search
    db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts
        USING fts5(content, content=messages, content_rowid=id);
    `);

    // Triggers to keep FTS5 index in sync
    db.exec(`
        CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
            INSERT INTO messages_fts(rowid, content) VALUES (new.id, new.content);
        END;

        CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
            INSERT INTO messages_fts(messages_fts, rowid, content) VALUES ('delete', old.id, old.content);
        END;

        CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages BEGIN
            INSERT INTO messages_fts(messages_fts, rowid, content) VALUES ('delete', old.id, old.content);
            INSERT INTO messages_fts(rowid, content) VALUES (new.id, new.content);
        END;
    `);

    // ── Tier 2: Semantic facts ───────────────────────────────────────
    db.exec(`
        CREATE TABLE IF NOT EXISTS facts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'general',
            embedding BLOB,
            source_message_id INTEGER REFERENCES messages(id),
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_facts_category ON facts(category);
    `);

    // ── Tier 3: Session summaries ────────────────────────────────────
    db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            summary TEXT,
            message_count INTEGER NOT NULL DEFAULT 0,
            started_at TEXT NOT NULL,
            ended_at TEXT
        );
    `);

    log.info("Memory database initialized", { path: dbPath });
    return db;
}
