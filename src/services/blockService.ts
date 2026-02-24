import { invoke } from "@tauri-apps/api/core";
import type { Block } from "../types/Block";
import type { BlockType } from "../types/BlockType";

export const blockService = {
  async getPageBlocks(pageId: string): Promise<Block[]> {
    return await invoke<Block[]>("get_page_blocks", { pageId });
  },

  async createBlock(
    pageId: string,
    blockType: BlockType,
    content: string,
    parentId: string | null,
  ): Promise<Block> {
    return await invoke<Block>("create_block", {
      pageId,
      blockType,
      content,
      parentId,
    });
  },

  async deleteBlock(blockId: string): Promise<void> {
    return await invoke("delete_block", { blockId });
  },

  async updateBlockContent(blockId: string, content: string): Promise<Block> {
    return await invoke<Block>("update_block_content", { blockId, content });
  },

  async reorderBlock(blockId: string, newOrder: number): Promise<Block> {
    return await invoke<Block>("reorder_block", { blockId, newOrder });
  },
};
