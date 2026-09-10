import { WIDGET_RUNTIME } from "./widget-runtime";
import type { PopupConfig } from "@/types";
export function getEmbedCode(popup: PopupConfig) {
  if (!import.meta.env.VITE_APP_URL && import.meta.env.DEV)
    return (
      '<script class="popup-widget" data-config="' +
      btoa(unescape(encodeURIComponent(JSON.stringify(popup)))) +
      '">' +
      WIDGET_RUNTIME +
      "</script>"
    );
  const base =
    import.meta.env.VITE_APP_URL ||
    new URL(import.meta.env.BASE_URL, window.location.origin).href;
  const source = new URL("embed-loader.js", base.endsWith("/") ? base : `${base}/`);
  source.searchParams.set("id", popup.id);
  source.searchParams.set("v", "3");
  return (
    '<script async src="' +
    source.href.replace(/&/g, "&amp;").replace(/"/g, "&quot;") +
    '"></script>'
  );
}
