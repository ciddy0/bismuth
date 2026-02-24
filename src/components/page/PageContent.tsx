import { useState } from "react";
import { BlockRenderer } from "../blocks/BlockRenderer";
import type { Block } from "../../types/Block";
import type { Page } from "../../types/Page";
import type { BlockType } from "../../types/BlockType";

const NON_EDITABLE_TYPES = new Set(["SubPage", "PageLink", "Divider"]);

interface PageContentProps {
  page: Page;
  blocks: Block[];
  onCreateBlock: (pageId: string, blockType: BlockType, content: string) => Promise<void>;
  onDeleteBlock: (blockId: string) => Promise<void>;
  onUpdateBlock: (blockId: string, content: string) => Promise<void>;
  onReorderBlocks: (reorderedBlocks: Block[]) => Promise<void>;
  onNavigate: (page: Page) => void;
}

export function PageContent({
  page,
  blocks,
  onCreateBlock,
  onDeleteBlock,
  onUpdateBlock,
  onReorderBlocks,
  onNavigate,
}: PageContentProps) {
  const [newBlockContent, setNewBlockContent] = useState("");

  // inline editing states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  // drag-and-drop states
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverEnd, setDragOverEnd] = useState(false);

  // block creation

  const handleCreateBlock = async () => {
    if (newBlockContent.trim()) {
      const blockType: BlockType = { type: "Text" };
      await onCreateBlock(page.id, blockType, newBlockContent);
      setNewBlockContent("");
    }
  };

  // inline editing

  const startEditing = (block: Block) => {
    setEditingId(block.id);
    setEditingContent(block.content);
  };

  const commitEdit = async () => {
    if (editingId === null) return;
    const original = blocks.find((b) => b.id === editingId);
    if (original && editingContent !== original.content) {
      await onUpdateBlock(editingId, editingContent);
    }
    setEditingId(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      commitEdit();
    }
    if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  // drag and drop functionality

  // Only the grip handle is draggable
  // inside the block content and gives a reliable drag source.
  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    // Store the source ID in dataTransfer so handleDrop can read it reliably
    // instead of relying on async React state.
    e.dataTransfer.setData("text/plain", blockId);
    setDraggedId(blockId);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnter = (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    setDragOverId(blockId);
  };

  const handleDragLeave = (e: React.DragEvent, blockId: string) => {
    // Only clear if we're leaving this specific block's row
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      if (dragOverId === blockId) {
        setDragOverId(null);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetBlockId: string) => {
    e.preventDefault();
    setDragOverId(null);

    // Read source ID from dataTransfer
    const sourceId = e.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === targetBlockId) {
      setDraggedId(null);
      return;
    }

    const draggedIndex = blocks.findIndex((b) => b.id === sourceId);
    const targetIndex = blocks.findIndex((b) => b.id === targetBlockId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const reordered = [...blocks];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    setDraggedId(null);
    await onReorderBlocks(reordered);
  };

  const handleDropAtEnd = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverEnd(false);

    const sourceId = e.dataTransfer.getData("text/plain");
    if (!sourceId) { setDraggedId(null); return; }

    const draggedIndex = blocks.findIndex((b) => b.id === sourceId);
    if (draggedIndex === -1 || draggedIndex === blocks.length - 1) {
      setDraggedId(null);
      return;
    }

    const reordered = [...blocks];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.push(moved);

    setDraggedId(null);
    await onReorderBlocks(reordered);
  };

  return (
    <div style={{ flex: 1, padding: "16px 40px" }}>
      <h1 style={{ textAlign: "left" }}>{page.title}</h1>

      {/* block list */}
      <div>
        {blocks.map((block) => {
          const isDragging = draggedId === block.id;
          const isDropTarget = dragOverId === block.id && draggedId !== block.id;
          const isEditing = editingId === block.id;
          const canEdit = !NON_EDITABLE_TYPES.has(block.block_type.type);

          return (
            <div
              key={block.id}
              onDragEnter={(e) => handleDragEnter(e, block.id)}
              onDragLeave={(e) => handleDragLeave(e, block.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, block.id)}
              style={{
                marginBottom: "4px",
                padding: "4px 8px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                opacity: isDragging ? 0.4 : 1,
                borderTop: isDropTarget ? "2px solid #DD4CAB" : "2px solid transparent",
                transition: "border-color 0.1s, opacity 0.1s",
                cursor: "default",
              }}
            >
              {/* drag handle */}
              <span
                draggable
                onDragStart={(e) => handleDragStart(e, block.id)}
                onDragEnd={handleDragEnd}
                title="Drag to reorder"
                style={{
                  cursor: "grab",
                  color: "#888",
                  fontSize: "16px",
                  userSelect: "none",
                  flexShrink: 0,
                  lineHeight: 1,
                  pointerEvents: draggedId && draggedId !== block.id ? "none" : "auto",
                }}
              >
                {/* TO-D0: replace me D: should be simialr to notion to where it only appears when you hover over the area*/}
                D:
              </span>

              {/* block content: editing or rendered */}
              <div
                style={{ 
                  flex: 1,
                pointerEvents: draggedId ? "none" : "auto"
              }}
                onClick={() => {
                  if (canEdit && !isEditing) startEditing(block);
                }}
              >
                {isEditing ? (
                  <textarea
                    autoFocus
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={handleEditKeyDown}
                    rows={1}
                    style={{
                      width: "100%",
                      resize: "none",
                      background: "transparent",
                      border: "none",
                      outline: "1px solid #DD4CAB",
                      borderRadius: "3px",
                      padding: "2px 4px",
                      font: "inherit",
                      fontSize: "inherit",
                      color: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                ) : (
                  <BlockRenderer block={block} onNavigate={onNavigate} />
                )}
              </div>

              {/* Delete button */}
              <button
                onClick={() => onDeleteBlock(block.id)}
                style={{
                  marginLeft: "4px",
                  color: "#DD4CAB",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  flexShrink: 0,
                  fontSize: "14px",
                  padding: "2px 4px",
                  pointerEvents: draggedId ? "none" : "auto",
                }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* end drop so that we can drop at the end */}
      {draggedId && (
        <div
          onDragEnter={(e) => { e.preventDefault(); setDragOverEnd(true); }}
          onDragLeave={() => setDragOverEnd(false)}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
          onDrop={handleDropAtEnd}
          style={{
            height: "32px",
            borderRadius: "4px",
            borderTop: dragOverEnd ? "2px solid #DD4CAB" : "2px solid transparent",
            transition: "border-color 0.1s",
          }}
        />
      )}

      {/* new block input */}
      <div
        style={{
          marginTop: "12px",
          display: "flex",
          gap: "8px",
        }}
      >
        <input
          type="text"
          value={newBlockContent}
          onChange={(e) => setNewBlockContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreateBlock();
          }}
          placeholder="Type something..."
          style={{ width: "100%", padding: "8px" }}
        />
        <button onClick={handleCreateBlock}>Add Block</button>
      </div>
    </div>
  );
}
