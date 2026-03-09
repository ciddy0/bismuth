use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize, Clone, TS)]
#[ts(export, export_to = "../../src/types/")]
pub struct SearchMatch {
    pub block_id: String,
    pub content: String,
    pub block_type: String,
    pub match_start: usize,
    pub match_end: usize,
    pub snippet: String,
    pub order: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone, TS)]
#[ts(export, export_to = "../../src/types/")]
pub struct SearchFileGroup {
    pub page_id: String,
    pub page_title: String,
    pub page_icon: Option<String>,
    pub matches: Vec<SearchMatch>,
}

#[derive(Debug, Serialize, Deserialize, Clone, TS)]
#[ts(export, export_to = "../../src/types/")]
pub struct SearchResponse {
    pub groups: Vec<SearchFileGroup>,
    pub total_matches: usize,
}