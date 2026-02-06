import { useState, useCallback } from "react";
import { blockService } from "../services/blockService";
import type { Block } from "../types/Block";
import type { BlockType } from "../types/BlockType";

/**
 * provides a local block store and exposes async helpers to:
 * - load all blocks for a page
 * - create new blocks
 * - delete existing blocks
 * 
 * TODO: add updateBlock to edit existing block content
 * TODO: add moveBlock / reorderBlock for drag-and-drop support)
 * TODO: cache blocks per page to avoid refetching on navigation
 */

export function useBlocks() {
  const [blocks, setBlocks] = useState<Block[]>([]);

  const loadBlocks = useCallback(async (pageId: string) => {
    try {
      const pageBlocks = await blockService.getPageBlocks(pageId);
      setBlocks(pageBlocks);
    } catch (error) {
      console.error("Failed to load blocks:", error);
    }
  }, []);

  const createBlock = useCallback(
    async (
      pageId: string,
      blockType: BlockType,
      content: string,
      parentId: string | null = null,
    ) => {
      if (!content.trim()) return null;
      try {
        const block = await blockService.createBlock(
          pageId,
          blockType,
          content,
          parentId,
        );
        setBlocks((prev) => [...prev, block]);
        return block;
      } catch (error) {
        console.error("Failed to create block:", error);
        return null;
      }
    },
    [],
  );

  const deleteBlock = useCallback(async (blockId: string) => {
    try {
      await blockService.deleteBlock(blockId);
      setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    } catch (error) {
      console.error("Failed to delete block:", error);
    }
  }, []);

  return {
    blocks,
    loadBlocks,
    createBlock,
    deleteBlock,
  };
}
