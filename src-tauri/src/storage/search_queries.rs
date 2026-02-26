use super::db::Database;
use crate::models::{SearchFileGroup, SearchMatch, SearchResponse};
use rusqlite::{params, Result};

impl Database {
    pub fn search_blocks(
        &self,
        query: &str,
        case_sensitive: bool,
        whole_word: bool,
    ) -> Result<SearchResponse> {
        let conn = self.get_connection();

        let mut stmt = conn.prepare(
            "SELECT b.id, b.page_id, b.block_type, b.content, b.order_position,
                    p.title, p.icon
             FROM blocks b
             JOIN pages p ON b.page_id = p.id
             WHERE p.is_archived = 0
             ORDER BY p.updated_at DESC, b.order_position ASC",
        )?;

        let mut groups: Vec<SearchFileGroup> = Vec::new();
        let mut group_map: std::collections::HashMap<String, usize> =
            std::collections::HashMap::new();
        let mut total_matches: usize = 0;

        let rows = stmt.query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,         // block id
                row.get::<_, String>(1)?,         // page id
                row.get::<_, String>(2)?,         // block type
                row.get::<_, String>(3)?,         // content
                row.get::<_, i32>(4)?,            // order
                row.get::<_, String>(5)?,         // page title
                row.get::<_, Option<String>>(6)?, // page icon
            ))
        })?;

        for row_result in rows {
            let (block_id, page_id, block_type, content, order, page_title, page_icon) =
                row_result?;

            let matches = find_all_matches(&content, query, case_sensitive, whole_word);
            if matches.is_empty() {
                continue;
            }

            let search_matches: Vec<SearchMatch> = matches
                .iter()
                .map(|&(start, end)| SearchMatch {
                    block_id: block_id.clone(),
                    content: content.clone(),
                    block_type: block_type.clone(),
                    match_start: start,
                    match_end: end,
                    snippet: build_snippet(&content, start, end - start, 40),
                    order,
                })
                .collect();

            total_matches += search_matches.len();

            if let Some(&idx) = group_map.get(&page_id) {
                groups[idx].matches.extend(search_matches);
            } else {
                let idx = groups.len();
                group_map.insert(page_id.clone(), idx);
                groups.push(SearchFileGroup {
                    page_id,
                    page_title,
                    page_icon,
                    matches: search_matches,
                });
            }
        }

        // also search page titles
        let mut title_stmt =
            conn.prepare("SELECT id, title, icon FROM pages WHERE is_archived = 0")?;

        let title_rows = title_stmt.query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<String>>(2)?,
            ))
        })?;

        for row_result in title_rows {
            let (page_id, title, icon) = row_result?;
            let title_matches = find_all_matches(&title, query, case_sensitive, whole_word);
            if title_matches.is_empty() {
                continue;
            }

            let search_matches: Vec<SearchMatch> = title_matches
                .iter()
                .map(|&(start, end)| SearchMatch {
                    block_id: format!("title-{}", page_id),
                    content: title.clone(),
                    block_type: "Title".to_string(),
                    match_start: start,
                    match_end: end,
                    snippet: title.clone(),
                    order: -1,
                })
                .collect();

            total_matches += search_matches.len();

            if let Some(&idx) = group_map.get(&page_id) {
                // prepend title matches
                let mut combined = search_matches;
                combined.extend(groups[idx].matches.clone());
                groups[idx].matches = combined;
            } else {
                let idx = groups.len();
                group_map.insert(page_id.clone(), idx);
                groups.push(SearchFileGroup {
                    page_id,
                    page_title: title,
                    page_icon: icon,
                    matches: search_matches,
                });
            }
        }

        Ok(SearchResponse {
            groups,
            total_matches,
        })
    }

    pub fn replace_in_block(
        &self,
        block_id: &str,
        search: &str,
        replacement: &str,
        case_sensitive: bool,
    ) -> Result<String> {
        let conn = self.get_connection();
        let now = chrono::Utc::now().to_rfc3339();

        let mut stmt = conn.prepare("SELECT content FROM blocks WHERE id = ?1")?;
        let content: String = stmt.query_row(params![block_id], |row| row.get(0))?;

        let new_content = if case_sensitive {
            content.replace(search, replacement)
        } else {
            case_insensitive_replace(&content, search, replacement)
        };

        conn.execute(
            "UPDATE blocks SET content = ?1, updated_at = ?2 WHERE id = ?3",
            params![new_content, now, block_id],
        )?;

        Ok(new_content)
    }
}

fn find_all_matches(
    content: &str,
    query: &str,
    case_sensitive: bool,
    whole_word: bool,
) -> Vec<(usize, usize)> {
    if query.is_empty() {
        return vec![];
    }

    let (search_content, search_query) = if case_sensitive {
        (content.to_string(), query.to_string())
    } else {
        (content.to_lowercase(), query.to_lowercase())
    };

    let mut matches = Vec::new();
    let mut start = 0;

    while let Some(pos) = search_content[start..].find(&search_query) {
        let abs_pos = start + pos;
        let end_pos = abs_pos + query.len();

        if whole_word {
            let before_ok =
                abs_pos == 0 || !content.as_bytes()[abs_pos - 1].is_ascii_alphanumeric();
            let after_ok =
                end_pos >= content.len() || !content.as_bytes()[end_pos].is_ascii_alphanumeric();
            if before_ok && after_ok {
                matches.push((abs_pos, end_pos));
            }
        } else {
            matches.push((abs_pos, end_pos));
        }

        start = abs_pos + 1;
    }

    matches
}

fn case_insensitive_replace(content: &str, search: &str, replacement: &str) -> String {
    let lower_content = content.to_lowercase();
    let lower_search = search.to_lowercase();
    let mut result = String::new();
    let mut last = 0;

    while let Some(pos) = lower_content[last..].find(&lower_search) {
        let abs = last + pos;
        result.push_str(&content[last..abs]);
        result.push_str(replacement);
        last = abs + search.len();
    }
    result.push_str(&content[last..]);
    result
}

fn build_snippet(content: &str, match_start: usize, match_len: usize, context: usize) -> String {
    let start = match_start.saturating_sub(context);
    let end = (match_start + match_len + context).min(content.len());
    let mut s = String::new();
    if start > 0 {
        s.push_str("...");
    }
    s.push_str(content[start..end].trim());
    if end < content.len() {
        s.push_str("...");
    }
    s
}
