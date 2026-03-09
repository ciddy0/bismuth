import { invoke } from "@tauri-apps/api/core";
import type { SearchResponse } from "../types/SearchResponse";

export const searchService = {
  async searchBlocks(
    query: string,
    caseSensitive: boolean,
    wholeWord: boolean,
  ): Promise<SearchResponse> {
    return await invoke<SearchResponse>("search_blocks", {
      query,
      caseSensitive,
      wholeWord,
    });
  },
};
