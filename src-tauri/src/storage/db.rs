use rusqlite::{Connection, Result};
use std::sync::Mutex;

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(path: &str) -> Result<Self> {
        let conn = Connection::open(path)?;
        let db = Database {
            conn: Mutex::new(conn),
        };
        db.init_tables();
        Ok(db)
    }
    fn init_tables(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        // pages table :D
        conn.execute(
            "CREATE TABLE IF NOT EXISTS pages (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                icon TEXT,
                cover TEXT,
                parent_id TEXT,
                is_archived INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (parent_id) REFERENCES pages(id) ON DELETE CASCADE           
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS blocks (
                id TEXT PRIMARY KEY,
                page_id TEXT NOT NULL,
                block_type TEXT NOT NULL,
                content TEXT NOT NULL,
                parent_id TEXT,
                order_position INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES blocks(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // indexes so it can be faster
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_blocks_page_id ON blocks(page_id)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_blocks_parent_id ON blocks(parent_id)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_pages_parent_id ON pages(parent_id)",
            [],
        )?;

        Ok(())
    }
    pub fn get_connection(&self) -> std::sync::MutexGuard<Connection> {
        self.conn.lock().unwrap()
    }
}
