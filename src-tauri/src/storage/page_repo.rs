use super::db::Database;
use crate::models::Page;
use rusqlite::{params, OptionalExtension, Result, Row};

impl Database {
    pub fn insert_page(&self, page: &Page) -> Result<()> {
        let conn = self.get_connection();
        conn.execute(
            "INSERT INTO pages (id, title, icon, cover, parent_id, is_archived, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                page.id,
                page.title,
                page.icon,
                page.cover,
                page.parent_id,
                page.is_archived as i32,
                page.created_at.to_rfc3339(),
                page.updated_at.to_rfc3339(),
            ],
        )?;
        Ok(())
    }

    pub fn get_page(&self, id: &str) -> Result<Option<Page>> {
        let conn = self.get_connection();
        let mut stmt = conn.prepare(
            "SELECT id, title, icon, cover, parent_id, is_archived, created_at, updated_at 
             FROM pages WHERE id = ?1",
        )?;

        let page = stmt
            .query_row(params![id], |row| self.row_to_page(row))
            .optional()?;
        Ok(page)
    }

    pub fn list_pages(&self) -> Result<Vec<Page>> {
        let conn = self.get_connection();
        let mut stmt = conn.prepare(
            "SELECT id, title, icon, cover, parent_id, is_archived, created_at, updated_at 
             FROM pages WHERE is_archived = 0 ORDER BY created_at DESC",
        )?;

        let pages = stmt
            .query_map([], |row| self.row_to_page(row))?
            .collect::<Result<Vec<_>>>()?;

        Ok(pages)
    }

    pub fn update_page_title(&self, id: &str, title: &str) -> Result<()> {
        let conn = self.get_connection();
        let now = chrono::Utc::now().to_rfc3339();

        conn.execute(
            "UPDATE pages SET title = ?1, updated_at = ?2 WHERE id = ?3",
            params![title, now, id],
        )?;
        Ok(())
    }

    pub fn delete_page(&self, id: &str) -> Result<()> {
        let conn = self.get_connection();
        conn.execute("DELETE FROM pages WHERE id = ?1", params![id])?;
        Ok(())
    }

    fn row_to_page(&self, row: &Row) -> Result<Page> {
        Ok(Page {
            id: row.get(0)?,
            title: row.get(1)?,
            icon: row.get(2)?,
            cover: row.get(3)?,
            parent_id: row.get(4)?,
            is_archived: row.get::<_, i32>(5)? != 0,
            created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?)
                .unwrap()
                .with_timezone(&chrono::Utc),
            updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(7)?)
                .unwrap()
                .with_timezone(&chrono::Utc),
        })
    }

    pub fn update_page_icon(&self, id: &str, icon: &str) -> Result<()> {
        let conn = self.get_connection();
        let now = chrono::Utc::now().to_rfc3339();

        conn.execute(
            "UPDATE pages SET icon = ?1, updated_at = ?2 WHERE id = ?3",
            params![icon, now, id],
        )?;
        Ok(())
    }

    pub fn update_page_cover(&self, id: &str, cover: &str) -> Result<()> {
        let conn = self.get_connection();
        let now = chrono::Utc::now().to_rfc3339();

        conn.execute(
            "UPDATE pages SET cover = ?1, updated_at = ?2 WHERE id = ?3",
            params![cover, now, id],
        )?;
        Ok(())
    }

    pub fn get_child_pages(&self, parent_id: &str) -> Result<Vec<Page>> {
        let conn = self.get_connection();
        let mut stmt = conn.prepare(
            "SELECT id, title, icon, cover, parent_id, is_archived, created_at, updated_at 
             FROM pages WHERE parent_id = ?1 AND is_archived = 0 ORDER BY created_at ASC",
        )?;

        let pages = stmt
            .query_map(params![parent_id], |row| self.row_to_page(row))?
            .collect::<Result<Vec<_>>>()?;

        Ok(pages)
    }

    pub fn get_root_pages(&self) -> Result<Vec<Page>> {
        let conn = self.get_connection();
        let mut stmt = conn.prepare(
            "SELECT id, title, icon, cover, parent_id, is_archived, created_at, updated_at 
             FROM pages WHERE parent_id IS NULL AND is_archived = 0 ORDER BY created_at ASC",
        )?;

        let pages = stmt
            .query_map([], |row| self.row_to_page(row))?
            .collect::<Result<Vec<_>>>()?;

        Ok(pages)
    }

    pub fn is_asset_used_by_other_pages(
        &self,
        filename: &str,
        current_page_id: &str,
        asset_type: &str,
    ) -> Result<bool, Box<dyn std::error::Error>> {
        let conn = self.get_connection();

        let column = if asset_type == "icon" {
            "icon"
        } else {
            "cover"
        };

        let query = format!(
            "SELECT COUNT(*) FROM pages WHERE {} = ?1 AND id != ?2",
            column
        );

        let count: i64 =
            conn.query_row(&query, params![filename, current_page_id], |row| row.get(0))?;

        Ok(count > 0)
    }
}
