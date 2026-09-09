import { createClient } from "@supabase/supabase-js";
export const cloudUrl = import.meta.env.VITE_SUPABASE_URL || "";
export const cloudKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
export const cloud =
  cloudUrl && cloudKey ? createClient(cloudUrl, cloudKey) : null;
export const localMode = !cloud && import.meta.env.DEV;
export function requireCloud() {
  if (!cloud) throw new Error("Chưa cấu hình dịch vụ lưu trữ.");
  return cloud;
}
