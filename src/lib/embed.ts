import { cloudUrl, cloudKey } from "./cloud";
import { WIDGET_RUNTIME } from "./widget-runtime";
import type { PopupConfig } from "@/types";
export function getEmbedCode(popup: PopupConfig) {
  if (!cloudUrl || !cloudKey)
    return (
      '<script class="popup-widget" data-config="' +
      btoa(unescape(encodeURIComponent(JSON.stringify(popup)))) +
      '">' +
      WIDGET_RUNTIME +
      "</script>"
    );
  const base = import.meta.env.VITE_APP_URL || window.location.origin;
  const source = new URL("/embed-loader.js", base);
  source.searchParams.set("project", cloudUrl);
  source.searchParams.set("key", cloudKey);
  source.searchParams.set("id", popup.id);
  return (
    '<script async src="' +
    source.href.replace(/&/g, "&amp;").replace(/"/g, "&quot;") +
    '"></script>'
  );
}
