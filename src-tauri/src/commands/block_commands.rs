use crate::models::{Block, BlockType};
use crate::storage::Database;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn create_block(
    page_id: String,
    block_type: BlockType,
    content: String,
    parent_id: Option<String>,
    db: State<Database>,
) -> Result<Block, String> {
    let page_uuid = Uuid::parse_str(&page_id).map_err(|e| format!("invalid page_id D: {}", e))?;

    // get exsting blocks to calculate order
    let existing_blocks = db
        .get_page_blocks(&page_id)
        .map_err(|e| format!("failed to get blocks D: {}", e))?;

    // calc order
    let order = existing_blocks
        .iter()
        .filter(|b| b.parent_id.map(|id| id.to_string()) == parent_id)
        .map(|b| b.order)
        .max()
        .unwrap_or(-1)
        + 1;

    // create the block
    let mut block = Block::new(page_uuid, block_type, content);
    block.order = order;

    if let Some(parent) = parent_id {
        let parent_uuid =
            Uuid::parse_str(&parent).map_err(|e| format!("invalid parent_id: {}", e))?;
        block.parent_id = Some(parent_uuid);
    }

    db.insert_block(&block)
        .map_err(|e| format!("failed to correct block D: {}", e))?;

    Ok(block)
}

#[tauri::command]
pub fn get_page_blocks(page_id: String, db: State<Database>) -> Result<Vec<Block>, String> {
    db.get_page_blocks(&page_id)
        .map_err(|e| format!("failed to get blocks D: {}", e))
}

#[tauri::command]
pub fn update_block_content(
    block_id: String,
    content: String,
    db: State<Database>,
) -> Result<Block, String> {
    db.update_block_content(&block_id, &content)
        .map_err(|e| format!("failed to update block D: {}", e))?;

    let block = db
        .get_page_blocks("")
        .map_err(|e| format!("database error D: {}", e))?
        .into_iter()
        .find(|b| b.id.to_string() == block_id)
        .ok_or_else(|| format!("block not found D: {}", block_id))?;

    Ok(block)
}

#[tauri::command]
pub fn delete_block(block_id: String, db: State<Database>) -> Result<(), String> {
    db.delete_block(&block_id)
        .map_err(|e| format!("failed to delete block D: {}", e))
}

#[tauri::command]
pub fn reorder_block(
    block_id: String,
    new_order: i32,
    db: State<Database>,
) -> Result<Block, String> {
    db.update_block_order(&block_id, new_order)
        .map_err(|e| format!("failed to reorder block D: {}", e))?;

    let block = db
        .get_page_blocks("")
        .map_err(|e| format!("database error D: {}", e))?
        .into_iter()
        .find(|b| b.id.to_string() == block_id)
        .ok_or_else(|| format!("block not found D: {}", block_id))?;

    Ok(block)
}
