import { invoke } from "@tauri-apps/api/core";
import type { Page } from "../types/Page";

export interface PageWithChildren extends Page {
  children?: PageWithChildren[];
  isExpanded?: boolean;
}

export const pageService = {
  async getRootPages(): Promise<Page[]> {
    return await invoke<Page[]>("get_root_pages");
  },

  async getChildPages(parentId: string): Promise<Page[]> {
    return await invoke<Page[]>("get_child_pages", { parentId });
  },

  async getPage(pageId: string): Promise<Page> {
    return await invoke<Page>("get_page", { pageId });
  },

  async createPage(title: string): Promise<Page> {
    return await invoke<Page>("create_page", { title });
  },

  async createNestedPage(title: string, parentId: string): Promise<Page> {
    return await invoke<Page>("create_nested_page", { title, parentId });
  },

  async uploadPageAsset(
    pageId: string,
    sourcePath: string,
    assetType: string,
  ): Promise<string> {
    return await invoke<string>("upload_page_asset", {
      pageId,
      sourcePath,
      assetType,
    });
  },
};
