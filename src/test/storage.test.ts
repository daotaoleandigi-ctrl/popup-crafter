import { afterEach, describe, expect, it, vi } from "vitest";
import { loadPopups, savePopups } from "../lib/storage";
import { createPopup } from "../lib/defaults";
describe("popup persistence", () => {
  afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
  it("round trips Vietnamese content and embed mode", () => {
    const popup = createPopup({ name: "Quà tặng 🎁", displayMode: "embed" });
    expect(savePopups([popup])).toBe(true);
    expect(loadPopups()).toEqual([popup]);
  });
  it("migrates legacy entries and skips malformed entries", () => {
    localStorage.setItem("popup_builder_store_v1", JSON.stringify([null, 4, {}, { id: "old", name: "Cũ" }]));
    const result = loadPopups();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "old", displayMode: "popup", rewardSubtitle: "Bạn đã trúng" });
  });
  it("reports a failed write without overwriting existing data", () => {
    const popup = createPopup(); savePopups([popup]);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Full", "QuotaExceededError"); });
    expect(savePopups([])).toBe(false);
    expect(loadPopups()).toEqual([popup]);
  });
});
