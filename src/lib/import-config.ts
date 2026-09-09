import { createPopup } from "./defaults";
import type { PopupConfig } from "@/types";

export function validateImport(value: unknown): PopupConfig[] {
  if (!Array.isArray(value) || value.length > 100)
    throw new Error("Chọn bản sao JSON chứa tối đa 100 popup.");
  const defaults = createPopup();
  return value.map((item, index) => {
    if (!item || typeof item !== "object" || typeof item.name !== "string")
      throw new Error(`Popup ${index + 1} không hợp lệ.`);
    const fields: Record<string, string | number | boolean> = {};
    for (const [key, fallback] of Object.entries(defaults)) {
      const current = item[key] ?? fallback;
      if (
        typeof current !== typeof fallback ||
        (typeof current === "number" && !Number.isFinite(current))
      )
        throw new Error(`Trường ${key} của popup ${index + 1} không hợp lệ.`);
      fields[key] = current;
    }
    if (!["popup", "embed"].includes(String(fields.displayMode)))
      throw new Error("Chế độ hiển thị không hợp lệ.");
    return createPopup(fields as Partial<PopupConfig>);
  });
}
