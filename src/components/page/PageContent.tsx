import { useState, useRef, useEffect } from "react";
import { BlockRenderer } from "../blocks/BlockRenderer";
import type { Block } from "../../types/Block";
import type { Page } from "../../types/Page";
import type { BlockType } from "../../types/BlockType";
import removeIcon from "/remove.png";
import gripIcon from "/grip.png";

const NON_EDITABLE_TYPES = new Set(["SubPage", "PageLink", "Divider"]);

interface PageContentProps {
  page: Page;
  blocks: Block[];
  onCreateBlock: (pageId: string, blockType: BlockType, content: string) => Promise<void>;
  onCreateBlockAfter: (pageId: string, blockType: BlockType, content: string, afterBlockId: string) => Promise<Block | null>;
  onDeleteBlock: (blockId: string) => Promise<void>;
  onUpdateBlock: (blockId: string, content: string) => Promise<void>;
  onReorderBlocks: (reorderedBlocks: Block[]) => Promise<void>;
  onNavigate: (page: Page) => void;
}

export function PageContent({
  page,
  blocks,
  onCreateBlock,
  onCreateBlockAfter,
  onDeleteBlock,
  onUpdateBlock,
  onReorderBlocks,
  onNavigate,
}: PageContentProps) {
  const [newBlockContent, setNewBlockContent] = useState("");

  // inline editing states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const newBlockInputRef = useRef<HTMLInputElement>(null);
  const [pendingCursorPos, setPendingCursorPos] = useState<number | null>(null);

  useEffect(() => {
    if (pendingCursorPos !== null && textareaRef.current) {
      textareaRef.current.setSelectionRange(pendingCursorPos, pendingCursorPos);
      setPendingCursorPos(null);
    }
  }, [pendingCursorPos, editingId]);

  const [pendingFocusBlockId, setPendingFocusBlockId] = useState<string | null>(null);

  useEffect(() => {
    if (pendingFocusBlockId) {
      const block = blocks.find(b => b.id === pendingFocusBlockId);
      if (block) {
        setEditingId(block.id);
        setEditingContent(block.content);
        setPendingCursorPos(0);
        setPendingFocusBlockId(null);
      }
    }
  }, [blocks, pendingFocusBlockId]);

  // drag-and-drop states
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverEnd, setDragOverEnd] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // block creation

  const handleCreateBlock = async () => {
    console.log("fuck ass block");
    // if (newBlockContent.trim()) {
    const blockType: BlockType = { type: "Text" };
    await onCreateBlock(page.id, blockType, newBlockContent);
    setNewBlockContent("");
    // }
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

  const navigateToBlock = async (block: Block, cursorPos: number) => {
    if (editingId !== null) {
      const original = blocks.find((b) => b.id === editingId);
      if (original && editingContent !== original.content) {
        await onUpdateBlock(editingId, editingContent);
      }
    }
    setEditingId(block.id);
    setEditingContent(block.content);
    setPendingCursorPos(cursorPos);
  };

  const handleEditKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const { selectionStart, value } = e.currentTarget;

    if (e.key === "ArrowUp") {
      const isOnFirstLine = value.lastIndexOf('\n', selectionStart - 1) === -1;
      if (isOnFirstLine) {
        e.preventDefault();
        const currentIndex = blocks.findIndex(b => b.id === editingId);
        if (currentIndex > 0) {
          const prevBlock = blocks[currentIndex - 1];
          if (!NON_EDITABLE_TYPES.has(prevBlock.block_type.type)) {
            navigateToBlock(prevBlock, prevBlock.content.length);
          }
        }
      }
    }

    if (e.key === "ArrowDown") {
      const isOnLastLine = value.indexOf('\n', selectionStart) === -1;
      if (isOnLastLine) {
        e.preventDefault();
        const currentIndex = blocks.findIndex(b => b.id === editingId);
        if (currentIndex < blocks.length - 1) {
          const nextBlock = blocks[currentIndex + 1];
          if (!NON_EDITABLE_TYPES.has(nextBlock.block_type.type)) {
            navigateToBlock(nextBlock, 0);
          }
        } else {
          await commitEdit();
          newBlockInputRef.current?.focus();
        }
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const contentBefore = editingContent.slice(0, selectionStart);
      const contentAfter = editingContent.slice(selectionStart);
      const currentBlockId = editingId!;
      setEditingContent(contentBefore);
      setEditingId(null);
      await onUpdateBlock(currentBlockId, contentBefore);
      const newBlock = await onCreateBlockAfter(page.id, { type: "Text" }, contentAfter, currentBlockId);
      if (newBlock) {
        setPendingFocusBlockId(newBlock.id);
      }
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
    <div className="flex-1 px-10 py-4">
      <h1>{page.title}</h1>

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
              onMouseEnter={() => setHoveredId(block.id)}
              onMouseLeave={() => setHoveredId(null)}
              onDrop={(e) => handleDrop(e, block.id)}
              className="mb-1 flex items-start gap-1.5 transition-all ease-in-out duration-100 cursor-default group"
              style={{
                opacity: isDragging ? 0.4 : 1,
                borderTop: isDropTarget ? "2px solid #DD4CAB" : "2px solid transparent",
              }}
            >
              {/* drag handle */}
              <span
                draggable
                onDragStart={(e) => handleDragStart(e, block.id)}
                onDragEnd={handleDragEnd}
                title="Drag to reorder"
                className="cursor-grab text-[#888] text-base p-0.5 select-none shrink-0 leading-none transition-all duration-200 absolute -translate-x-6"
                style={{
                  pointerEvents: draggedId && draggedId !== block.id ? "none" : "auto",
                  opacity: hoveredId === block.id ? "100" : "0",
                }}
              >
                {/* TO-D0: replace me D: should be simialr to notion to where it only appears when you hover over the area*/}
                <img className="max-h-6" src={gripIcon}/>
              </span>

              {/* block content: editing or rendered */}
              <div
                className="flex-1"
                style={{ pointerEvents: draggedId ? "none" : "auto" }}
                onClick={() => {
                  if (canEdit && !isEditing) startEditing(block);
                }}
              >
                {isEditing ? (
                  <textarea
                    ref={textareaRef}
                    autoFocus
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={handleEditKeyDown}
                    rows={1}
                    placeholder="Press '/' for commands"
                    className="w-full resize-none bg-transparent outline-none font-[inherit] text-[inherit] leading-[inherit] block min-h-[1em]"
                    style={{ fieldSizing: "content", padding: 0 } as React.CSSProperties}
                  />
                ) : (
                  <BlockRenderer block={block} onNavigate={onNavigate} />
                )}
              </div>

              {/* Delete button */}
              <button
                onClick={() => onDeleteBlock(block.id)}
                className="ml-1 text-[#DD4CAB] bg-transparent border-0 cursor-pointer text-sm px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-all ease-in-out"
                style={{ pointerEvents: draggedId ? "none" : "auto" }}
              >
                <img className="w-4" src={removeIcon}/>
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
          className="h-8 transition-colors duration-100"
          style={{
            borderTop: dragOverEnd ? "2px solid #DD4CAB" : "2px solid transparent",
          }}
        />
      )}

      {/* new block input */}
      <div className="mt-3 flex gap-2">
        <input
          ref={newBlockInputRef}
          type="text"
          value={newBlockContent}
          onChange={(e) => setNewBlockContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreateBlock();
            if (e.key === "ArrowUp") {
              e.preventDefault();
              for (let i = blocks.length - 1; i >= 0; i--) {
                const block = blocks[i];
                if (!NON_EDITABLE_TYPES.has(block.block_type.type)) {
                  navigateToBlock(block, block.content.length);
                  break;
                }
              }
            }
          }}
          placeholder="Press '/' for commands"
          className="bg-transparent p-0 border-0 outline-none"
        />
        {/* <button onClick={handleCreateBlock}>Add Block</button> */}
      </div>
    </div>
  );
}
