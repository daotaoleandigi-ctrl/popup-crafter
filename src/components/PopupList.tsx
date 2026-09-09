import { useEffect, useRef, useState } from "react";
import {
  Code2,
  Plus,
  Trash2,
  Pencil,
  Gift,
  Play,
  Copy,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import type { PopupConfig } from "@/types";
import {
  listPopups,
  savePopup,
  deletePopup,
  importLocalPopups,
  importPopups,
} from "@/lib/repository";
import { cloud } from "@/lib/cloud";
import { createPopup } from "@/lib/defaults";
import EmbedDialog from "@/components/EmbedDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PopupListProps {
  onEdit: (popup: PopupConfig) => void;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function PopupList({ onEdit }: PopupListProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [popups, setPopups] = useState<PopupConfig[]>([]);
  const [embedPopup, setEmbedPopup] = useState<PopupConfig | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const refresh = async () => {
    setLoadError("");
    try {
      setPopups(await listPopups());
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Không tải được dữ liệu.");
    }
  };
  useEffect(() => {
    void refresh();
  }, []);
  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    try {
      await work();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Thao tác thất bại.");
    } finally {
      setBusy(false);
    }
  };
  const handleCreate = () =>
    run(async () => {
      const p = createPopup({ id: crypto.randomUUID() });
      await savePopup(p);
      onEdit(p);
    });
  const confirmDelete = () =>
    run(async () => {
      if (!deleteId) return;
      await deletePopup(deleteId);
      setDeleteId(null);
      await refresh();
    });
  const handleRename = (id: string, name: string) =>
    run(async () => {
      const p = popups.find((p) => p.id === id);
      if (p && p.name !== name) {
        await savePopup({ ...p, name, updatedAt: Date.now() });
        await refresh();
      }
    });

  const filtered = popups.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  );
  const duplicate = (p: PopupConfig) =>
    run(async () => {
      const fresh = createPopup();
      await savePopup({
        ...p,
        id: crypto.randomUUID(),
        name: p.name + " — bản sao",
        createdAt: fresh.createdAt,
        updatedAt: fresh.updatedAt,
      });
      await refresh();
    });
  const backup = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(popups, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "popup-crafter-backup.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/40">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-4 items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="gradient-primary flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground shadow-md">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold leading-tight">
                Popup Crafter
              </h1>
              <p className="text-xs text-muted-foreground">
                Tạo popup cào quà 2 cột & xuất mã nhúng
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/demo"
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted"
            >
              <Play className="h-4 w-4" /> Demo live
            </Link>
            <button
              disabled={busy}
              onClick={handleCreate}
              className="gradient-primary flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Tạo Popup Mới
            </button>
          </div>
        </div>
      </header>

      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          void run(async () => {
            if (file.size > 20 * 1024 * 1024)
              throw new Error("File cần nhỏ hơn 20 MB.");
            const count = await importPopups(JSON.parse(await file.text()));
            toast.success("Đã nhập " + count + " popup mới.");
            await refresh();
          });
        }}
      />
      <fieldset disabled={busy} className="min-w-0 disabled:opacity-60">
        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
          {loadError && (
            <p role="alert" className="mb-4 rounded-lg bg-destructive/10 p-4">
              {loadError} <button onClick={refresh}>Thử lại</button>
            </p>
          )}
          {cloud && (
            <button
              className="mb-4 rounded-lg border px-3 py-2 text-sm"
              onClick={() =>
                run(async () => {
                  const count = await importLocalPopups();
                  toast.success(
                    "Đã nhập " + count + " popup từ máy này vào tài khoản.",
                  );
                  await refresh();
                })
              }
            >
              Nhập popup cũ từ trình duyệt
            </button>
          )}
          <section className="mb-8 grid gap-6 rounded-3xl border border-border bg-card p-6 sm:p-8 md:grid-cols-[1fr_240px]">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
                Xưởng popup cào quà
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Một lần cào.
                <br />
                Một cơ hội kết nối.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
                Thiết kế thẻ quà, gắn form nhận ưu đãi và đưa lên website của
                bạn.
              </p>
            </div>
            <div className="flex flex-col justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-secondary p-6 text-center">
              <Gift className="mx-auto mb-3 h-8 w-8 text-primary" />
              <strong className="text-lg">Cào → Nhận quà</strong>
              <span className="mt-2 text-xs text-muted-foreground">
                {popups.length} popup trong thư viện
              </span>
            </div>
          </section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <button
              className="rounded-xl border bg-card px-4 py-2 text-sm"
              onClick={() => fileInput.current?.click()}
            >
              Nhập bản sao JSON
            </button>
            <input
              aria-label="Tìm popup"
              placeholder="Tìm theo tên popup…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="rounded-xl border border-input bg-card px-4 py-2 text-sm focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={backup}
              disabled={!popups.length}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              Sao lưu JSON
            </button>
          </div>
          {popups.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-card/50 py-24 text-center">
              <div className="gradient-accent mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-primary-foreground shadow-lg">
                <Gift className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold">Chưa có popup nào</h2>
              <p className="mb-6 mt-1 max-w-sm text-sm text-muted-foreground">
                Bắt đầu tạo popup cào quà 2 cột đầu tiên. Tùy chỉnh trực quan,
                dán mã form và xuất mã nhúng JavaScript.
              </p>
              <button
                onClick={handleCreate}
                className="gradient-primary flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md"
              >
                <Plus className="h-4 w-4" /> Tạo Popup Mới
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
              <table className="block w-full sm:table">
                <thead className="hidden sm:table-header-group bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Tên Popup</th>
                    <th className="px-5 py-3">Ngày tạo</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="block sm:table-row-group divide-y divide-border">
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="group block sm:table-row transition hover:bg-muted/30"
                    >
                      <td className="block sm:table-cell px-4 py-3 sm:px-5 sm:py-4">
                        <input
                          key={p.name}
                          aria-label="Tên popup"
                          defaultValue={p.name}
                          onBlur={(e) => handleRename(p.id, e.target.value)}
                          className="w-full max-w-xs rounded bg-transparent px-1.5 py-1 font-semibold outline-none hover:bg-muted/60 focus:bg-muted focus:ring-2 focus:ring-primary/40"
                        />
                      </td>
                      <td className="block sm:table-cell px-4 pb-1 sm:px-5 sm:py-4 text-sm text-muted-foreground">
                        <span className="sm:hidden">Ngày tạo: </span>{formatDate(p.createdAt)}
                      </td>
                      <td className="block sm:table-cell px-4 py-3 sm:px-5 sm:py-4">
                        <div className="flex flex-wrap justify-start sm:justify-end gap-2 [&>button]:min-h-10 sm:[&>button]:min-h-0">
                          <button
                            onClick={() => duplicate(p)}
                            aria-label="Nhân bản popup"
                            title="Nhân bản"
                            className="rounded-lg border border-border px-2.5 py-1.5 hover:text-primary"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onEdit(p)}
                            className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition hover:border-primary hover:text-primary"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Sửa
                          </button>
                          <button
                            onClick={() => setEmbedPopup(p)}
                            className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition hover:border-primary hover:text-primary"
                          >
                            <Code2 className="h-3.5 w-3.5" /> Lấy mã nhúng
                          </button>
                          <button
                            onClick={() => setDeleteId(p.id)}
                            className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-destructive transition hover:border-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="p-8 text-center text-muted-foreground"
                      >
                        Không tìm thấy popup. Thử tên khác.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </fieldset>

      <EmbedDialog
        open={!!embedPopup}
        popup={embedPopup}
        onClose={() => setEmbedPopup(null)}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa popup này?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động không thể hoàn tác. Popup sẽ bị xóa vĩnh viễn khỏi danh
              sách.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
