import { createPopup } from "./defaults";
import type { PopupConfig } from "@/types";

const KEY = "popup_builder_store_v1";

export function loadPopups(): PopupConfig[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is Partial<PopupConfig> & {id: string; name: string} => p !== null && typeof p === "object" && typeof p.id === "string" && typeof p.name === "string").map(p => createPopup({...p, displayMode: p.displayMode === "embed" ? "embed" : "popup"}));
  } catch {
    return [];
  }
}

export function savePopups(popups: PopupConfig[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(popups));
    return true;
  } catch {
    return false;
  }
}
