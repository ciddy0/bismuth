import { useState, useCallback } from "react";
import { pageService, PageWithChildren } from "../services/pageService";

/**
 * custom React hook for managing hierarchical page data and expansion state
 *
 * TODO: add renamePage support
 * TODO: add deletePage with cascading children removal
 * TODO: cache loaded children to avoid full tree reloads
 * TODO: add drag-and-drop reordering
 */

export function usePages() {
  const [pages, setPages] = useState<PageWithChildren[]>([]);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());

  const loadChildPages = useCallback(
    async (parentId: string): Promise<PageWithChildren[]> => {
      try {
        const children = await pageService.getChildPages(parentId);
        return Promise.all(
          children.map(async (child) => ({
            ...child,
            children: await loadChildPages(child.id),
            isExpanded: expandedPages.has(child.id),
          })),
        );
      } catch (error) {
        console.error("failed to load child pages:", error);
        return [];
      }
    },
    [expandedPages],
  );

  const loadPages = useCallback(async () => {
    try {
      const rootPages = await pageService.getRootPages();
      const pagesWithChildren = await Promise.all(
        rootPages.map(async (page) => ({
          ...page,
          children: await loadChildPages(page.id),
          isExpanded: expandedPages.has(page.id),
        })),
      );
      setPages(pagesWithChildren);
    } catch (error) {
      console.error("Failed to load pages:", error);
    }
  }, [expandedPages, loadChildPages]);

  const createPage = useCallback(
    async (title: string) => {
      if (!title.trim()) return null;
      try {
        const page = await pageService.createPage(title);
        await loadPages();
        return page;
      } catch (error) {
        console.error("Failed to create page:", error);
        return null;
      }
    },
    [loadPages],
  );

  const toggleExpansion = useCallback((pageId: string) => {
    setExpandedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  }, []);

  return {
    pages,
    expandedPages,
    loadPages,
    createPage,
    toggleExpansion,
    setExpandedPages,
  };
}
