import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { WIDGET_RUNTIME } from "../lib/widget-runtime";
import { createPopup } from "../lib/defaults";
describe("exported widget", () => {
  function boot(mode: "popup" | "embed") {
    const dom = new JSDOM('<!doctype html><body><section id="target"></section></body>', {runScripts: "dangerously", url: "https://example.test"});
    const w = dom.window;
    w.HTMLCanvasElement.prototype.getContext = () => ({createLinearGradient: () => ({addColorStop() {}}), fillRect() {}, fillText() {}});
    const script = w.document.createElement("script");
    script.dataset.config = Buffer.from(JSON.stringify(createPopup({displayMode: mode, autoShowDelay: 0}))).toString("base64");
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
});
