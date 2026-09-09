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
      "https://crafter.test/embed-loader.js?project=https%3A%2F%2Fdatabase.test&key=public-key&id=test-popup-1";
    Object.defineProperty(dom.window.document, "currentScript", {
      value: script,
      configurable: true,
    });
    const fetcher = vi.fn().mockResolvedValue({ ok, json: async () => config });
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
        "https://database.test/rest/v1/rpc/get_published_popup",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ p_id: "test-popup-1" }),
          cache: "no-store",
        }),
      );
      const script = dom.window.document.querySelector<HTMLScriptElement>(
        "script[data-config]",
      )!;
      expect(script.parentElement?.id).toBe("target");
      expect(script.src).toBe("https://crafter.test/widget-runtime.js");
      expect(
        JSON.parse(
          Buffer.from(script.dataset.config!, "base64").toString("utf8"),
        ).name,
      ).toBe("Quà 🎁");
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
