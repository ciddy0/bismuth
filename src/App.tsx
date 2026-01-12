import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

interface Page {
  id: string;
  title: string;
  icon: string | null;
  cover: string | null;
  parent_id: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface PageWithChildren extends Page {
  children?: PageWithChildren[];
  isExpanded?: boolean;
}

interface Block {
  id: string;
  page_id: string;
  block_type: BlockType;
  content: string;
  parent_id: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

type BlockType = 
  | { type: "Text" }
  | { type: "Heading1" }
  | { type: "Heading2" }
  | { type: "Heading3" }
  | { type: "BulletList" }
  | { type: "NumberedList" }
  | { type: "Todo", data: { checked: boolean } }
  | { type: "Code", data: { language: string } }
  | { type: "Quote" }
  | { type: "Divider" }
  | { type: "SubPage", data: { page_id: string } }
  | { type: "PageLink", data: { page_id: string } };

function App() {
  const [pages, setPages] = useState<PageWithChildren[]>([]);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newBlockContent, setNewBlockContent] = useState("");
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [addingChildTo, setAddingChildTo] = useState<string | null>(null);
  const [childPageTitle, setChildPageTitle] = useState("");

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    if (currentPage) {
      loadBlocks(currentPage.id);
    }
  }, [currentPage]);

  async function loadPages() {
    try {
      const rootPages = await invoke<Page[]>("get_root_pages");
      console.log(rootPages);
      const pagesWithChildren = await Promise.all(
        rootPages.map(async (page) => ({
          ...page,
          children: await loadChildPages(page.id),
          isExpanded: expandedPages.has(page.id)
        }))
      );
      setPages(pagesWithChildren);
    } catch (error) {
      console.error("failed to load pages D:", error);
    }
  }

  async function loadChildPages(parentId: string): Promise<PageWithChildren[]> {
    try {
      const children = await invoke<Page[]>("get_child_pages", { parentId });
      console.log(children);
      return Promise.all(
        children.map(async (child) => ({
          ...child,
          children: await loadChildPages(child.id),
          isExpanded: expandedPages.has(child.id)
        }))
      );
    } catch (error) {
      console.error("failed to load child pages D:", error);
      return [];
    }
  }

  async function loadBlocks(pageId: string) {
    try {
      const pageBlocks = await invoke<Block[]>("get_page_blocks", { pageId });
      setBlocks(pageBlocks);
      console.log(pageBlocks);
    } catch (error) {
      console.error("failed to load blocks D:", error);
    }
  }

  async function createPage() {
    if (!newPageTitle.trim()) return;
    
    try {
      const page = await invoke<Page>("create_page", { title: newPageTitle });
      setNewPageTitle("");
      setCurrentPage(page);
      await loadPages();
    } catch (error) {
      console.error("failed to create page D:", error);
    }
  }

  async function createNestedPage(parentId: string, title: string) {
    if (!title.trim()) return;
    
    try {
      const newPage = await invoke<Page>("create_nested_page", { title, parentId });
      
      // Create a SubPage block in the parent page
      await invoke<Block>("create_block", {
        pageId: parentId,
        blockType: { type: "SubPage", data: { page_id: newPage.id } },
        content: title,
        parentId: null
      });
      
      setAddingChildTo(null);
      setChildPageTitle("");
      
      // Expand the parent page to show the new child
      setExpandedPages(prev => {
        const next = new Set(prev);
        next.add(parentId);
        return next;
      });
      
      await loadPages();
      
      // Refresh blocks if we're currently viewing the parent page
      if (currentPage?.id === parentId) {
        await loadBlocks(parentId);
      }
    } catch (error) {
      console.error("failed to create nested page D:", error);
    }
  }

  function togglePageExpansion(pageId: string) {
    setExpandedPages(prev => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  }

  function renderPageTree(page: PageWithChildren, depth: number = 0) {
    const hasChildren = page.children && page.children.length > 0;
    const isExpanded = expandedPages.has(page.id);
    const isAddingChild = addingChildTo === page.id;

    return (
      <div key={page.id}>
        <div
          className="page-list-item"
          style={{
            marginLeft: `${depth * 16}px`,
            padding: "4px 8px",
            cursor: "pointer",
            background: currentPage?.id === page.id ? "#434343" : "",
            borderRadius: "4px",
            marginBottom: "4px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            transition: "background 0.2s"
          }}
        >
          <span
            onClick={(e) => {
              e.stopPropagation();
              togglePageExpansion(page.id);
            }}
            style={{ cursor: "pointer", width: "16px", textAlign: "center" }}
          >
            {isExpanded ? "▼" : "▶"}
          </span>
          
          <span onClick={() => setCurrentPage(page)} style={{ flex: 1 }}>
            {page.icon} {page.title}
          </span>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAddingChildTo(page.id);
            }}
            style={{ fontSize: "12px", padding: "4px 8px" }}
          >
            +
          </button>
        </div>

        {isAddingChild && (
          <div style={{ paddingLeft: `${(depth + 1) * 16 + 8}px`, marginBottom: "8px" }}>
            <input
              type="text"
              value={childPageTitle}
              onChange={(e) => setChildPageTitle(e.target.value)}
              placeholder="Page title..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  createNestedPage(page.id, childPageTitle);
                } else if (e.key === "Escape") {
                  setAddingChildTo(null);
                  setChildPageTitle("");
                }
              }}
              style={{ width: "150px", padding: "4px", marginRight: "4px" }}
            />
            <button
              onClick={() => createNestedPage(page.id, childPageTitle)}
              style={{ padding: "4px 8px", fontSize: "12px" }}
            >
              ✓
            </button>
            <button
              onClick={() => {
                setAddingChildTo(null);
                setChildPageTitle("");
              }}
              style={{ padding: "4px 8px", fontSize: "12px", marginLeft: "4px" }}
            >
              ✕
            </button>
          </div>
        )}

        {isExpanded && (
          <div>
            {hasChildren ? (
              page.children!.map(child => renderPageTree(child, depth + 1))
            ) : (
              <div
                style={{
                  paddingLeft: `${(depth + 1) * 16 + 24}px`,
                  color: "#999",
                  fontSize: "14px",
                  fontStyle: "italic"
                }}
              >
                No pages inside
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  async function createBlock() {
    if (!currentPage || !newBlockContent.trim()) return;

    try {
      const block = await invoke<Block>("create_block", {
        pageId: currentPage.id,
        blockType: { type: "Text" },
        content: newBlockContent,
        parentId: null
      });
      setBlocks([...blocks, block]);
      setNewBlockContent("");
    } catch (error) {
      console.error("failed to create block D:", error);
    }
  }

  async function deleteBlock(blockId: string) {
    try {
      await invoke("delete_block", { blockId });
      setBlocks(blocks.filter(b => b.id !== blockId));
      
      await loadPages();
    } catch (error) {
      console.error("failed to delete block D:", error);
    }
  }

  function renderBlockContent(block: Block) {
    const blockType = block.block_type.type;

    switch (blockType) {
      case "Heading1":
        return <h1>{block.content}</h1>;
      case "Heading2":
        return <h2>{block.content}</h2>;
      case "Heading3":
        return <h3>{block.content}</h3>;
      case "BulletList":
        return <li>{block.content}</li>;
      case "Quote":
        return <blockquote>{block.content}</blockquote>;
      case "Code":
        return <pre><code>{block.content}</code></pre>;
      case "SubPage":
        const subPageId = (block.block_type as any).data.page_id;
        return (
          <div 
            className="subpage-link"
            style={{ 
              padding: "12px", 
              background: "#F09BDC20", 
              color: "#ffffff",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onClick={async () => {
              try {
                const page = await invoke<Page>("get_page", { pageId: subPageId });
                setCurrentPage(page);
              } catch (error) {
                console.error("Failed to load page:", error);
              }
            }}
          >
            📄 {block.content}
          </div>
        );
      case "PageLink":
        const pageLinkId = (block.block_type as any).data.page_id;
        return (
          <div 
            style={{ 
              padding: "8px", 
              background: "#e8f4ff", 
              borderRadius: "4px",
              cursor: "pointer",
              border: "1px solid #b3d9ff",
              display: "inline-block"
            }}
            onClick={async () => {
              try {
                const page = await invoke<Page>("get_page", { pageId: pageLinkId });
                setCurrentPage(page);
              } catch (error) {
                console.error("Failed to load page:", error);
              }
            }}
          >
            🔗 {block.content}
          </div>
        );
      default:
        return <p>{block.content}</p>;
    }
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Pages</h2>

        {/* searchbar [FIXME] */}
        <input 
          placeholder="Search pages..."
          style={{marginBottom: "8px"}}>
        </input>
        
        <div className="create-page-wrapper">
          <input
            type="text"
            value={newPageTitle}
            onChange={(e) => setNewPageTitle(e.target.value)}
            placeholder="New page title..."
            style={{ width: "100%" }}
          />
          <button onClick={createPage} style={{}}>
            +
          </button>
        </div>

        <div>
          {pages.map(page => renderPageTree(page))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "40px" }}>
        {currentPage ? (
          <>
            <h1 style={{textAlign: "left"}}>{currentPage.title}</h1>
            
            <div style={{
              marginBottom: "20px",
              display: "flex",
              gap: "8px",}}>
              <input
                type="text"
                value={newBlockContent}
                onChange={(e) => setNewBlockContent(e.target.value)}
                placeholder="Type something..."
                style={{ width: "100%", padding: "8px" }}
              />
              <button onClick={createBlock}>Add Block</button>
            </div>

            <div>
              {blocks.map(block => (
                <div
                  key={block.id}
                  style={{
                    marginBottom: "12px",
                    padding: "8px",
                    borderRadius: "4px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div style={{ flex: 1 }}>
                    {renderBlockContent(block)}
                  </div>
                  <button
                    onClick={() => deleteBlock(block.id)}
                    style={{ marginLeft: "8px", color: "#DD4CAB" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", marginTop: "100px", color: "#999" }}>
            <p>Select a page or create a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;