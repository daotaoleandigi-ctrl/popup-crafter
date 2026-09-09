import { useEffect, useState } from "react";
import { cloud } from "@/lib/cloud";
import { isPublished, publishPopup, unpublishPopup } from "@/lib/repository";
import { toast } from "sonner";
export default function PublicationControls({
  id,
  onPublish,
}: {
  id: string;
  onPublish?: () => Promise<boolean>;
}) {
  const [published, setPublished] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (cloud)
      isPublished(id)
        .then(setPublished)
        .catch((e) => toast.error(e.message));
  }, [id]);
  if (!cloud) return null;
  async function run(remove: boolean) {
    setBusy(true);
    try {
      if (remove) {
        await unpublishPopup(id);
        setPublished(false);
        toast.success(
          "Đã ngừng xuất bản. Những lần tải trang tiếp theo sẽ không hiển thị popup.",
        );
      } else {
        if (onPublish && !(await onPublish())) return;
        await publishPopup(id);
        setPublished(true);
        toast.success("Đã xuất bản. Website nhận bản mới khi tải lại trang.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể xuất bản.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span>{published ? "Có bản đang xuất bản" : "Chỉ có bản nháp"}</span>
      <button
        disabled={busy}
        className="rounded-lg bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50"
        onClick={() => run(false)}
      >
        {busy ? "Đang xử lý…" : published ? "Xuất bản cập nhật" : "Xuất bản"}
      </button>
      {published && (
        <button
          disabled={busy}
          className="rounded-lg border px-3 py-2"
          onClick={() => run(true)}
        >
          Ngừng xuất bản
        </button>
      )}
    </div>
  );
}
