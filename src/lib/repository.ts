import type { PopupConfig } from "@/types";
import { cloud, localMode, requireCloud } from "./cloud";
import { loadPopups, savePopups } from "./storage";
import { validateImport } from "./import-config";
import { createPopup } from "./defaults";

const revisions = new Map<string, number>();
export function clearRepository() {
  revisions.clear();
}
function fail(error: { message: string } | null) {
  if (error)
    throw new Error(
      error.message.includes("CONFLICT")
        ? "Popup đã thay đổi ở phiên khác. Hãy sao lưu nội dung rồi tải lại trang."
        : error.message,
    );
}
export async function listPopups(): Promise<PopupConfig[]> {
  if (localMode) return loadPopups();
  const { data, error } = await requireCloud()
    .from("popups")
    .select("id,config,revision")
    .order("updated_at", { ascending: false });
  fail(error);
  return (data || []).map((row) => {
    revisions.set(row.id, row.revision);
    return row.config as PopupConfig;
  });
}
export async function savePopup(popup: PopupConfig) {
  if (localMode) {
    const all = loadPopups();
    const index = all.findIndex((p) => p.id === popup.id);
    if (index < 0) all.unshift(popup);
    else all[index] = popup;
    if (!savePopups(all)) throw new Error("Không thể lưu vào trình duyệt.");
    return;
  }
  const { data, error } = await requireCloud().rpc("save_popup", {
    p_id: popup.id,
    p_config: popup,
    p_revision: revisions.get(popup.id) || 0,
  });
  fail(error);
  revisions.set(popup.id, data);
}
export async function deletePopup(id: string) {
  if (localMode) {
    if (!savePopups(loadPopups().filter((p) => p.id !== id)))
      throw new Error("Không thể xóa.");
    return;
  }
  const { data, error } = await requireCloud()
    .from("popups")
    .delete()
    .eq("id", id)
    .select("id");
  fail(error);
  if (!data?.length)
    throw new Error("Popup không tồn tại hoặc không có quyền xóa.");
  revisions.delete(id);
}
export async function publishPopup(id: string) {
  const { error } = await requireCloud().rpc("publish_popup", {
    p_id: id,
    p_revision: revisions.get(id),
  });
  fail(error);
}
export async function unpublishPopup(id: string) {
  const { error } = await requireCloud().rpc("unpublish_popup", { p_id: id });
  fail(error);
}
export async function isPublished(id: string) {
  if (!cloud) return false;
  const { data, error } = await cloud
    .from("popup_publications")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  fail(error);
  return !!data;
}
export async function uploadImage(file: File): Promise<string> {
  if (
    !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)
  )
    throw new Error("Chọn ảnh PNG, JPG, WebP hoặc GIF.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Ảnh cần nhỏ hơn 5 MB.");
  if (localMode)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Không đọc được ảnh."));
      reader.readAsDataURL(file);
    });
  const client = requireCloud();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  fail(authError);
  if (!user) throw new Error("Vui lòng đăng nhập lại.");
  const ext = file.type.split("/")[1];
  const path = user.id + "/" + crypto.randomUUID() + "." + ext;
  const { error } = await client.storage
    .from("popup-images")
    .upload(path, file, { upsert: false, contentType: file.type });
  fail(error);
  return client.storage.from("popup-images").getPublicUrl(path).data.publicUrl;
}
export async function importLocalPopups() {
  return importPopups(loadPopups());
}
export async function importPopups(value: unknown) {
  const source = validateImport(value);
  for (const old of source) {
    const popup = createPopup({ ...old, id: crypto.randomUUID() });
    for (const key of [
      "bannerImage",
      "scratchCoverImage",
      "rewardImage",
    ] as const) {
      if (popup[key].startsWith("data:image/")) {
        const blob = await (await fetch(popup[key])).blob();
        popup[key] = await uploadImage(
          new File([blob], "import", { type: blob.type }),
        );
      }
    }
    await savePopup(popup);
  }
  return source.length;
}
