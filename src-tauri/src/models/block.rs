use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// cotent inside pages in notion just consist of blocks
// some basic ones we can have for now
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(tag = "type", content = "data")]
pub enum BlockType {
    Text,
    Heading1,
    Heading2,
    Heading3,
    BulletList,
    NumberedList,
    Todo { checked: bool },
    Code { language: String },
    Quote,
    Divider,
    SubPage { page_id: Uuid },
    PageLink { page_id: Uuid },
}

// basic struct for a block :D
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Block {
    pub id: Uuid,
    pub page_id: Uuid, // help know what document the block is in
    pub block_type: BlockType,
    pub content: String,         // the actual content
    pub parent_id: Option<Uuid>, // which blocks contain it
    pub order: i32,              // order is the veritcal order which the block is on the page
    pub created_at: DateTime<Utc>,
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
