use crate::models::SearchResponse;
use crate::storage::Database;
#[tauri::command]
pub fn search_blocks(
    state: tauri::State<'_, Database>,
    query: String,
    case_sensitive: bool,
    whole_word: bool,
) -> Result<SearchResponse, String> {
    if query.trim().is_empty() {
        return Ok(SearchResponse {
            groups: vec![],
            total_matches: 0,
        });
    }
    state
        .search_blocks(&query, case_sensitive, whole_word)
        .map_err(|e| e.to_string())
}
