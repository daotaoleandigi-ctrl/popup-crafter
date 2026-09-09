import { describe, expect, it } from "vitest";
import { validateImport } from "../lib/import-config";
describe("backup import", () => {
  it("fills missing settings and drops unknown fields", () => {
    const [popup] = validateImport([{ name: "Popup cũ", extra: "untrusted" }]);
    expect(popup.displayMode).toBe("popup");
    expect(popup).not.toHaveProperty("extra");
  });
  it("rejects invalid types before importing any records", () => {
    expect(() =>
      validateImport([{ name: "Good" }, { name: "Bad", maxWidth: "wide" }]),
    ).toThrow();
    expect(() => validateImport({ popups: [] })).toThrow();
  });
});
