import { useEffect, useRef, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import type { PopupConfig } from "@/types";
import { getEmbedCode } from "@/lib/embed";
import PublicationControls from "./PublicationControls";

interface EmbedDialogProps {
  open: boolean;
  popup: PopupConfig | null;
  onClose: () => void;
}

export default function EmbedDialog({
  open,
  popup,
  onClose,
}: EmbedDialogProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [manual, setManual] = useState<string | null>(null);
  const manualRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCopied(null);
    setManual(null);
  }, [popup?.id, open]);

  useEffect(() => {
    if (manual && manualRef.current) {
      manualRef.current.focus();
      manualRef.current.select();
    }
  }, [manual]);

  if (!open || !popup) return null;

  const embed = getEmbedCode(popup);
  const appBase = (import.meta.env.VITE_APP_URL || window.location.origin).replace(/\/$/, "");
  const ghlBridge = `<script src="${appBase}/ghl-voucher-bridge.js"
  data-claim-field="THAY_BANG_ID_TRUONG_CLAIM"
  data-voucher-field="THAY_BANG_ID_TRUONG_TEN_VOUCHER"
  data-code-field="THAY_BANG_ID_TRUONG_MA_VOUCHER"
  data-campaign-field="THAY_BANG_ID_TRUONG_CHIEN_DICH"></script>`;

  // Suggested trigger button the user can paste alongside the script.
  const triggerBtn = `<button class="scratch-popup-trigger">Cào quà ngay</button>`;

  const copy = async (text: string, key: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 1800);
        return;
      }
    } catch {
      /* fall through */
    }
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (ok) {
        setCopied(key);
        setTimeout(() => setCopied(null), 1800);
        return;
      }
    } catch {
      /* fall through */
    }
    setManual(text);
  };

  const CodeBlock = ({
    label,
    code,
    copyKey,
    note,
  }: {
    label: string;
    code: string;
    copyKey: string;
    note?: string;
  }) => (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-foreground">{label}</p>
      <div className="relative">
        <pre className="max-h-48 overflow-auto rounded-xl bg-muted/60 p-4 pr-12 text-[11px] leading-relaxed">
          <code className="break-all whitespace-pre-wrap">{code}</code>
        </pre>
        <button
          onClick={() => copy(code, copyKey)}
          className="absolute right-2 top-2 rounded-lg bg-primary p-2 text-primary-foreground hover:opacity-90"
          title="Sao chép"
        >
          {copied === copyKey ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
      {copied === copyKey && (
        <p className="mt-1 text-xs font-medium text-accent">Đã sao chép!</p>
      )}
      {note && (
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {note}
        </p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Mã nhúng Popup</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {manual && (
          <div className="mb-4 rounded-xl border border-accent bg-accent/10 p-3">
            <p className="mb-2 text-xs font-semibold text-accent">
              Trình duyệt chặn tự động sao chép. Nhấn{" "}
              <kbd className="rounded bg-card px-1.5 py-0.5 font-mono text-[10px] shadow">
                Ctrl
              </kbd>{" "}
              +{" "}
              <kbd className="rounded bg-card px-1.5 py-0.5 font-mono text-[10px] shadow">
                C
              </kbd>{" "}
              để sao chép mã bên dưới:
            </p>
            <textarea
              ref={manualRef}
              readOnly
              value={manual}
              onFocus={(e) => e.target.select()}
              className="h-24 w-full resize-none rounded-lg bg-card p-2 font-mono text-[11px] leading-relaxed outline-none ring-1 ring-accent/40"
            />
            <button
              onClick={() => setManual(null)}
              className="mt-2 rounded-lg border border-border px-3 py-1 text-xs font-medium hover:bg-muted"
            >
              Đóng
            </button>
          </div>
        )}

        <div className="space-y-4">
          <PublicationControls id={popup.id} />
          <CodeBlock
            label="Mã nhúng (dán vào vị trí muốn hiển thị trên website)"
            code={embed}
            copyKey="embed"
            note={
              popup.displayMode === "embed"
                ? "Thẻ cào hiển thị trực tiếp tại vị trí dán mã, không mở lớp phủ."
                : popup.autoShowDelay > 0
                  ? `Popup overlay TỰ ĐỘNG mở khi tải trang sau ${popup.autoShowDelay}s. Có nền mờ + nút đóng. Vẫn mở thêm được bằng nút bấm bên dưới.`
                  : "Popup overlay TỰ ĐỘNG mở ngay khi tải trang. Có nền mờ + nút đóng. Vẫn mở thêm được bằng nút bấm bên dưới."
            }
          />

          <CodeBlock
            label="Mã cầu nối GHL (đặt trong Custom HTML của Form)"
            code={ghlBridge}
            copyKey="ghl-bridge"
            note="Tạo 4 Contact Custom Field trong GHL, thêm chúng vào Form rồi thay bốn ID tương ứng trong mã. Có thể ẩn các trường bằng phần cài đặt giao diện của Form."
          />

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-[11px] leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Webhook xác nhận GHL:</strong>{" "}
            dùng <code className="rounded bg-muted px-1">{appBase}/api/webhooks/ghl</code> trong Workflow “Form Submitted”, phương thức POST. Gửi claim_id, contact_id, email và phone; thêm header <code className="rounded bg-muted px-1">X-Popup-Crafter-Secret</code> bằng secret đã đặt trên Cloudflare.
          </div>

          {popup.displayMode === "popup" && (
            <>
              <CodeBlock
                label="Nút mở popup thủ công (tùy chọn, đặt bất kỳ đâu trên trang)"
                code={triggerBtn}
                copyKey="trigger"
                note="Mỗi lần bấm nút này, popup overlay hiện ra và cào lại từ đầu. Có thể đổi chữ trong nút, hoặc dùng thuộc tính data-scratch-popup trên bất kỳ phần tử nào (ví dụ ảnh) để biến nó thành nút mở popup."
              />

              <div className="rounded-lg border border-border bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
                <strong className="text-foreground">Cách mở popup khác:</strong>{" "}
                gọi{" "}
                <code className="rounded bg-muted px-1">
                  window.ScratchPopup.open()
                </code>{" "}
                từ bất kỳ đoạn JS nào trên website — ví dụ gắn vào sự kiện click
                của nút có sẵn trong trình tạo trang.
              </div>
            </>
          )}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">Lưu ý:</strong> Widget dùng Shadow
          DOM để cách ly CSS, không bị vỡ bởi CSS của trang gốc. Đóng popup rồi
          bấm nút lại — popup sẽ hiện trở lại và cào được lại từ đầu.
        </div>

        <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
          <strong className="text-foreground">
            Để widget tự chuyển sang Bước 3 (Cảm ơn) sau khi submit form:
          </strong>
          <ol className="mt-1.5 list-decimal space-y-1 pl-4">
            <li>
              Host kèm file{" "}
              <code className="rounded bg-muted px-1">thank-you.html</code> tại
              domain của bạn, ví dụ{" "}
              <code className="rounded bg-muted px-1">
                https://ten-mien-cua-ban.com/thank-you.html
              </code>
              .
            </li>
            <li>
              Trong cấu hình Form bên CRM, đặt <strong>Redirect URL</strong> trỏ
              tới đường dẫn{" "}
              <code className="rounded bg-muted px-1">thank-you.html</code> đó.
            </li>
            <li>
              Khi người dùng submit, form redirect tới trang thank-you; trang
              này gửi <code className="rounded bg-muted px-1">postMessage</code>{" "}
              về widget → tự chuyển Bước 3.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
