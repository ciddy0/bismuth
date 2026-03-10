import type { Block } from "../../types/Block";
import type { Page } from "../../types/Page";
import linkIcon from "../../assets/link.png";
import pageIcon from "/page.png";

/**
 * renders a block based on its block_type.
 *
 * TODO: refactor switch into a map of renderers by block type
 * TODO: add inline editing per block
 * TODO: add hover states and keyboard navigation
 * TODO: add copy / duplicate block actions
 */

interface BlockRendererProps {
  block: Block;
  onNavigate: (page: Page) => void;
}

export function BlockRenderer({ block, onNavigate }: BlockRendererProps) {
  const blockType = block.block_type.type;
  {/* TO-DO: Ideally we wannt refractor this once we code the rest of the blocktype cases D: */}
  switch (blockType) {
    case "Heading1":
      return <h1>{block.content}</h1>;
    case "Heading2":
      return <h2>{block.content}</h2>;
    case "Heading3":
      return <h3>{block.content}</h3>;
    case "BulletList":
      return <li>{block.content}</li>;
    case "Quote":
      return <blockquote>{block.content}</blockquote>;
    case "Code":
      return (
        <pre>
          <code>{block.content}</code>
        </pre>
      );
    case "SubPage": {
      if (block.block_type.type === "SubPage") {
        const subPageId = block.block_type.data.page_id;
        return (
          <div
            className="p-3 bg-[#F09BDC20] text-white cursor-pointer flex items-center gap-2 hover:underline"
            onClick={async () => {
              try {
                const { pageService } =
                  await import("../../services/pageService");
                const page = await pageService.getPage(subPageId);
                onNavigate(page);
              } catch (error) {
                console.error("Failed to load page:", error);
              }
            }}
          >
            <img src={pageIcon} alt="Sub page" className="w-[18px] h-[18px]" />
            {block.content}
          </div>
        );
      }
      break;
    }
    case "PageLink": {
      if (block.block_type.type === "PageLink") {
        const pageLinkId = block.block_type.data.page_id;
        return (
          <div
            className="p-2 bg-[#e8f4ff] cursor-pointer border border-[#b3d9ff] inline-flex items-center gap-1"
            onClick={async () => {
              try {
                const { pageService } =
                  await import("../../services/pageService");
                const page = await pageService.getPage(pageLinkId);
                onNavigate(page);
              } catch (error) {
                console.error("Failed to load page:", error);
              }
            }}
          >
            <img src={linkIcon} alt="Page link" className="w-4 h-4" />
            {block.content}
          </div>
        );
      }
      break;
    }
    default:
      return <p>{block.content}</p>;
  }
}
