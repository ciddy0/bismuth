/**
 * -- MY THOUGHTS -- 
 * Seperate pages and blocks so that we can use page data on the sidebars
 * page content just conist of blocks so we can just say what page id the block
 * belongs to
*/
pub mod block;
pub mod page;

pub use block::{Block, BlockType};
pub use page::Page;
