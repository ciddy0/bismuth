use crate::storage::Database;
use std::fs;
use std::path::Path;
use tauri::{AppHandle, Manager, State};

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

    // get the original filename from the source path
    let source_file = Path::new(&source_path);
    let original_filename = source_file
        .file_name()
        .and_then(|f| f.to_str())
        .ok_or("Invalid filename")?;

    let dest_path = asset_path.join(original_filename);

    // delete old asset if it exists
    if let Ok(Some(page)) = db.get_page(&page_id) {
        let old_file = if asset_type == "icon" {
            page.icon
        } else {
            page.cover
        };

        if let Some(old_filename) = old_file {
            if old_filename != original_filename {
                // check if the file was used elsewhere as a cover image
                let is_used_elsewhere = db
                    .is_asset_used_by_other_pages(&old_filename, &page_id, &asset_type)
                    .map_err(|e| format!("Failed to check asset usage: {}", e))?;

                // if its not then we can remove the file
                if !is_used_elsewhere {
                    let old_path = asset_path.join(old_filename);
                    if old_path.exists() {
                        fs::remove_file(&old_path)
                            .map_err(|e| format!("Failed to delete old file: {}", e))?;
                        eprintln!("Deleted old asset: {:?}", old_path);
                    }
                } else {
                    eprintln!(
                        "Skipped deletion - asset in use by other pages: {}",
                        old_filename
                    );
                }
            }
        }
    }

    // copy the new file
    fs::copy(&source_path, &dest_path).map_err(|e| format!("Failed to copy file: {}", e))?;
    eprintln!("Copied asset to: {:?}", dest_path);

    // update database
    if asset_type == "icon" {
        db.update_page_icon(&page_id, original_filename)
            .map_err(|e| format!("DB Error: {}", e))?;
    } else {
        db.update_page_cover(&page_id, original_filename)
            .map_err(|e| format!("DB Error: {}", e))?;
    }

    Ok(original_filename.to_string())
}
