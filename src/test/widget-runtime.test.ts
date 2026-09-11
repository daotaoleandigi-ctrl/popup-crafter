import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { WIDGET_RUNTIME } from "../lib/widget-runtime";
import { createPopup } from "../lib/defaults";
import { getVoucherProbabilityTotal, pickRandomVoucher } from "../lib/voucher-random";

describe("voucher probability", () => {
  const vouchers = createPopup().vouchers;
  it("calculates a complete 100% allocation", () => {
    expect(getVoucherProbabilityTotal(vouchers)).toBe(100);
  });
  it("selects vouchers at weighted boundaries", () => {
    expect(pickRandomVoucher(vouchers, () => 0)?.id).toBe("v1");
    expect(pickRandomVoucher(vouchers, () => 0.5)?.id).toBe("v2");
    expect(pickRandomVoucher(vouchers, () => 0.8)?.id).toBe("v3");
  });
});
describe("exported widget", () => {
  function boot(mode: "popup" | "embed", partial = {}) {
    const dom = new JSDOM('<!doctype html><body><section id="target"></section></body>', {runScripts: "dangerously", url: "https://example.test"});
    const w = dom.window;
    (w as typeof w & { __coverFillCount?: number }).__coverFillCount = 0;
    w.HTMLCanvasElement.prototype.getContext = () => ({createLinearGradient: () => ({addColorStop() {}}), fillRect() { (w as typeof w & { __coverFillCount?: number }).__coverFillCount!++; }, fillText() {}});
    const config = createPopup({displayMode: mode, autoShowDelay: 0, ...partial});
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
  it("starts from an unscratched reward after a page load", () => {
    const dom = boot("popup");
    try {
      const shadow = dom.window.document.querySelector<HTMLElement>(
        '[id^="scratch-popup-"]',
      )?.shadowRoot;
      expect(shadow?.querySelector<HTMLElement>(".pb-scratch")?.style.display).toBe("");
      expect(shadow?.querySelector<HTMLElement>(".pb-claim")?.style.display).toBe("");
    } finally { dom.window.close(); }
  });
  it("paints an opaque cover before a remote cover image finishes loading", () => {
    const dom = boot("popup", { scratchCoverImage: "https://cdn.example.test/large-cover.webp" });
    try {
      expect((dom.window as typeof dom.window & { __coverFillCount?: number }).__coverFillCount).toBeGreaterThan(0);
    } finally { dom.window.close(); }
  });
  it("keeps the selected random voucher when the popup is reopened", () => {
    const dom = boot("popup", { voucherRandomEnabled: true });
    try {
      const selected = dom.window.ScratchPopup.config.selectedVoucherId;
      dom.window.ScratchPopup.open();
      dom.window.ScratchPopup.open();
      expect(dom.window.ScratchPopup.config.selectedVoucherId).toBe(selected);
      expect(dom.window.sessionStorage.getItem(
        `popup-crafter:voucher:${dom.window.ScratchPopup.config.id}`,
      )).toBe(selected);
    } finally { dom.window.close(); }
  });
});
