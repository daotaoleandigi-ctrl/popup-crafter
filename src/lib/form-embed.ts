export interface FormPreviewSource {
  src?: string;
  srcDoc?: string;
}

export function getFormPreviewSource(embedCode: string): FormPreviewSource {
  if (!embedCode.trim()) return {};

  const document = new DOMParser().parseFromString(embedCode, "text/html");
  const iframeUrl = document.querySelector("iframe")?.getAttribute("src")?.trim();

  if (iframeUrl) {
    try {
      const parsed = new URL(iframeUrl, window.location.href);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        return { src: parsed.href };
      }
    } catch {
      // The complete snippet remains available as a fallback below.
    }
  }

  return { srcDoc: embedCode };
}
