import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { WIDGET_RUNTIME } from "../lib/widget-runtime";
import { createPopup } from "../lib/defaults";
describe("exported widget", () => {
  function boot(mode: "popup" | "embed", scratched = false) {
    const dom = new JSDOM('<!doctype html><body><section id="target"></section></body>', {runScripts: "dangerously", url: "https://example.test"});
    const w = dom.window;
    w.HTMLCanvasElement.prototype.getContext = () => ({createLinearGradient: () => ({addColorStop() {}}), fillRect() {}, fillText() {}});
    const config = createPopup({displayMode: mode, autoShowDelay: 0});
    if (scratched) {
      w.sessionStorage.setItem(`popup-crafter-scratched:${config.id}`, "1");
    }
    const script = w.document.createElement("script");
    script.dataset.config = Buffer.from(JSON.stringify(config)).toString("base64");
    script.textContent = WIDGET_RUNTIME;
    w.document.querySelector("#target")!.append(script);
    w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
    return dom;
  }
  it("renders inline inside the embedding container without an overlay close button", () => {
    const dom = boot("embed");
    try {
      const host = dom.window.document.querySelector("#target > div");
      expect(host?.shadowRoot?.querySelector(".pb-root")).toBeTruthy();
      expect(host?.shadowRoot?.querySelector(".pb-close")).toBeNull();
      expect(dom.window.document.querySelector('[id^="scratch-popup-"]')).toBeNull();
    } finally { dom.window.close(); }
  });
  it("keeps only one overlay when opened repeatedly", () => {
    const dom = boot("popup");
    try {
      dom.window.ScratchPopup.open(); dom.window.ScratchPopup.open();
      expect(dom.window.document.querySelectorAll('[id^="scratch-popup-"]')).toHaveLength(1);
    } finally { dom.window.close(); }
  });
  it("restores the revealed reward during the same browser session", () => {
    const dom = boot("popup", true);
    try {
      const shadow = dom.window.document.querySelector<HTMLElement>(
        '[id^="scratch-popup-"]',
      )?.shadowRoot;
      expect(shadow?.querySelector<HTMLElement>(".pb-scratch")?.style.display).toBe(
        "none",
      );
      expect(shadow?.querySelector<HTMLElement>(".pb-claim")?.style.display).toBe(
        "flex",
      );
    } finally { dom.window.close(); }
  });
});
