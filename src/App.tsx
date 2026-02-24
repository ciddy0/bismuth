import { useEffect } from "react";
import "./App.css";
import { Sidebar } from "./components/sidebar/Sidebar";
import { PageHeader } from "./components/page/PageHeader";
import { PageContent } from "./components/page/PageContent";
import { EmptyState } from "./components/page/EmptyState";
import { usePages } from "./hooks/usePages";
import { useBlocks } from "./hooks/useBlocks";
import { useCurrentPage } from "./hooks/useCurrentPage";
import { pageService } from "./services/pageService";
import { blockService } from "./services/blockService";
import type { Block } from "./types/Block";
import type { BlockType } from "./types/BlockType";

function App() {
  const {
    pages,
    expandedPages,
    loadPages,
    createPage,
    toggleExpansion,
    setExpandedPages,
  } = usePages();

  const { blocks, loadBlocks, createBlock, deleteBlock, updateBlock, reorderBlocks } = useBlocks();

  const { currentPage, setCurrentPage } = useCurrentPage((page) => {
    if (page) {
      loadBlocks(page.id);
    }
  });

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const handleCreatePage = async (title: string) => {
    const page = await createPage(title);
    if (page) {
      setCurrentPage(page);
    }
  };

  const handleCreateNestedPage = async (parentId: string, title: string) => {
    if (!title.trim()) return;

    try {
      const newPage = await pageService.createNestedPage(title, parentId);

      // Create a SubPage block in the parent page
      const blockType: BlockType = {
        type: "SubPage",
        data: { page_id: newPage.id },
      };
      await blockService.createBlock(parentId, blockType, title, null);

      // Expand the parent page to show the new child
      setExpandedPages((prev) => {
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
      console.error("Failed to create nested page:", error);
    }
  };

  const handleCreateBlock = async (
    pageId: string,
    blockType: BlockType,
    content: string
  ) => {
    await createBlock(pageId, blockType, content);
  };

  const handleDeleteBlock = async (blockId: string) => {
    await deleteBlock(blockId);
    await loadPages(); // Refresh pages in case a SubPage block was deleted
  };

  const handleUpdateBlock = async (blockId: string, content: string) => {
    await updateBlock(blockId, content);
  };

  const handleReorderBlocks = async (reorderedBlocks: Block[]) => {
    await reorderBlocks(reorderedBlocks);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        pages={pages}
        currentPageId={currentPage?.id || null}
        expandedPages={expandedPages}
        onToggleExpansion={toggleExpansion}
        onPageSelect={setCurrentPage}
        onCreatePage={handleCreatePage}
        onCreateChild={handleCreateNestedPage}
      />

      <div style={{ width: "100%" }}>
        {currentPage ? (
          <>
            <PageHeader page={currentPage} onUpdate={() => loadPages()} />
            <PageContent
              page={currentPage}
              blocks={blocks}
              onCreateBlock={handleCreateBlock}
              onDeleteBlock={handleDeleteBlock}
              onUpdateBlock={handleUpdateBlock}
              onReorderBlocks={handleReorderBlocks}
              onNavigate={setCurrentPage}
            />
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

export default App;