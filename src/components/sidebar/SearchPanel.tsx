// components/sidebar/SearchPanel.tsx
import { useState, useEffect, useRef } from "react";
import type { SearchResponse } from "../../types/SearchResponse";
import type { SearchFileGroup } from "../../types/SearchFileGroup";
import { searchService } from "../../services/searchService";
import toRightIcon from "../../assets/to-right.png";
import toDownIcon from "../../assets/to-down.png";
import pageIcon from "../../assets/page.png";
import { cn } from "../../utils/cn";

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
    <div className="flex flex-col h-full text-[#ccc] text-[13px]">
      {externalQuery === undefined && (
        <div className="p-2">
          <div className="flex items-center bg-[#2a2a2a] border border-[#444] rounded overflow-hidden">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="flex-1 bg-transparent border-0 text-[#eee] px-2 py-[5px] text-[13px] outline-none rounded-none p-0"
            />
            <div className="flex items-center pr-1 gap-0.5">
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
        <div className="px-3 py-1 text-[11px] text-[#888]">
          {matchCount} result{matchCount !== 1 ? "s" : ""} in {fileCount} file
          {fileCount !== 1 ? "s" : ""}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
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
          <div className="p-4 text-center text-[#666] italic">No results found.</div>
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
      <div
        className="flex items-center px-2 py-1 cursor-pointer gap-1 font-medium hover:bg-[#2a2a2a]"
        onClick={onToggle}
      >
        <img
          src={isCollapsed ? toRightIcon : toDownIcon}
          alt={isCollapsed ? "Expand" : "Collapse"}
          className="w-2.5 h-2.5 opacity-70 shrink-0"
        />
        <img
          src={pageIcon}
          alt="Page"
          className="w-3.5 h-3.5 opacity-85 shrink-0"
        />
        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[#ddd]">
          {group.page_title}
        </span>
        <span className="bg-[#444] rounded-full px-1.5 text-[11px] text-[#aaa] min-w-[18px] text-center">
          {group.matches.length}
        </span>
      </div>

      {!isCollapsed && (
        <div>
          {group.matches.map((match, i) => (
            <div
              key={`${match.block_id}-${match.match_start}-${i}`}
              className="flex items-center py-0.5 px-2 pl-7 cursor-pointer text-xs leading-[18px] hover:bg-[#2a2a2a]"
              onClick={() => {
                const blockId = match.block_id.startsWith("title-")
                  ? undefined
                  : match.block_id;
                onNavigate(group.page_id, blockId);
              }}
            >
              <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[#bbb]">
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
      <span key={idx} className="bg-[#6b5300] text-[#ffd700] rounded-[2px] px-px">
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
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "border-0 rounded-[3px] px-[5px] py-0.5 text-xs cursor-pointer font-semibold bg-transparent text-[#888]",
        active && "bg-[#4a4a4a] text-white",
        wholeWord && "border-b-2 border-b-transparent",
        wholeWord && active && "border-b-white"
      )}
    >
      {label}
    </button>
  );
}
