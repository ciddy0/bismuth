import { useState } from "react";
import type { Page } from "../../types/Page";
import { PageWithChildren } from "../../services/pageService";
import toRightIcon from "/right.png";
import toDownIcon from "/down.png";

/**
 * recursive tree node component for rendering a hierarchical page sidebar.
 *
 * this component is controlled by its parent for expansion state and
 * delegates page selection and child creation via callbacks.
 *
 * TO-DO: animate expand/collapse
 * TO-DO: persist expansion state
 * TO-DO: drag & drop reordering
 * TO-DO: keyboard navigation
 */

interface PageTreeItemProps {
  page: PageWithChildren;
  depth?: number;
  currentPageId: string | null;
  isExpanded: boolean;
  onToggleExpansion: (pageId: string) => void;
  onPageSelect: (page: Page) => void;
  onCreateChild: (parentId: string, title: string) => Promise<void>;
}

export function PageTreeItem({
  page,
  depth = 0,
  currentPageId,
  isExpanded,
  onToggleExpansion,
  onPageSelect,
  onCreateChild,
}: PageTreeItemProps) {
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [childPageTitle, setChildPageTitle] = useState("");

  const hasChildren = page.children && page.children.length > 0;

  const handleCreateChild = async () => {
    if (childPageTitle.trim()) {
      await onCreateChild(page.id, childPageTitle);
      setIsAddingChild(false);
      setChildPageTitle("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCreateChild();
    } else if (e.key === "Escape") {
      setIsAddingChild(false);
      setChildPageTitle("");
    }
  };

  return (
    <div>
      <div
        className="flex items-center gap-1 px-2 py-1 cursor-pointer mb-1 transition-colors duration-200 hover:bg-[#2C2C2C]"
        style={{
          marginLeft: `${depth * 16}px`,
          background: currentPageId === page.id ? "#434343" : "",
        }}
      >
        <span
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpansion(page.id);
          }}
          className="cursor-pointer w-4 text-center mr-0.5"
        >
          <img
            src={toRightIcon}
            alt={isExpanded ? "Collapse" : "Expand"}
            className="transition-all ease-in-out"
            style={{
              rotate: isExpanded ? "90deg" : "0deg",
            }}
          />
        </span>

        <span onClick={() => onPageSelect(page)} className="flex-1">
          {page.icon} {page.title}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsAddingChild(true);
          }}
          className="text-xs px-2 py-1 bg-transparent"
        >
            <img className="inline max-h-5" src={"/add.png"}/>
        </button>
      </div>

      {isAddingChild && (
        <div
          className="mb-2 flex items-center justify-center"
          style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
        >
          <input
            type="text"
            value={childPageTitle}
            onChange={(e) => setChildPageTitle(e.target.value)}
            placeholder="Page title..."
            autoFocus
            onKeyDown={handleKeyDown}
            className="w-[150px] px-1 py-1 mr-1"
          />
          <button onClick={handleCreateChild} className="bg-transparent text-xs p-2">
            <img className="inline max-h-5" src={"/add.png"}/>
          </button>
          <button
            onClick={() => {
              setIsAddingChild(false);
              setChildPageTitle("");
            }}
            className="bg-transparent text-xs p-2 ml-1"
          >
            <img className="inline max-h-5" src={"/remove.png"}/>
          </button>
        </div>
      )}

      {isExpanded && (
        <div>
          {hasChildren ? (
            page.children!.map((child) => (
              <PageTreeItem
                key={child.id}
                page={child}
                depth={depth + 1}
                currentPageId={currentPageId}
                isExpanded={child.isExpanded || false}
                onToggleExpansion={onToggleExpansion}
                onPageSelect={onPageSelect}
                onCreateChild={onCreateChild}
              />
            ))
          ) : (
            <div
              className="text-[#999] text-sm italic"
              style={{ paddingLeft: `${(depth + 1) * 16 + 24}px` }}
            >
              No pages inside
            </div>
          )}
        </div>
      )}
    </div>
  );
}
