// components/sidebar/SearchPanel.tsx
import { useState, useEffect, useRef } from "react";
import type { SearchResponse } from "../../types/SearchResponse";
import type { SearchFileGroup } from "../../types/SearchFileGroup";
import { searchService } from "../../services/searchService";
import toRightIcon from "../../assets/to-right.png";
import toDownIcon from "../../assets/to-down.png";
import pageIcon from "../../assets/page.png";
import "./SearchPanel.css";

interface SearchPanelProps {
  onNavigate: (pageId: string, blockId?: string) => void;
  externalQuery?: string;
}

export function SearchPanel({ onNavigate, externalQuery }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const effectiveQuery = externalQuery !== undefined ? externalQuery : query;
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!effectiveQuery.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await searchService.searchBlocks(effectiveQuery, caseSensitive, wholeWord);
        setResults(res);
      } catch (err) {
        console.error("Search failed:", err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [effectiveQuery, caseSensitive, wholeWord]);

  const toggleGroup = (pageId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return next;
    });
  };

  const fileCount = results?.groups.length ?? 0;
  const matchCount = results?.total_matches ?? 0;

  return (
    <div className="search-panel">
      {externalQuery === undefined && (
        <div className="search-input-area">
          <div className="search-input-row">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="search-input"
            />
            <div className="search-toggle-group">
              <ToggleButton
                active={caseSensitive}
                onClick={() => setCaseSensitive(!caseSensitive)}
                title="Match Case"
                label="Aa"
              />
              <ToggleButton
                active={wholeWord}
                onClick={() => setWholeWord(!wholeWord)}
                title="Match Whole Word"
                label="ab"
                wholeWord
              />
            </div>
          </div>
        </div>
      )}

      {results && effectiveQuery.trim() && (
        <div className="search-summary">
          {matchCount} result{matchCount !== 1 ? "s" : ""} in {fileCount} file
          {fileCount !== 1 ? "s" : ""}
        </div>
      )}
      
      <div className="search-results-list">
        {results?.groups.map((group: SearchFileGroup) => (
          <FileGroup
            key={group.page_id}
            group={group}
            query={effectiveQuery}
            isCollapsed={collapsedGroups.has(group.page_id)}
            onToggle={() => toggleGroup(group.page_id)}
            onNavigate={onNavigate}
          />
        ))}

        {effectiveQuery.trim() && results && results.total_matches === 0 && (
          <div className="search-no-results">No results found.</div>
        )}
      </div>
    </div>
  );
}

function FileGroup({
  group,
  query,
  isCollapsed,
  onToggle,
  onNavigate,
}: {
  group: SearchFileGroup;
  query: string;
  isCollapsed: boolean;
  onToggle: () => void;
  onNavigate: (pageId: string, blockId?: string) => void;
}) {
  return (
    <div>
      <div className="search-file-header" onClick={onToggle}>
        <img
          src={isCollapsed ? toRightIcon : toDownIcon}
          alt={isCollapsed ? "Expand" : "Collapse"}
          className="search-file-header-icon"
        />
        <img
          src={pageIcon}
          alt="Page"
          className="search-file-page-icon"
        />
        <span className="search-file-title">{group.page_title}</span>
        <span className="search-match-badge">{group.matches.length}</span>
      </div>

      {!isCollapsed && (
        <div>
          {group.matches.map((match, i) => (
            <div
              key={`${match.block_id}-${match.match_start}-${i}`}
              className="search-match-line"
              onClick={() => {
                const blockId = match.block_id.startsWith("title-")
                  ? undefined
                  : match.block_id;
                onNavigate(group.page_id, blockId);
              }}
            >
              <div className="search-match-content">
                <HighlightedText text={match.snippet} query={query} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const lower = text.toLowerCase();
  const lowerQ = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let last = 0;
  let idx = lower.indexOf(lowerQ);

  while (idx !== -1) {
    if (idx > last) parts.push(text.slice(last, idx));
    parts.push(
      <span key={idx} className="search-highlight">
        {text.slice(idx, idx + query.length)}
      </span>
    );
    last = idx + query.length;
    idx = lower.indexOf(lowerQ, last);
  }

  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

function ToggleButton({
  active,
  onClick,
  title,
  label,
  wholeWord,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  label: string;
  wholeWord?: boolean;
}) {
  const classes = [
    "search-toggle-btn",
    active ? "active" : "",
    wholeWord ? "whole-word" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button onClick={onClick} title={title} className={classes}>
      {label}
    </button>
  );
}
