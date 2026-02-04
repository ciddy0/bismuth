use std::fs;
use std::path::PathBuf;
use tauri::Manager;

/*
 * PLEASE DONT TOUCH ASIOFDHSDKAFJHBDSAFHABD I WAS GONNA CRASH OUT
 * erm remove printlns later when we for sure know it works (prob gonna have to touch this later again idk)
 */
pub fn register_asset_protocol<R: tauri::Runtime>(builder: tauri::Builder<R>) -> tauri::Builder<R> {
    builder.register_uri_scheme_protocol("asset", |ctx, request| {
        handle_asset_request(ctx.app_handle(), request.uri().to_string().as_str())
    })
}

fn handle_asset_request<R: tauri::Runtime>(
    app_handle: &tauri::AppHandle<R>,
    uri: &str,
) -> tauri::http::Response<Vec<u8>> {
    eprintln!("Received URI: {}", uri);

    // parse URI: asset://page-assets/filename.png or asset://localhost/page-assets/filename.png
    let path_parts: Vec<&str> = uri.split("://").collect();
    if path_parts.len() != 2 {
        eprintln!("Invalid URI format: {}", uri);
        return tauri::http::Response::builder()
            .status(400)
            .body(Vec::new())
            .unwrap();
    }

    // remove 'localhost' if present and leading slashes since it needs to be the exact name (took an hour.. kms?)
    let encoded_path = path_parts[1]
        .trim_start_matches("localhost")
        .trim_start_matches('/');

    eprintln!("Encoded path: {}", encoded_path);

    // URL decode the path
    let file_path = match urlencoding::decode(encoded_path) {
        Ok(decoded) => {
            let decoded_str = decoded.to_string();
            eprintln!("Decoded path: {}", decoded_str);
            decoded_str
        }
        Err(e) => {
            eprintln!("Failed to decode URL: {}", e);
            return tauri::http::Response::builder()
                .status(400)
                .body(Vec::new())
                .unwrap();
        }
    };

    // security: only allow page-assets or page_assets directory
    if !file_path.starts_with("page-assets/") && !file_path.starts_with("page_assets/") {
        return tauri::http::Response::builder()
            .status(403)
            .body(Vec::new())
            .unwrap();
    }

    // Resolve to actual file path
    let app_data_dir = match app_handle.path().app_data_dir() {
        Ok(dir) => {
            eprintln!("App data dir: {:?}", dir);
            dir
        }
        Err(e) => {
            eprintln!("Failed to get app data dir: {}", e);
            return tauri::http::Response::builder()
                .status(500)
                .body(Vec::new())
                .unwrap();
        }
    };

    let full_path = app_data_dir.join(&file_path);

    // read file
    let bytes = match fs::read(&full_path) {
        Ok(data) => {
            eprintln!("Successfully read {} bytes", data.len());
            data
        }
        Err(e) => {
            eprintln!("Failed to read file {:?}: {}", full_path, e);
            return tauri::http::Response::builder()
                .status(404)
                .body(Vec::new())
                .unwrap();
        }
    };

    // determine type
    let mime_type = get_type(&full_path);

    eprintln!("Successfully serving file: {:?} ({})", full_path, mime_type);

    // build response :D
    tauri::http::Response::builder()
        .status(200)
        .header("Content-Type", mime_type)
        .header("Cache-Control", "public, max-age=31536000")
        .body(bytes)
        .unwrap()
}

fn get_type(path: &PathBuf) -> &'static str {
    match path.extension().and_then(|s| s.to_str()) {
        Some("png") => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("webp") => "image/webp",
        Some("gif") => "image/gif",
        Some("svg") => "image/svg+xml",
        Some("ico") => "image/x-icon",
        _ => "application/octet-stream",
    }
}
