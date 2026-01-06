mod commands;
mod models;
mod storage;

use commands::*;
use storage::Database;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // initialize database
    let db = Database::new("bismuth.db").expect("failed to initialize database D:");

    tauri::Builder::default()
        .manage(db)
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            create_page,
            get_page,
            list_pages,
            update_page_title,
            update_page_cover,
            update_page_icon,
            get_child_pages,
            get_root_pages,
            create_nested_page,
            validate_page_link,
            delete_page,
            create_block,
            get_page_blocks,
            update_block_content,
            delete_block,
            reorder_block,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application D:");
}
