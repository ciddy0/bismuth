import { PageTreeItem } from "./PageTreeItem";
import type { Page } from "../../types/Page";
import { PageWithChildren } from "../../services/pageService";

/**
 * root container component for rendering a hierarchical page tree, which 
 * renders all top-level pages, Passes shared state to each tree item, and 
 * delegates expansion, selection, and child creation through callbacks
 */

interface PageTreeProps {
  pages: PageWithChildren[];
  currentPageId: string | null;
  expandedPages: Set<string>;
  onToggleExpansion: (pageId: string) => void;
  onPageSelect: (page: Page) => void;
  onCreateChild: (parentId: string, title: string) => Promise<void>;
}

export function PageTree({
  pages,
  currentPageId,
  expandedPages,
  onToggleExpansion,
  onPageSelect,
  onCreateChild,
}: PageTreeProps) {
  return (
    <div>
      {pages.map((page) => (
        <PageTreeItem
          key={page.id}
          page={page}
          currentPageId={currentPageId}
          isExpanded={expandedPages.has(page.id)}
          onToggleExpansion={onToggleExpansion}
          onPageSelect={onPageSelect}
          onCreateChild={onCreateChild}
        />
      ))}
    </div>
  );
}