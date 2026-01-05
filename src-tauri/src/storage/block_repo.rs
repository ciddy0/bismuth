use super::db::Database;
use crate::models::{Block, BlockType};
use rusqlite::{params, Result, Row};
use uuid::Uuid;

impl Database {
    pub fn insert_block(&self, block: &Block) -> Result<()> {
        let conn = self.get_connection();
        let block_type_json = serde_json::to_string(&block.block_type).unwrap();

        conn.execute(
            "INSERT INTO blocks (id, page_id, block_type, content, parent_id, order_position, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                block.id.to_string(),
                block.page_id.to_string(),
                block_type_json,
                block.content,
                block.parent_id.map(|id| id.to_string()),
                block.order,
                block.created_at.to_rfc3339(),
                block.updated_at.to_rfc3339(),
            ],
        )?;
        Ok(())
    }

    pub fn get_page_blocks(&self, page_id: &str) -> Result<Vec<Block>> {
        let conn = self.get_connection();
        let mut stmt = conn.prepare(
            "SELECT id, page_id, block_type, content, parent_id, order_position, created_at, updated_at 
             FROM blocks WHERE page_id = ?1 ORDER BY order_position ASC"
        )?;

        let blocks = stmt
            .query_map(params![page_id], |row| self.row_to_block(row))?
            .collect::<Result<Vec<_>>>()?;

        Ok(blocks)
    }

    pub fn update_block_content(&self, id: &str, content: &str) -> Result<()> {
        let conn = self.get_connection();
        let now = chrono::Utc::now().to_rfc3339();

        conn.execute(
            "UPDATE blocks SET content = ?1, updated_at = ?2 WHERE id = ?3",
            params![content, now, id],
        )?;
        Ok(())
    }

    pub fn update_block_order(&self, id: &str, order: i32) -> Result<()> {
        let conn = self.get_connection();
        let now = chrono::Utc::now().to_rfc3339();

        conn.execute(
            "UPDATE blocks SET order_position = ?1, updated_at = ?2 WHERE id = ?3",
            params![order, now, id],
        )?;
        Ok(())
    }

    pub fn delete_block(&self, id: &str) -> Result<()> {
        let conn = self.get_connection();
        conn.execute("DELETE FROM blocks WHERE id = ?1", params![id])?;
        Ok(())
    }

    fn row_to_block(&self, row: &Row) -> Result<Block> {
        let block_type_json: String = row.get(2)?;
        let block_type: BlockType = serde_json::from_str(&block_type_json).unwrap();

        Ok(Block {
            id: Uuid::parse_str(&row.get::<_, String>(0)?).unwrap(),
            page_id: Uuid::parse_str(&row.get::<_, String>(1)?).unwrap(),
            block_type,
            content: row.get(3)?,
            parent_id: row
                .get::<_, Option<String>>(4)?
                .map(|s| Uuid::parse_str(&s).unwrap()),
            order: row.get(5)?,
            created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?)
                .unwrap()
                .with_timezone(&chrono::Utc),
            updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(7)?)
                .unwrap()
                .with_timezone(&chrono::Utc),
        })
    }
}
