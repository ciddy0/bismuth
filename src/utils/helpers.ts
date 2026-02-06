import { convertFileSrc } from "@tauri-apps/api/core";

/*
* helper functions 
*/

export function getAssetUrl(filename: string | null | undefined): string | null {
    if (!filename) return null;
    const assetPath = `page_assets/${filename}`;
    return convertFileSrc(assetPath);
}

export function buildPageTree<T extends { id: string; children?: T[] }>(
    pages: T[],
    expandedPages: Set<string>
): T[] {
    return pages.map((page) => ({
        ...page,
        isExpanded: expandedPages.has(page.id),
    }));
}
