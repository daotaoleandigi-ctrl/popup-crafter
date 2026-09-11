import { createClient } from "@supabase/supabase-js";
const defaultProxy = import.meta.env.DEV ? "" : "/api/supabase";
const proxyPath = import.meta.env.VITE_API_URL || defaultProxy;
const proxyUrl =
  proxyPath && typeof window !== "undefined"
    ? new URL(proxyPath, window.location.origin).href.replace(/\/$/, "")
    : "";
const developmentUrl = import.meta.env.DEV
  ? import.meta.env.VITE_SUPABASE_URL || ""
  : "";
const developmentKey = import.meta.env.DEV
  ? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ""
  : "";
export const cloudUrl = proxyUrl || developmentUrl;
export const cloudKey = proxyUrl
  ? "popup-crafter-browser"
  : developmentKey;
export const cloud =
  cloudUrl && cloudKey ? createClient(cloudUrl, cloudKey) : null;
export const localMode = !cloud && import.meta.env.DEV;
export function requireCloud() {
  if (!cloud) throw new Error("Chưa cấu hình dịch vụ lưu trữ.");
  return cloud;
}
