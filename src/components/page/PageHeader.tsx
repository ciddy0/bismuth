import { open } from "@tauri-apps/plugin-dialog";
import { pageService } from "../../services/pageService";
import { getAssetUrl } from "../../utils/helpers";
import type { Page } from "../../types/Page";

/**
 * displays and manages the page cover image.
 *
 * TODO: replace emoji button with icon component
 * TODO: add loading indicator during upload
 * TODO: add remove/clear cover button
 * TODO: support drag-and-drop upload
 * TODO: allow repositioning / zooming of cover
 */


interface PageHeaderProps {
  page: Page;
  onUpdate: () => void;
}

export function PageHeader({ page, onUpdate }: PageHeaderProps) {
  const handleImageUpload = async (pageId: string, type: string) => {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] }],
    });

    if (selected) {
      try {
        console.log("selected img", selected);
        await pageService.uploadPageAsset(pageId, selected, type);
        console.log("Uploaded successfully");
        onUpdate();
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }
  };

  return (
    <div
      className="group h-[200px] w-full p-4 bg-[#222] bg-cover bg-center"
      style={{
        backgroundImage: page.cover ? `url(${getAssetUrl(page.cover)})` : "none",
      }}
      title={`${page.cover}`}
    >
      {/* TO-DO: replace this fuckass emoji with something else */}
      <button
        onClick={() => handleImageUpload(page.id, "cover")}
        title="Upload Cover"
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      >
        🖼️
      </button>
    </div>
  );
}