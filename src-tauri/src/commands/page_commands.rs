use crate::models::Page;
use crate::storage::Database;
use tauri::State;

#[tauri::command]
pub fn create_page(title: String, db: State<Database>) -> Result<Page, String> {
    let page = Page::new(title);

    db.insert_page(&page)
        .map_err(|e| format!("failed to create page D: {}", e))?;

    Ok(page)
}

#[tauri::command]
pub fn get_page(page_id: String, db: State<Database>) -> Result<Page, String> {
    db.get_page(&page_id)
        .map_err(|e| format!("database error D: {}", e))?
        .ok_or_else(|| format!("page not found D: {}", page_id))
}

#[tauri::command]
pub fn list_pages(db: State<Database>) -> Result<Vec<Page>, String> {
    db.list_pages()
        .map_err(|e| format!("failed to list pages D: {}", e))
}

#[tauri::command]
pub fn update_page_title(
    page_id: String,
    title: String,
    db: State<Database>,
) -> Result<Page, String> {
    db.update_page_title(&page_id, &title)
        .map_err(|e| format!("failed to update page D: {}", e))?;

    db.get_page(&page_id)
        .map_err(|e| format!("database error D: {}", e))?
        .ok_or_else(|| format!("page not found D: {}", page_id))
}

#[tauri::command]
pub fn delete_page(page_id: String, db: State<Database>) -> Result<(), String> {
    db.delete_page(&page_id)
        .map_err(|e| format!("failed to delete page D: {}", e))
}

#[tauri::command]
pub fn update_page_icon(
    page_id: String,
    icon: String,
    db: State<Database>,
) -> Result<Page, String> {
    db.update_page_icon(&page_id, &icon)
        .map_err(|e| format!("failed to update icon: {}", e))?;

    db.get_page(&page_id)
        .map_err(|e| format!("database error: {}", e))?
        .ok_or_else(|| format!("page not found: {}", page_id))
}

#[tauri::command]
pub fn update_page_cover(
    page_id: String,
    cover: String,
    db: State<Database>,
) -> Result<Page, String> {
    db.update_page_cover(&page_id, &cover)
        .map_err(|e| format!("failed to update cover D: {}", e))?;

    db.get_page(&page_id)
        .map_err(|e| format!("database error D: {}", e))?
        .ok_or_else(|| format!("page not found D: {}", page_id))
}

#[tauri::command]
pub fn get_child_pages(parent_id: String, db: State<Database>) -> Result<Vec<Page>, String> {
    db.get_child_pages(&parent_id)
        .map_err(|e| format!("failed to get child pages D: {}", e))
}

#[tauri::command]
pub fn get_root_pages(db: State<Database>) -> Result<Vec<Page>, String> {
    db.get_root_pages()
        .map_err(|e| format!("failed to get root pages D: {}", e))
}

#[tauri::command]
pub fn create_nested_page(
    title: String,
    parent_id: String,
    db: State<Database>,
) -> Result<Page, String> {
    let page = Page::new(title).with_parent(parent_id);

    db.insert_page(&page)
        .map_err(|e| format!("failed to create nested page D: {}", e))?;

    Ok(page)
}

#[tauri::command]
pub fn validate_page_link(page_id: String, db: State<Database>) -> Result<bool, String> {
    db.get_page(&page_id)
        .map(|page| page.is_some())
        .map_err(|e| format!("failed to validate page link D: {}", e))
}
