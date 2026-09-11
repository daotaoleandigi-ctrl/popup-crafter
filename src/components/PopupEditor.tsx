import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Play, Save, Code2, ChevronDown, Plus, Trash2, Dices } from "lucide-react";
import type { PopupConfig, PreviewStep, VoucherItem } from "@/types";
import { savePopup } from "@/lib/repository";
import PublicationControls from "./PublicationControls";
import { createPopup, FONT_OPTIONS } from "@/lib/defaults";
import PopupPreview from "@/components/PopupPreview";
import EmbedDialog from "@/components/EmbedDialog";
import ImageUploader from "@/components/ImageUploader";
import ColorInput from "@/components/ColorInput";
import { getVoucherProbabilityTotal } from "@/lib/voucher-random";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

interface PopupEditorProps {
  popup: PopupConfig;
  onBack: () => void;
}

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="border-b border-border"
    >
      <h3>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="group flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
          >
            <span>{title}</span>
            <ChevronDown
              aria-hidden="true"
              className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                open ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>
        </CollapsibleTrigger>
      </h3>
      <CollapsibleContent className="collapsible-section-content overflow-hidden">
        <div className="space-y-3 px-4 pb-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-input bg-card px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/40";

export default function PopupEditor({ popup, onBack }: PopupEditorProps) {
  const [config, setConfig] = useState<PopupConfig>(() => createPopup(popup));
  const [step, setStep] = useState<PreviewStep>(1);
  const [testMode, setTestMode] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [voucherPreviewNonce, setVoucherPreviewNonce] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const firstRun = useRef(true);
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  const latest = useRef(config);
  latest.current = config;
  const [saving, setSaving] = useState(false);

  // keep latest config in state if popup prop changes
  useEffect(() => {
    setConfig(createPopup(popup));
  }, [popup.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = <K extends keyof PopupConfig>(field: K, value: PopupConfig[K]) => {
    setConfig((c) => ({ ...c, [field]: value, updatedAt: Date.now() }));
    setDirty(true);
    setSaved(false);
  };

  const updateVoucher = <K extends keyof VoucherItem>(
    id: string,
    field: K,
    value: VoucherItem[K],
  ) => update("vouchers", config.vouchers.map((v) => v.id === id ? { ...v, [field]: value } : v));

  const addVoucher = () => update("vouchers", [
    ...config.vouchers,
    {
      id: crypto.randomUUID(),
      rewardText: `Voucher ${config.vouchers.length + 1}`,
      rewardSubtitle: "Bạn đã trúng",
      rewardTextColor: config.rewardTextColor,
      rewardSubtitleColor: config.rewardSubtitleColor,
      probability: 0,
    },
  ]);

  const removeVoucher = (id: string) => {
    if (config.vouchers.length <= 2) {
      toast.error("Cần ít nhất 2 voucher khi bật chế độ ngẫu nhiên.");
      return;
    }
    update("vouchers", config.vouchers.filter((v) => v.id !== id));
  };

  const persist = (cfg: PopupConfig): Promise<boolean> => {
    setSaving(true);
    const task = saveQueue.current.then(async () => {
      try {
        await savePopup(cfg);
        if (latest.current === cfg) {
          setDirty(false);
          setSaved(true);
        }
        return true;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Không lưu được popup.");
        return false;
      }
    });
    saveQueue.current = task;
    void task.finally(() => {
      if (saveQueue.current === task) setSaving(false);
    });
    return task;
  };

  // Auto-save: persist every change (debounced) so edits are never lost
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(async () => {
      if (!(await persist(config))) return;
      if (latest.current === config) setSaved(true);
    }, 500);
    return () => clearTimeout(t);
  }, [config]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty || saving) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saving]);

  // Warn before leaving if there are unsaved (not yet persisted) changes
  const handleBack = () => {
    if (dirty) {
      setConfirmLeave(true);
      return;
    }
    onBack();
  };

  const handleSave = async () => {
    if (!(await persist(config))) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleSaveAndEmbed = async () => {
    if (!(await persist(config))) return;
    setShowEmbed(true);
  };

  const handleTest = () => {
    setTestMode(true);
    setStep(1);
    setPreviewKey((k) => k + 1);
  };

  return (
    <div className="flex min-h-screen md:h-screen flex-col bg-background">
      {/* Topbar */}
      <header className="flex flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-2.5 shadow-sm">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </button>
        <input
          value={config.name}
          onChange={(e) => update("name", e.target.value)}
          className="min-w-0 basis-full sm:basis-0 flex-1 rounded-lg border border-transparent px-2 py-1.5 text-sm font-bold outline-none hover:border-border focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={handleTest}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition hover:border-primary hover:text-primary"
        >
          <Play className="h-4 w-4" /> Thử cào Test
        </button>
        <button
          disabled={saving}
          onClick={handleSave}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition hover:bg-muted"
        >
          <Save className="h-4 w-4" />{" "}
          {saving ? "Đang lưu…" : saved ? "Đã lưu!" : "Lưu bản nháp"}
        </button>
        <button
          disabled={saving}
          onClick={handleSaveAndEmbed}
          className="gradient-primary flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90"
        >
          <Code2 className="h-4 w-4" /> Lưu & Lấy mã nhúng
        </button>
      </header>
      <div className="border-b bg-card px-4 py-2">
        <PublicationControls id={config.id} onPublish={() => persist(config)} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Left settings panel */}
        <aside className="no-scrollbar w-full md:w-80 max-h-[45vh] md:max-h-none shrink-0 overflow-y-auto border-r border-border bg-card">
          <Section title="Cài đặt chung" defaultOpen>
            <Field label="Tên font chữ">
              <select
                value={config.fontFamily}
                onChange={(e) => update("fontFamily", e.target.value)}
                className={inputCls}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f} style={{ fontFamily: f }}>
                    {f.split(",")[0]}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Bo góc (px)">
                <input
                  type="number"
                  value={config.borderRadius}
                  onChange={(e) =>
                    update("borderRadius", Number(e.target.value))
                  }
                  className={inputCls}
                />
              </Field>
              <Field label="Rộng tối đa (px)">
                <input
                  type="number"
                  value={config.maxWidth}
                  onChange={(e) => update("maxWidth", Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
            </div>
            <ColorInput
              label="Màu nền popup"
              value={config.bgColor}
              onChange={(v) => update("bgColor", v)}
            />
            <Field label="Dạng nút đóng">
              <div className="flex gap-1.5">
                {(["circle", "square", "text"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => update("closeStyle", s)}
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                      config.closeStyle === s
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {s === "circle" ? "Tròn" : s === "square" ? "Vuông" : "Chữ"}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <ColorInput
                label="Màu nút đóng"
                value={config.closeColor}
                onChange={(v) => update("closeColor", v)}
              />
              <ColorInput
                label="Nền nút đóng"
                value={config.closeBgColor}
                onChange={(v) => update("closeBgColor", v)}
              />
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <Field label="Cách hiển thị">
                <select
                  aria-label="Cách hiển thị"
                  className={inputCls}
                  value={config.displayMode}
                  onChange={(e) => update("displayMode", e.target.value)}
                >
                  <option value="popup">Popup nổi trên trang</option>
                  <option value="embed">Nhúng trực tiếp vào trang</option>
                </select>
              </Field>
              {config.displayMode === "popup" && (
                <>
                  <Field
                    label={`Độ trễ trước khi hiện (${config.autoShowDelay}s)`}
                  >
                    <input
                      type="range"
                      min={0}
                      max={15}
                      step={1}
                      value={config.autoShowDelay}
                      onChange={(e) =>
                        update("autoShowDelay", Number(e.target.value))
                      }
                      className="w-full accent-primary"
                    />
                  </Field>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                    Popup overlay TỰ ĐỘNG mở khi tải trang (kèm độ trễ nếu có).
                    Có nền mờ, nút đóng — giống popup thông thường. Phù hợp
                    nhúng vào popup CRM.
                  </p>
                </>
              )}
            </div>
          </Section>

          <Section title="Cột phải — Banner">
            <ImageUploader
              label="Ảnh banner"
              value={config.bannerImage}
              onChange={(v) => update("bannerImage", v)}
            />
            <Field label="Căn ảnh">
              <select
                value={config.bannerFit}
                onChange={(e) => update("bannerFit", e.target.value)}
                className={inputCls}
              >
                <option value="cover">Cover (lấp đầy)</option>
                <option value="contain">Contain (nguyên vẹn)</option>
              </select>
            </Field>
            <Field label="Vị trí">
              <select
                value={config.bannerPosition}
                onChange={(e) => update("bannerPosition", e.target.value)}
                className={inputCls}
              >
                <option value="center">Center</option>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </Field>
          </Section>

          <Section title="Bước 1 — Thẻ cào">
            <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-3">
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span>
                  <span className="block text-xs font-bold text-foreground">Ngẫu nhiên phần thưởng</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">Mỗi khách nhận một voucher theo tỷ lệ đã đặt.</span>
                </span>
                <input
                  type="checkbox"
                  checked={config.voucherRandomEnabled}
                  onChange={(e) => update("voucherRandomEnabled", e.target.checked)}
                  className="h-4 w-4 shrink-0 accent-primary"
                />
              </label>
            </div>

            {config.voucherRandomEnabled && (() => {
              const total = getVoucherProbabilityTotal(config.vouchers);
              const valid = Math.abs(total - 100) < 0.001;
              return (
                <div className="space-y-3">
                  <div className={`rounded-xl border p-3 ${valid ? "border-emerald-300 bg-emerald-50/70" : "border-amber-300 bg-amber-50/70"}`}>
                    <div className="mb-2 flex items-center justify-between text-xs font-bold">
                      <span>Tổng tỷ lệ</span>
                      <span className={valid ? "text-emerald-700" : "text-amber-700"}>{total}% / 100%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white shadow-inner">
                      <div className={`h-full rounded-full transition-all ${valid ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${Math.min(total, 100)}%` }} />
                    </div>
                    {!valid && <p className="mt-2 text-[11px] text-amber-800">Điều chỉnh để tổng tỷ lệ bằng đúng 100%.</p>}
                  </div>

                  <div className="space-y-2">
                    {config.vouchers.map((voucher, index) => (
                      <Collapsible key={voucher.id} defaultOpen={index === 0} className="rounded-xl border border-border bg-card">
                        <div className="flex items-center">
                          <CollapsibleTrigger className="flex min-h-11 flex-1 items-center justify-between gap-2 px-3 text-left text-xs font-bold hover:bg-muted/50">
                            <span className="truncate">{voucher.rewardText || `Voucher ${index + 1}`}</span>
                            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-primary">{voucher.probability || 0}%</span>
                          </CollapsibleTrigger>
                          <button type="button" aria-label={`Xóa voucher ${index + 1}`} onClick={() => removeVoucher(voucher.id)} className="mr-2 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <CollapsibleContent>
                          <div className="space-y-3 border-t border-border px-3 py-3">
                            <Field label="Tên phần thưởng">
                              <input value={voucher.rewardText} onChange={(e) => updateVoucher(voucher.id, "rewardText", e.target.value)} className={inputCls} />
                            </Field>
                            <Field label="Tiêu đề phụ">
                              <input value={voucher.rewardSubtitle || ""} onChange={(e) => updateVoucher(voucher.id, "rewardSubtitle", e.target.value)} className={inputCls} />
                            </Field>
                            <ImageUploader label="Ảnh phần thưởng" value={voucher.rewardImage || ""} onChange={(value) => updateVoucher(voucher.id, "rewardImage", value)} />
                            <Field label="Mã voucher">
                              <input value={voucher.code || ""} onChange={(e) => updateVoucher(voucher.id, "code", e.target.value)} placeholder="VD: GIAM50K" className={inputCls} />
                            </Field>
                            <Field label="Tỷ lệ trúng (%)">
                              <input type="number" min={0} max={100} step={1} value={voucher.probability} onChange={(e) => updateVoucher(voucher.id, "probability", Math.min(100, Math.max(0, Number(e.target.value))))} className={inputCls} />
                            </Field>
                            <div className="grid grid-cols-2 gap-2">
                              <ColorInput label="Màu tên quà" value={voucher.rewardTextColor || config.rewardTextColor} onChange={(value) => updateVoucher(voucher.id, "rewardTextColor", value)} />
                              <ColorInput label="Màu tiêu đề phụ" value={voucher.rewardSubtitleColor || config.rewardSubtitleColor} onChange={(value) => updateVoucher(voucher.id, "rewardSubtitleColor", value)} />
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={addVoucher} className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-2 py-2 text-xs font-semibold hover:border-primary hover:text-primary"><Plus className="h-3.5 w-3.5" /> Thêm voucher</button>
                    <button type="button" disabled={!valid} onClick={() => { setStep(1); setVoucherPreviewNonce((n) => n + 1); }} className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-2 py-2 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"><Dices className="h-3.5 w-3.5" /> Thử random</button>
                  </div>
                </div>
              );
            })()}

            <ImageUploader
              label="Ảnh phủ cào (Scratch Cover)"
              value={config.scratchCoverImage}
              onChange={(v) => update("scratchCoverImage", v)}
            />
            <div className={config.voucherRandomEnabled ? "hidden" : "contents"}>
            <ImageUploader
              label="Ảnh phần thưởng (bên dưới lớp cào)"
              value={config.rewardImage}
              onChange={(v) => update("rewardImage", v)}
            />
            <Field label="Tiêu đề phụ (subtitle, bên trên phần thưởng)">
              <input
                value={config.rewardSubtitle}
                onChange={(e) => update("rewardSubtitle", e.target.value)}
                placeholder="VD: Bạn đã trúng"
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <ColorInput
                label="Màu chữ subtitle"
                value={config.rewardSubtitleColor}
                onChange={(v) => update("rewardSubtitleColor", v)}
              />
              <Field label={`Cỡ chữ (${config.rewardSubtitleFontSize}px)`}>
                <input
                  type="range"
                  min={10}
                  max={28}
                  step={1}
                  value={config.rewardSubtitleFontSize}
                  onChange={(e) =>
                    update("rewardSubtitleFontSize", Number(e.target.value))
                  }
                  className="w-full accent-primary"
                />
              </Field>
            </div>
            <Field label="Font chữ subtitle">
              <select
                value={config.rewardSubtitleFontFamily}
                onChange={(e) =>
                  update("rewardSubtitleFontFamily", e.target.value)
                }
                className={inputCls}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f} style={{ fontFamily: f }}>
                    {f.split(",")[0]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Văn bản phần thưởng (nếu không có ảnh)">
              <textarea
                value={config.rewardText}
                onChange={(e) => update("rewardText", e.target.value)}
                placeholder="Nhập văn bản… Enter để xuống dòng"
                className={`${inputCls} h-16 resize-y`}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Icon trước (emoji)">
                <input
                  value={config.rewardIconBefore}
                  onChange={(e) => update("rewardIconBefore", e.target.value)}
                  placeholder="🎁"
                  className={inputCls}
                />
              </Field>
              <Field label="Icon sau (emoji)">
                <input
                  value={config.rewardIconAfter}
                  onChange={(e) => update("rewardIconAfter", e.target.value)}
                  placeholder="—"
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ColorInput
                label="Màu chữ phần thưởng"
                value={config.rewardTextColor}
                onChange={(v) => update("rewardTextColor", v)}
              />
              <Field label={`Cỡ chữ (${config.rewardTextFontSize}px)`}>
                <input
                  type="range"
                  min={12}
                  max={36}
                  step={1}
                  value={config.rewardTextFontSize}
                  onChange={(e) =>
                    update("rewardTextFontSize", Number(e.target.value))
                  }
                  className="w-full accent-primary"
                />
              </Field>
            </div>
            <Field label="Font chữ phần thưởng">
              <select
                value={config.rewardTextFontFamily}
                onChange={(e) => update("rewardTextFontFamily", e.target.value)}
                className={inputCls}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f} style={{ fontFamily: f }}>
                    {f.split(",")[0]}
                  </option>
                ))}
              </select>
            </Field>
            </div>
            <Field
              label={`% cào sạch để chuyển bước (${config.scratchPercent}%)`}
            >
              <input
                type="range"
                min={10}
                max={100}
                value={config.scratchPercent}
                onChange={(e) =>
                  update("scratchPercent", Number(e.target.value))
                }
                className="w-full accent-primary"
              />
            </Field>
            <ColorInput
              label="Màu tiêu đề bước 1"
              value={config.scratchTitleColor}
              onChange={(v) => update("scratchTitleColor", v)}
            />
            <Field label="Nhãn nút nhận quà">
              <input
                value={config.claimButtonLabel}
                onChange={(e) => update("claimButtonLabel", e.target.value)}
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <ColorInput
                label="Màu nền nút nhận quà"
                value={config.claimButtonColor}
                onChange={(v) => update("claimButtonColor", v)}
              />
              <ColorInput
                label="Màu chữ nút nhận quà"
                value={config.claimButtonTextColor}
                onChange={(v) => update("claimButtonTextColor", v)}
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <input
                type="checkbox"
                checked={config.claimButtonGradient}
                onChange={(e) =>
                  update("claimButtonGradient", e.target.checked)
                }
                className="h-3.5 w-3.5 accent-primary"
              />
              Dùng màu gradient cho nút nhận quà
            </label>
            {config.claimButtonGradient && (
              <ColorInput
                label="Màu gradient thứ 2"
                value={config.claimButtonColor2}
                onChange={(v) => update("claimButtonColor2", v)}
              />
            )}
            <Field label="Nhãn nút từ chối">
              <input
                value={config.declineButtonLabel}
                onChange={(e) => update("declineButtonLabel", e.target.value)}
                className={inputCls}
                disabled={!config.showDeclineButton}
              />
            </Field>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <input
                type="checkbox"
                checked={config.showDeclineButton}
                onChange={(e) => update("showDeclineButton", e.target.checked)}
                className="h-3.5 w-3.5 accent-primary"
              />
              Hiển thị nút từ chối
            </label>
          </Section>

          <Section title="Bước 2 — Form (mã nhúng)">
            <Field label="Tiêu đề">
              <input
                value={config.formTitle}
                onChange={(e) => update("formTitle", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Dán mã nhúng Form (HTML / iFrame / Script)">
              <textarea
                value={config.formEmbedCode}
                onChange={(e) => update("formEmbedCode", e.target.value)}
                placeholder='<iframe src="..." ...></iframe> hoặc <script src="..."></script>'
                className={`${inputCls} h-28 resize-y font-mono leading-relaxed`}
              />
            </Field>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
              <strong className="text-foreground">
                Cách để popup nhận biết đã submit:
              </strong>
              <ol className="mt-1.5 list-decimal space-y-1 pl-4">
                <li>
                  Host file{" "}
                  <code className="rounded bg-muted px-1">thank-you.html</code>{" "}
                  (kèm widget) tại domain của bạn, ví dụ{" "}
                  <code className="rounded bg-muted px-1">
                    https://ten-mien-cua-ban.com/thank-you.html
                  </code>
                  .
                </li>
                <li>
                  Vào cấu hình Form bên GHL → mục <strong>Redirect URL</strong>{" "}
                  / <strong>Thank-you page</strong>, dán đường dẫn tuyệt đối tới
                  file{" "}
                  <code className="rounded bg-muted px-1">thank-you.html</code>{" "}
                  đó.
                </li>
                <li>
                  Khi người dùng submit form trong iframe, form sẽ redirect sang
                  trang thank-you; trang đó tự gửi{" "}
                  <code className="rounded bg-muted px-1">postMessage</code> về
                  popup → popup tự chuyển sang Bước 3 (Cảm ơn).
                </li>
              </ol>
            </div>
          </Section>

          <Section title="Bước 3 — Cảm ơn">
            <Field label="Tiêu đề">
              <input
                value={config.thanksTitle}
                onChange={(e) => update("thanksTitle", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Nội dung chúc mừng">
              <textarea
                value={config.thanksMessage}
                onChange={(e) => update("thanksMessage", e.target.value)}
                className={`${inputCls} h-16 resize-y`}
              />
            </Field>
            <Field label="Nhãn nút">
              <input
                value={config.thanksButtonLabel}
                onChange={(e) => update("thanksButtonLabel", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Font chữ cảm ơn">
              <select
                value={config.thanksFontFamily}
                onChange={(e) => update("thanksFontFamily", e.target.value)}
                className={inputCls}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f} style={{ fontFamily: f }}>
                    {f.split(",")[0]}
                  </option>
                ))}
              </select>
            </Field>
            <ColorInput
              label="Màu chữ cảm ơn"
              value={config.thanksTextColor}
              onChange={(v) => update("thanksTextColor", v)}
            />
          </Section>

          <Section title="Bong bóng (thu nhỏ)">
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <input
                type="checkbox"
                checked={config.bubbleEnabled}
                onChange={(e) => update("bubbleEnabled", e.target.checked)}
                className="h-3.5 w-3.5 accent-primary"
              />
              Hiển thị bong bóng khi đóng popup
            </label>
            {config.bubbleEnabled && (
              <>
                <Field label="Vị trí bong bóng">
                  <select
                    value={config.bubblePosition}
                    onChange={(e) => update("bubblePosition", e.target.value)}
                    className={inputCls}
                  >
                    <option value="bottom-left">Góc trái dưới</option>
                    <option value="bottom-right">Góc phải dưới</option>
                    <option value="top-left">Góc trái trên</option>
                    <option value="top-right">Góc phải trên</option>
                  </select>
                </Field>
                <Field label="Nội dung bong bóng">
                  <input
                    value={config.bubbleText}
                    onChange={(e) => update("bubbleText", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <ColorInput
                    label="Màu nền bong bóng"
                    value={config.bubbleBgColor}
                    onChange={(v) => update("bubbleBgColor", v)}
                  />
                  <ColorInput
                    label="Màu chữ bong bóng"
                    value={config.bubbleTextColor}
                    onChange={(v) => update("bubbleTextColor", v)}
                  />
                </div>
                <Field label={`Kích thước (${config.bubbleSize}px)`}>
                  <input
                    type="range"
                    min={44}
                    max={80}
                    step={2}
                    value={config.bubbleSize}
                    onChange={(e) =>
                      update("bubbleSize", Number(e.target.value))
                    }
                    className="w-full accent-primary"
                  />
                </Field>
                <Field label={`Cỡ chữ bong bóng (${config.bubbleFontSize}px)`}>
                  <input
                    type="range"
                    min={10}
                    max={24}
                    step={1}
                    value={config.bubbleFontSize}
                    onChange={(e) =>
                      update("bubbleFontSize", Number(e.target.value))
                    }
                    className="w-full accent-primary"
                  />
                </Field>
                <Field label="Font chữ bong bóng">
                  <select
                    value={config.bubbleFontFamily}
                    onChange={(e) => update("bubbleFontFamily", e.target.value)}
                    className={inputCls}
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f} style={{ fontFamily: f }}>
                        {f.split(",")[0]}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            )}
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Khi người dùng đóng popup (chế độ popup), thay vì biến mất hoàn
              toàn, popup sẽ thu nhỏ thành một bong bóng góc màn hình — giống
              chat widget. Bấm vào bong bóng để mở lại popup.
            </p>
          </Section>

          <div className="px-4 py-4">
            {testMode && (
              <button
                onClick={() => setTestMode(false)}
                className="w-full rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                Thoát chế độ Test
              </button>
            )}
          </div>
        </aside>

        {/* Main canvas */}
        <main className="relative min-h-[500px] md:min-h-0 min-w-0 flex-1 bg-[radial-gradient(circle_at_center,hsl(var(--muted)),hsl(var(--background)))]">
            <PopupPreview
            key={previewKey}
            config={config}
            step={step}
            onStepChange={setStep}
            onFieldChange={update}
              testMode={testMode}
              voucherPreviewNonce={voucherPreviewNonce}
          />
          {testMode && (
            <div className="absolute right-6 top-6 z-40 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground shadow">
              Đang chạy Test
            </div>
          )}
        </main>
      </div>

      <EmbedDialog
        open={showEmbed}
        popup={config}
        onClose={() => setShowEmbed(false)}
      />

      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Thoát mà chưa lưu?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn vừa chỉnh sửa popup nhưng thay đổi chưa được lưu. Bấm "Lưu &
              thoát" để giữ lại, hoặc "Hủy" để tiếp tục chỉnh sửa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                if (!(await persist(config))) return;
                onBack();
              }}
            >
              Lưu & thoát
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
