import { useEffect, useMemo, useRef, useState } from "react";
import type { PopupConfig, PreviewStep } from "@/types";
import ScratchCard from "@/components/ScratchCard";
import Confetti from "@/components/Confetti";
import EditableText from "@/components/EditableText";
import { getFormPreviewSource } from "@/lib/form-embed";

interface PopupPreviewProps {
  config: PopupConfig;
  step: PreviewStep;
  onStepChange: (s: PreviewStep) => void;
  onFieldChange: (field: keyof PopupConfig, value: string | number) => void;
  testMode?: boolean;
}

export default function PopupPreview({
  config,
  step,
  onStepChange,
  onFieldChange,
  testMode,
}: PopupPreviewProps) {
  const [confetti, setConfetti] = useState(0);
  const [confettiOrigin, setConfettiOrigin] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [autoStep, setAutoStep] = useState<PreviewStep>(step);
  const [autoClose, setAutoClose] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [scratched, setScratched] = useState(false);
  const [bubbleHover, setBubbleHover] = useState(false);
  const timersRef = useRef<number[]>([]);
  const formFrameRef = useRef<HTMLIFrameElement>(null);
  const formPreviewSource = useMemo(
    () => getFormPreviewSource(config.formEmbedCode),
    [config.formEmbedCode],
  );

  // sync external step -> autoStep when not in test flow
  useEffect(() => {
    setAutoStep(step);
    setScratched(false);
    setConfetti(0);
    setConfettiOrigin(null);
  }, [step]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  const handleScratchComplete = () => {
    // burst confetti from the scratch card's viewport position
    const card = document.querySelector('[data-scratch-origin="1"]');
    const rect = card?.getBoundingClientRect();
    setConfettiOrigin(
      rect
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : null,
    );
    setConfetti((c) => c + 1);
    setScratched(true);
  };

  const handleClaim = () => {
    setAutoStep(2);
    onStepChange(2);
  };

  const handleDecline = () => {
    if (config.bubbleEnabled) {
      setMinimized(true);
    } else {
      setAutoClose(true);
    }
  };

  const handleClose = () => {
    if (config.bubbleEnabled) {
      setMinimized(true);
    } else {
      setAutoClose(true);
    }
  };

  // Step 2 -> Step 3 via message listener (form submit from GHL iframe)
  useEffect(() => {
    if (autoStep !== 2) return;
    const handler = (e: MessageEvent) => {
      if (e.source !== formFrameRef.current?.contentWindow) return;
      const d = e.data;
      if (
        d &&
        (d.event === "form:submit" ||
          d.type === "ghl_form_submit" ||
          d.submitted === true)
      ) {
        setAutoStep(3);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [autoStep]);

  // Step 3 auto close after 5s in test mode
  useEffect(() => {
    if (autoStep !== 3 || !testMode) return;
    setAutoClose(false);
    const t = window.setTimeout(() => setAutoClose(true), 5000);
    timersRef.current.push(t);
    return clearTimers;
  }, [autoStep, testMode]);

  const current = autoStep;

  const closeBtn = () => {
    const base =
      config.closeStyle === "text"
        ? "px-2 py-0.5 text-sm font-semibold"
        : config.closeStyle === "square"
          ? "flex h-8 w-8 items-center justify-center rounded-md text-lg font-bold"
          : "flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold";
    return (
      <button
        onClick={handleClose}
        className={`${base} absolute right-3 top-3 z-30 transition hover:opacity-80`}
        style={{ background: config.closeBgColor, color: config.closeColor }}
        aria-label="Đóng popup"
      >
        {config.closeStyle === "text" ? "Đóng ×" : "×"}
      </button>
    );
  };

  return (
    <div className="popup-preview-stage relative flex h-full w-full min-w-0 items-start justify-center overflow-y-auto px-3 pb-6 pt-20 sm:px-6">
      {/* Step switcher */}
      <div className="absolute left-6 top-6 z-40 flex gap-1 rounded-xl border border-border bg-card/90 p-1 shadow-sm backdrop-blur">
        {([1, 2, 3] as PreviewStep[]).map((s) => (
          <button
            key={s}
            onClick={() => {
              clearTimers();
              onStepChange(s);
              setAutoStep(s);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              current === s
                ? "gradient-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Bước {s}
          </button>
        ))}
      </div>

      {minimized && config.bubbleEnabled ? (
        <div
          className="absolute z-50 cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
          style={{
            ...(config.bubblePosition === "bottom-right"
              ? { right: 24, bottom: 24 }
              : config.bubblePosition === "top-right"
                ? { right: 24, top: 24 }
                : config.bubblePosition === "top-left"
                  ? { left: 24, top: 24 }
                  : { left: 24, bottom: 24 }),
          }}
          onMouseEnter={() => setBubbleHover(true)}
          onMouseLeave={() => setBubbleHover(false)}
          onClick={() => {
            setMinimized(false);
            setBubbleHover(false);
            setAutoStep(1);
            onStepChange(1);
            setConfetti(0);
            setConfettiOrigin(null);
          }}
        >
          <div
            className="flex items-center justify-center rounded-full shadow-xl"
            style={{
              height: config.bubbleSize,
              width: config.bubbleSize,
              background: config.bubbleBgColor,
              color: config.bubbleTextColor,
              fontSize: Math.max(16, config.bubbleSize * 0.32),
            }}
          >
            🎁
          </div>
          <span
            className="absolute top-1/2 whitespace-nowrap rounded-full font-semibold shadow-lg"
            style={{
              background: config.bubbleBgColor,
              color: config.bubbleTextColor,
              fontSize: config.bubbleFontSize,
              fontFamily: config.bubbleFontFamily,
              padding: "6px 14px",
              pointerEvents: "none",
              opacity: bubbleHover ? 1 : 0,
              transform: `translateY(-50%) translateX(${
                bubbleHover
                  ? 0
                  : config.bubblePosition === "bottom-right" ||
                      config.bubblePosition === "top-right"
                    ? 8
                    : -8
              }px)`,
              transition: "opacity .25s ease, transform .25s ease",
              ...(config.bubblePosition === "bottom-right" ||
              config.bubblePosition === "top-right"
                ? { right: "100%", marginRight: 8 }
                : { left: "100%", marginLeft: 8 }),
            }}
          >
            {config.bubbleText}
          </span>
        </div>
      ) : autoClose ? (
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Popup đã tự đóng sau 5 giây (chế độ test).</p>
          <button
            onClick={() => {
              setAutoClose(false);
              setAutoStep(1);
              onStepChange(1);
            }}
            className="mt-3 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted"
          >
            Cào lại
          </button>
        </div>
      ) : (
        <div
          className="relative flex min-w-0 shrink-0 overflow-hidden shadow-2xl"
          style={{
            maxWidth: config.maxWidth,
            width: "100%",
            borderRadius: config.borderRadius,
            background: config.bgColor,
            fontFamily: config.fontFamily,
          }}
        >
          {closeBtn()}
          <Confetti fire={confetti} origin={confettiOrigin} />

          <div className="popup-preview-grid grid w-full min-w-0" style={{ minHeight: 420 }}>
            {/* LEFT column — steps */}
            <div className="relative flex min-w-0 flex-col p-4 sm:p-6">
              {current === 1 && (
                <div className="flex flex-1 flex-col items-center justify-center gap-4">
                  <EditableText
                    as="h2"
                    value={config.scratchTitle}
                    onChange={(v) => onFieldChange("scratchTitle", v)}
                    className="text-center text-xl font-extrabold"
                    style={{ color: config.scratchTitleColor }}
                  />
                  <ScratchCard
                    coverImage={config.scratchCoverImage}
                    rewardImage={config.rewardImage}
                    rewardSubtitle={config.rewardSubtitle}
                    rewardSubtitleColor={config.rewardSubtitleColor}
                    rewardSubtitleFontSize={config.rewardSubtitleFontSize}
                    rewardSubtitleFontFamily={config.rewardSubtitleFontFamily}
                    rewardText={config.rewardText}
                    rewardTextColor={config.rewardTextColor}
                    rewardTextFontSize={config.rewardTextFontSize}
                    rewardTextFontFamily={config.rewardTextFontFamily}
                    rewardIconBefore={config.rewardIconBefore}
                    rewardIconAfter={config.rewardIconAfter}
                    percent={config.scratchPercent}
                    width={300}
                    height={200}
                    onComplete={handleScratchComplete}
                    resetKey={config.id + current}
                    dataOrigin
                    revealed={scratched}
                  />
                  {scratched ? (
                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={handleClaim}
                        className="rounded-xl px-5 py-2 text-sm font-semibold shadow transition hover:opacity-90"
                        style={{
                          background: config.claimButtonGradient
                            ? `linear-gradient(135deg, ${config.claimButtonColor}, ${config.claimButtonColor2})`
                            : config.claimButtonColor,
                          color: config.claimButtonTextColor,
                        }}
                      >
                        {config.claimButtonLabel}
                      </button>
                      {config.showDeclineButton && (
                        <button
                          onClick={handleDecline}
                          className="text-xs text-muted-foreground underline-offset-2 transition hover:text-foreground hover:underline"
                        >
                          {config.declineButtonLabel}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex max-w-[280px] flex-col items-center gap-1 text-center">
                        {config.rewardSubtitle && (
                          <EditableText
                            as="span"
                            value={config.rewardSubtitle}
                            onChange={(v) => onFieldChange("rewardSubtitle", v)}
                            className="font-semibold"
                            style={{
                              color: config.rewardSubtitleColor,
                              fontSize: config.rewardSubtitleFontSize,
                              fontFamily: config.rewardSubtitleFontFamily,
                            }}
                          />
                        )}
                        <div
                          className="flex items-center justify-center gap-1.5 font-extrabold"
                          style={{
                            color: config.rewardTextColor,
                            fontSize: config.rewardTextFontSize,
                            fontFamily: config.rewardTextFontFamily,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {config.rewardIconBefore && (
                            <span aria-hidden>{config.rewardIconBefore}</span>
                          )}
                          <EditableText
                            as="span"
                            value={config.rewardText}
                            onChange={(v) => onFieldChange("rewardText", v)}
                            multiline
                          />
                          {config.rewardIconAfter && (
                            <span aria-hidden>{config.rewardIconAfter}</span>
                          )}
                        </div>
                      </div>
                      <EditableText
                        as="p"
                        value={config.scratchHint}
                        onChange={(v) => onFieldChange("scratchHint", v)}
                        className="max-w-[280px] text-center text-xs text-muted-foreground"
                      />
                    </div>
                  )}
                </div>
              )}

              {current === 2 && (
                <div className="flex flex-1 flex-col gap-3">
                  <EditableText
                    as="h3"
                    value={config.formTitle}
                    onChange={(v) => onFieldChange("formTitle", v)}
                    className="text-lg font-bold"
                    style={{ color: config.scratchTitleColor }}
                  />
                  <div
                    className="flex-1 overflow-auto p-2"
                    style={{ minHeight: 240 }}
                  >
                    {config.formEmbedCode ? (
                      <iframe
                        ref={formFrameRef}
                        title="Xem thử form"
                        sandbox={
                          formPreviewSource.srcDoc
                            ? "allow-scripts allow-forms"
                            : undefined
                        }
                        className="min-h-80 w-full border-0"
                        src={formPreviewSource.src}
                        srcDoc={formPreviewSource.srcDoc}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-center text-xs text-muted-foreground">
                        Dán mã nhúng Form vào bảng cài đặt bên trái để hiển thị
                        tại đây
                      </div>
                    )}
                  </div>
                </div>
              )}

              {current === 3 && (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                  <div className="gradient-accent flex h-14 w-14 items-center justify-center rounded-full text-2xl text-primary-foreground shadow-lg">
                    ✓
                  </div>
                  <EditableText
                    as="h3"
                    value={config.thanksTitle}
                    onChange={(v) => onFieldChange("thanksTitle", v)}
                    className="text-xl font-extrabold"
                    style={{
                      color: config.thanksTextColor,
                      fontFamily: config.thanksFontFamily,
                    }}
                  />
                  <EditableText
                    as="p"
                    value={config.thanksMessage}
                    onChange={(v) => onFieldChange("thanksMessage", v)}
                    multiline
                    className="max-w-[260px] text-sm"
                    style={{
                      color: config.thanksTextColor,
                      fontFamily: config.thanksFontFamily,
                    }}
                  />
                  <button
                    className="gradient-primary mt-2 rounded-xl px-5 py-2 text-sm font-semibold text-primary-foreground shadow"
                    style={{ fontFamily: config.thanksFontFamily }}
                  >
                    {config.thanksButtonLabel}
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT column — banner */}
            <div className="popup-preview-banner relative min-w-0 overflow-hidden bg-muted">
              {config.bannerImage ? (
                <img
                  src={config.bannerImage}
                  alt="Banner"
                  className="h-full w-full"
                  style={{
                    objectFit: config.bannerFit,
                    objectPosition: config.bannerPosition || "center",
                  }}
                />
              ) : (
                <div className="gradient-primary flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center text-primary-foreground">
                  <span className="text-3xl">🎁</span>
                  <span className="text-sm font-semibold opacity-90">
                    Tải ảnh banner ở bảng cài đặt
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
