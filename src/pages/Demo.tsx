import { useEffect, useRef, useState } from "react";
import { ArrowLeft, RotateCcw, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import type { PopupConfig } from "@/types";
import { listPopups } from "@/lib/repository";
import { toast } from "sonner";
import { WIDGET_RUNTIME } from "@/lib/widget-runtime";

export default function Demo() {
  const inlineRef = useRef<HTMLDivElement>(null);
  const [popups, setPopups] = useState<PopupConfig[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [mountKey, setMountKey] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    listPopups()
      .then((list) => {
        setPopups(list);
        if (list.length) setSelectedId(list[0].id);
      })
      .catch((e) => toast.error(e.message));
  }, []);

  const selected = popups.find((p) => p.id === selectedId) || null;

  // Popup mode: mount overlay popup on trigger
  useEffect(() => {
    if (!open || !selected) return;
    if (!inlineRef.current) return;
    const frame = document.createElement("iframe");
    frame.title = "Demo popup cách ly";
    frame.setAttribute("sandbox", "allow-scripts allow-forms");
    frame.style.cssText = "width:100%;height:650px;border:0";
    const b64 = btoa(
      unescape(
        encodeURIComponent(JSON.stringify({ ...selected, autoShowDelay: 0 })),
      ),
    );
    frame.srcdoc =
      '<html><body style="margin:0"><script data-config="' +
      b64 +
      '">' +
      WIDGET_RUNTIME +
      "</script></body></html>";
    inlineRef.current.append(frame);
    const cleanup = () => frame.remove();
    return () => {
      cleanup();
      setOpen(false);
    };
  }, [selected, mountKey, open]);

  const trigger = () => {
    setOpen(false);
    requestAnimationFrame(() => {
      setMountKey((k) => k + 1);
      setOpen(true);
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <Link
          to="/"
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Link>
        <h1 className="text-base font-bold">Demo Popup Nhúng Live</h1>
        <span className="text-xs text-muted-foreground">
          Mô phỏng website khác — render đúng như mã nhúng thật
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-lg border border-input bg-card px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          >
            {popups.length === 0 && <option value="">Chưa có popup nào</option>}
            {popups.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div ref={inlineRef} />
        {popups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-sm font-semibold text-foreground">
              Chưa có popup nào được lưu
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Quay lại trang chính, bấm "+ Tạo Popup Mới", thiết kế rồi lưu lại
              để xem demo tại đây.
            </p>
            <Link
              to="/"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              <RotateCcw className="h-4 w-4" /> Về trang tạo popup
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={trigger}
              disabled={!selected}
              className="gradient-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-40"
            >
              <Gift className="h-4 w-4" /> Mở popup
            </button>
            <p className="text-xs text-muted-foreground">
              Bấm nút trên để xem popup overlay — đúng như mã nhúng thật
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
