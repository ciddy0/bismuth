use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use ts_rs::TS;
use uuid::Uuid;

// cotent inside pages in notion just consist of blocks
// some basic ones we can have for now
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, TS)]
#[ts(export, export_to = "../../src/types/")]
#[serde(tag = "type", content = "data")]
pub enum BlockType {
    Text,
    Heading1,
    Heading2,
    Heading3,
    BulletList,
    NumberedList,
    Todo {
        checked: bool,
    },
    Code {
        language: String,
    },
    Quote,
    Divider,
    SubPage {
        #[ts(type = "string")]
        page_id: Uuid,
    },
    PageLink {
        #[ts(type = "string")]
        page_id: Uuid,
    },
}
// basic struct for a block :D
#[derive(Debug, Serialize, Deserialize, Clone, TS)]
#[ts(export, export_to = "../../src/types/")]
pub struct Block {
    #[ts(type = "string")]
    pub id: Uuid,
    #[ts(type = "string")]
    pub page_id: Uuid,
    pub block_type: BlockType,
    pub content: String,
    #[ts(type = "string | null")]
    pub parent_id: Option<Uuid>,
    pub order: i32,
    #[ts(type = "string")]
    pub created_at: DateTime<Utc>,
    #[ts(type = "string")]
    pub updated_at: DateTime<Utc>,
}

impl Block {
    // initializes a new Block
    pub fn new(page_id: Uuid, block_type: BlockType, content: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            page_id,
            block_type,
            content,
            parent_id: None,
            order: 0,
            created_at: now,
            updated_at: now,
        }
    }

    // i thinks using these 2 functions we do like block.with_parent(uuid).with_order(1)
    pub fn with_parent(mut self, parent_id: Uuid) -> Self {
        self.parent_id = Some(parent_id);
        self
    }

    pub fn with_order(mut self, order: i32) -> Self {
        self.order = order;
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn export_bindings() {
        Block::export().unwrap();
        BlockType::export().unwrap();
    }
}
