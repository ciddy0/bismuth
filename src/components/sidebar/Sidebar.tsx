import { useState } from "react";
import { SearchBar } from "./SearchBar";
import { PageTree } from "./PageTree";
import { SearchPanel } from "./SearchPanel";
import type { Page } from "../../types/Page";
import { PageWithChildren } from "../../services/pageService";
import { addIcon } from "/add.png";

interface SidebarProps {
  pages: PageWithChildren[];
  currentPageId: string | null;
  expandedPages: Set<string>;
  onToggleExpansion: (pageId: string) => void;
  onPageSelect: (page: Page) => void;
  onCreatePage: (title: string) => Promise<void>;
  onCreateChild: (parentId: string, title: string) => Promise<void>;
}

function findPageById(pages: PageWithChildren[], id: string): Page | null {
  for (const page of pages) {
    if (page.id === id) return page;
    if (page.children?.length) {
      const found = findPageById(page.children, id);
      if (found) return found;
    }
  }
  return null;
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
    <div className="w-80 h-screen flex flex-col border-r border-[#444] p-4 shrink-0">
      <h2>Pages</h2>

      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      {searchQuery === "" ? (
        <>
          <div className="flex gap-[2%] mb-2">
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
              className="w-full"
            />
            <button onClick={handleCreatePage}>            
              <img className="inline max-h-5" src={"/add.png"}/>
            </button>
          </div>

          <PageTree
            pages={pages}
            currentPageId={currentPageId}
            expandedPages={expandedPages}
            onToggleExpansion={onToggleExpansion}
            onPageSelect={onPageSelect}
            onCreateChild={onCreateChild}
          />
        </>
      ) : (
        <SearchPanel
          externalQuery={searchQuery}
          onNavigate={(pageId, blockId) => {
            const page = findPageById(pages, pageId);
            if (page) {
              onPageSelect(page);
              if (blockId) {
                setTimeout(() => {
                  document
                    .getElementById(`block-${blockId}`)
                    ?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }
            }
          }}
        />
      )}
    </div>
  );
}