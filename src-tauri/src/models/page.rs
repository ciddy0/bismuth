use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Page {
    pub id: String,
    pub title: String,
    pub icon: Option<String>,
    pub cover: Option<String>,
    pub parent_id: Option<String>, // what folder am i nested under
    pub is_archived: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Page {
    pub fn new(title: String) -> Self {
        let now = Utc::now();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            title,
            icon: None,
            cover: None,
            parent_id: None,
            is_archived: false,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn with_parent(mut self, parent_id: String) -> Self {
        self.parent_id = Some(parent_id);
        self
    }

    pub fn with_icon(mut self, icon: String) -> Self {
        self.icon = Some(icon);
        self
    }
}
