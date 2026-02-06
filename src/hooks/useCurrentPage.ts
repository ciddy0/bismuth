import { useState, useEffect } from "react";
import type { Page } from "../types/Page";

/**
 * custom React hook for tracking the currently selected page.
 * 
 * TODO: persist currentPage to local storage for session restore
 * TODO: add page history (back/forward navigation)
 */


export function useCurrentPage(onPageChange?: (page: Page | null) => void) {
  const [currentPage, setCurrentPage] = useState<Page | null>(null);

  useEffect(() => {
    if (onPageChange) {
      onPageChange(currentPage);
    }
  }, [currentPage, onPageChange]);

  return {
    currentPage,
    setCurrentPage,
  };
}
