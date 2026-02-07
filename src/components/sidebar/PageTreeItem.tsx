import { useState } from "react";
import type { Page } from "../../types/Page";
import { PageWithChildren } from "../../services/pageService";
import toRightIcon from "../../assets/to-right.png";
import toDownIcon from "../../assets/to-down.png";

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
        className="page-list-item"
        style={{
          marginLeft: `${depth * 16}px`,
          padding: "4px 8px",
          cursor: "pointer",
          background: currentPageId === page.id ? "#434343" : "",
          borderRadius: "4px",
          marginBottom: "4px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          transition: "background 0.2s",
        }}
      >
        <span
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpansion(page.id);
          }}
          style={{ cursor: "pointer", width: "16px", textAlign: "center" }}
        >
          <img
            src={isExpanded ? toDownIcon : toRightIcon}
            alt={isExpanded ? "Collapse" : "Expand"}
            style={{
              width: "12px",
              height: "12px",
              opacity: 0.85,
            }}
          />
        </span>

        <span onClick={() => onPageSelect(page)} style={{ flex: 1 }}>
          {page.icon} {page.title}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsAddingChild(true);
          }}
          style={{ fontSize: "12px", padding: "4px 8px" }}
        >
          +
        </button>
      </div>

      {isAddingChild && (
        <div
          style={{
            paddingLeft: `${(depth + 1) * 16 + 8}px`,
            marginBottom: "8px",
          }}
        >
          <input
            type="text"
            value={childPageTitle}
            onChange={(e) => setChildPageTitle(e.target.value)}
            placeholder="Page title..."
            autoFocus
            onKeyDown={handleKeyDown}
            style={{ width: "150px", padding: "4px", marginRight: "4px" }}
          />
          <button
            onClick={handleCreateChild}
            style={{ padding: "4px 8px", fontSize: "12px" }}
          >
            ✓
          </button>
          <button
            onClick={() => {
              setIsAddingChild(false);
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
              style={{
                paddingLeft: `${(depth + 1) * 16 + 24}px`,
                color: "#999",
                fontSize: "14px",
                fontStyle: "italic",
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
