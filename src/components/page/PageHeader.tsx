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
      className="page-cover"
      style={{
        height: "200px",
        width: "100%",
        padding: "16px",
        backgroundColor: "#222",
        backgroundImage: page.cover ? `url(${getAssetUrl(page.cover)})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      title={`${page.cover}`}
    >
      {/* TO-DO: replace this fuckass emoji with something else */}
      <button
        onClick={() => handleImageUpload(page.id, "cover")}
        title="Upload Cover"
        className="upload-cover-button"
      >
        🖼️
      </button>
    </div>
  );
}