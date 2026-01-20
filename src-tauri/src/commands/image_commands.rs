use crate::storage::Database;
use std::fs;
use std::path::Path;
use tauri::{AppHandle, Manager, State};
use uuid::Uuid;

#[tauri::command]
pub async fn upload_page_asset(
    app: AppHandle,
    db: State<'_, Database>,
    page_id: String,
    source_path: String,
    asset_type: String,
) -> Result<String, String> {
    let mut asset_path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    asset_path.push("page_assets");

    fs::create_dir_all(&asset_path).map_err(|e| e.to_string())?;

    let path = Path::new(&source_path);
    let extension = path.extension().and_then(|s| s.to_str()).unwrap_or("png");
    let file_name = format!("{}.{}", Uuid::new_v4(), extension);
    let dest_path = asset_path.join(&file_name);

    if let Ok(Some(page)) = db.get_page(&page_id) {
        let old_file = if asset_type == "icon" {
            page.icon
        } else {
            page.cover
        };
        if let Some(old_name) = old_file {
            let old_path = asset_path.join(old_name);
            let _ = fs::remove_file(old_path);
        }
    }

    fs::copy(&source_path, &dest_path).map_err(|e| format!("Failed to copy file: {}", e))?;

    if asset_type == "icon" {
        db.update_page_icon(&page_id, &file_name)
            .map_err(|e| format!("DB Error: {}", e))?;
    } else {
        db.update_page_cover(&page_id, &file_name)
            .map_err(|e| format!("DB Error: {}", e))?;
    }
    println!("Assets are being stored at: {:?}", asset_path);
    Ok(file_name)
}
