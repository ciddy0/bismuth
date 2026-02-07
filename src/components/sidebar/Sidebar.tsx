import { useState } from "react";
import { SearchBar } from "./SearchBar";
import { PageTree } from "./PageTree";
import type { Page } from "../../types/Page";
import { PageWithChildren } from "../../services/pageService";

/**
 * main container for the page navigation sidebar.
 * 
 * TODO: filter PageTree results using searchQuery
 * TODO: show empty state when no pages exist
 * TODO: add keyboard shortcuts for new page?
 * TODO: make sidebar resizable or collapse
 */
interface SidebarProps {
  pages: PageWithChildren[];
  currentPageId: string | null;
  expandedPages: Set<string>;
  onToggleExpansion: (pageId: string) => void;
  onPageSelect: (page: Page) => void;
  onCreatePage: (title: string) => Promise<void>;
  onCreateChild: (parentId: string, title: string) => Promise<void>;
}
export function Sidebar({
  pages,
  currentPageId,
  expandedPages,
  onToggleExpansion,
  onPageSelect,
  onCreatePage,
  onCreateChild,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [newPageTitle, setNewPageTitle] = useState("");

  const handleCreatePage = async () => {
    if (newPageTitle.trim()) {
      await onCreatePage(newPageTitle);
      setNewPageTitle("");
    }
  };

  return (
    <div className="sidebar">
      <h2>Pages</h2>

      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      <div className="create-page-wrapper">
        <input
          type="text"
          value={newPageTitle}
          onChange={(e) => setNewPageTitle(e.target.value)}
          placeholder="New page title..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleCreatePage();
            }
          }}
          style={{ width: "100%" }}
        />
        <button onClick={handleCreatePage}>+</button>
      </div>

      <PageTree
        pages={pages}
        currentPageId={currentPageId}
        expandedPages={expandedPages}
        onToggleExpansion={onToggleExpansion}
        onPageSelect={onPageSelect}
        onCreateChild={onCreateChild}
      />
    </div>
  );
}