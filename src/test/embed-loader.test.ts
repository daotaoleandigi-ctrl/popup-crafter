// @vitest-environment node
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";

describe("cloud embed loader", () => {
  async function load(config: unknown, ok = true) {
    const dom = new JSDOM(
      '<body><section id="target"><script id="loader"></script></section></body>',
      { url: "https://customer.test", runScripts: "dangerously" },
    );
    const script =
      dom.window.document.querySelector<HTMLScriptElement>("#loader")!;
    script.src =
      "https://crafter.test/embed-loader.js?id=test-popup-1";
    Object.defineProperty(dom.window.document, "currentScript", {
      value: script,
      configurable: true,
    });
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok, json: async () => config })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          claimId: "11111111-1111-4111-8111-111111111111",
          voucherId: "v2",
          rewardText: "Voucher 100k",
          code: "SALE100",
        }),
      });
    dom.window.fetch = fetcher;
    dom.window.eval(
      readFileSync(
        new URL("../../public/embed-loader.js", import.meta.url),
        "utf8",
      ),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    return { dom, fetcher };
  }
  it("fetches a published ID and loads the runtime next to the embedding script", async () => {
    const { dom, fetcher } = await load({
      id: "test-popup-1",
      name: "Quà 🎁",
      displayMode: "embed",
    });
    try {
      expect(fetcher).toHaveBeenCalledWith(
        "https://crafter.test/api/public/popups/test-popup-1",
        expect.objectContaining({
          method: "GET",
          cache: "no-store",
        }),
      );
      const script = dom.window.document.querySelector<HTMLScriptElement>(
        "script[data-config]",
      )!;
      expect(script.parentElement?.id).toBe("target");
      expect(script.src).toBe("https://crafter.test/widget-runtime.js");
      const loaded = JSON.parse(Buffer.from(script.dataset.config!, "base64").toString("utf8"));
      expect(loaded.name).toBe("Quà 🎁");
      expect(loaded.serverClaimId).toBe("11111111-1111-4111-8111-111111111111");
      expect(loaded.rewardText).toBe("Voucher 100k");
    } finally {
      dom.window.close();
    }
  });
  it("does not display drafts or unpublished popups", async () => {
    const { dom } = await load(null);
    try {
      expect(
        dom.window.document.querySelector("script[data-config]"),
      ).toBeNull();
      expect(dom.window.document.querySelector("span")).toBeNull();
    } finally {
      dom.window.close();
    }
  });
});
