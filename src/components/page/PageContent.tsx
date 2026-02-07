import { useState } from "react";
import { BlockRenderer } from "../blocks/BlockRenderer";
import type { Block } from "../../types/Block";
import type { Page } from "../../types/Page";
import type { BlockType } from "../../types/BlockType";

/**
 * main editor view for a single page. basically just a bunch fo blocks :D
 * 
 * TODO: support multiple block types (Heading, Todo, Quote, etc.)
 * TODO: add inline block editing
 * TODO: add keyboard navigation between blocks
 * TODO: add drag-and-drop reordering
 * TODO: add undo / redo
 * TODO: add block selection + bulk delete
 */

interface PageContentProps {
  page: Page;
  blocks: Block[];
  onCreateBlock: (pageId: string, blockType: BlockType, content: string) => Promise<void>;
  onDeleteBlock: (blockId: string) => Promise<void>;
  onNavigate: (page: Page) => void;
}

export function PageContent({
  page,
  blocks,
  onCreateBlock,
  onDeleteBlock,
  onNavigate,
}: PageContentProps) {
  const [newBlockContent, setNewBlockContent] = useState("");

  const handleCreateBlock = async () => {
    if (newBlockContent.trim()) {
      const blockType: BlockType = { type: "Text" };
      await onCreateBlock(page.id, blockType, newBlockContent);
      setNewBlockContent("");
    }
  };

  return (
    <div style={{ flex: 1, padding: "16px 40px" }}>
      <h1 style={{ textAlign: "left" }}>{page.title}</h1>

      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          gap: "8px",
        }}
      >
        <input
          type="text"
          value={newBlockContent}
          onChange={(e) => setNewBlockContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleCreateBlock();
            }
          }}
          placeholder="Type something..."
          style={{ width: "100%", padding: "8px" }}
        />
        <button onClick={handleCreateBlock}>Add Block</button>
      </div>

      <div>
        {blocks.map((block) => (
          <div
            key={block.id}
            style={{
              marginBottom: "12px",
              padding: "8px",
              borderRadius: "4px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ flex: 1 }}>
              <BlockRenderer block={block} onNavigate={onNavigate} />
            </div>
            <button
              onClick={() => onDeleteBlock(block.id)}
              style={{ marginLeft: "8px", color: "#DD4CAB" }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}