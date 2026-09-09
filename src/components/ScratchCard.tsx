import { useEffect, useRef, useState } from "react";

interface ScratchCardProps {
  coverImage: string;
  rewardImage: string;
  rewardSubtitle?: string;
  rewardSubtitleColor?: string;
  rewardSubtitleFontSize?: number;
  rewardSubtitleFontFamily?: string;
  rewardText: string;
  rewardTextColor: string;
  rewardTextFontSize?: number;
  rewardTextFontFamily?: string;
  rewardIconBefore?: string;
  rewardIconAfter?: string;
  percent: number;
  width?: number;
  height?: number;
  onComplete?: () => void;
  resetKey?: number | string;
  dataOrigin?: boolean;
}

const DEFAULT_COVER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='260'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#a78bfa'/><stop offset='1' stop-color='#7c3aed'/></linearGradient></defs><rect width='400' height='260' fill='url(#g)'/><text x='200' y='135' font-family='sans-serif' font-size='22' fill='white' text-anchor='middle' font-weight='700'>CÀO ĐỂ NHẬN QUÀ</text></svg>`,
  );

export default function ScratchCard({
  coverImage,
  rewardImage,
  rewardSubtitle,
  rewardSubtitleColor,
  rewardSubtitleFontSize,
  rewardSubtitleFontFamily,
  rewardText,
  rewardTextColor,
  rewardTextFontSize,
  rewardTextFontFamily,
  rewardIconBefore,
  rewardIconAfter,
  percent,
  width = 360,
  height = 240,
  onComplete,
  resetKey,
  dataOrigin,
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [completed, setCompleted] = useState(false);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const completedRef = useRef(false);
  const lastCheckRef = useRef(0);

  useEffect(() => {
    completedRef.current = false;
    setCompleted(false);
  }, [resetKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const drawCover = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";
      if (coverImage) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
        };
        img.onerror = () => {
          fillDefault(ctx);
        };
        img.src = coverImage;
      } else {
        fillDefault(ctx);
      }
    };

    const fillDefault = (c: CanvasRenderingContext2D) => {
      const grad = c.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#a78bfa");
      grad.addColorStop(1, "#7c3aed");
      c.fillStyle = grad;
      c.fillRect(0, 0, width, height);
      c.fillStyle = "rgba(255,255,255,0.95)";
      c.font = "bold 18px sans-serif";
      c.textAlign = "center";
      c.fillText("CÀO ĐỂ NHẬN QUÀ", width / 2, height / 2);
    };

    drawCover();
     
  }, [coverImage, width, height, resetKey]);

  const getPos = (e: PointerEvent | React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e as PointerEvent).clientX - rect.left) * (width / rect.width),
      y: ((e as PointerEvent).clientY - rect.top) * (height / rect.height),
    };
  };

  const scratch = (x: number, y: number) => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
    if (lastRef.current) {
      ctx.lineWidth = 44;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(lastRef.current.x, lastRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    lastRef.current = { x, y };
  };

  const checkPercent = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let cleared = 0;
    const step = 4 * 8; // sample
    let total = 0;
    for (let i = 3; i < data.length; i += step) {
      total++;
      if (data[i] === 0) cleared++;
    }
    const ratio = cleared / total;
    if (ratio >= percent / 100 && !completedRef.current) {
      completedRef.current = true;
      setCompleted(true);
      // fully clear
      ctx.clearRect(0, 0, width, height);
      onComplete?.();
    }
  };

  return (
    <div
      className="relative"
      style={{ width, maxWidth: "100%", aspectRatio: `${width} / ${height}` }}
      data-scratch-origin={dataOrigin ? "1" : undefined}
      onPointerDown={(e) => {
        // Allow starting a scratch from just outside the card and dragging in.
        drawingRef.current = true;
        lastRef.current = null;
        lastCheckRef.current = 0;
        const p = getPos(e);
        scratch(p.x, p.y);
      }}
    >
      {/* Expanded hit area so the pointer can start slightly outside the card */}
      <div
        className="absolute -inset-4 z-0"
        style={{ touchAction: "none", cursor: "grab" }}
      />
      <div
        className="relative overflow-hidden rounded-xl"
        style={{ width: "100%", height: "100%", background: "#f1f5f9" }}
      >
        {/* Reward layer */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center">
          {rewardImage ? (
            <img
              src={rewardImage}
              alt="reward"
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <>
              {rewardSubtitle && (
                <span
                  className="font-semibold"
                  style={{
                    color: rewardSubtitleColor,
                    fontSize: rewardSubtitleFontSize,
                    fontFamily: rewardSubtitleFontFamily,
                  }}
                >
                  {rewardSubtitle}
                </span>
              )}
              <div
                className="flex items-center justify-center gap-1.5 font-extrabold"
                style={{
                  color: rewardTextColor,
                  fontSize: rewardTextFontSize,
                  fontFamily: rewardTextFontFamily,
                  whiteSpace: "pre-wrap",
                }}
              >
                {rewardIconBefore && (
                  <span aria-hidden>{rewardIconBefore}</span>
                )}
                <span>{rewardText || "Phần thưởng"}</span>
                {rewardIconAfter && <span aria-hidden>{rewardIconAfter}</span>}
              </div>
            </>
          )}
        </div>
        {/* Scratch canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none cursor-grab active:cursor-grabbing"
          style={{ opacity: completed ? 0 : 1, transition: "opacity .4s" }}
          onPointerMove={(e) => {
            if (!drawingRef.current) return;
            const p = getPos(e);
            scratch(p.x, p.y);
            // Real-time percent check (throttled ~80ms) so the card completes
            // as soon as the threshold is reached, not only on pointer release.
            const now = performance.now();
            if (now - lastCheckRef.current > 80) {
              lastCheckRef.current = now;
              checkPercent();
            }
          }}
          onPointerUp={() => {
            drawingRef.current = false;
            checkPercent();
          }}
          onPointerLeave={() => {
            if (drawingRef.current) {
              // keep drawing — track on window so the stroke continues even
              // when the pointer leaves the canvas (e.g. came from outside).
              const move = (ev: PointerEvent) => {
                const p = getPos(ev);
                scratch(p.x, p.y);
                const now = performance.now();
                if (now - lastCheckRef.current > 80) {
                  lastCheckRef.current = now;
                  checkPercent();
                }
              };
              const up = () => {
                drawingRef.current = false;
                checkPercent();
                window.removeEventListener("pointermove", move);
                window.removeEventListener("pointerup", up);
              };
              window.addEventListener("pointermove", move);
              window.addEventListener("pointerup", up);
            }
          }}
        />
        {!coverImage && (
          <div className="pointer-events-none absolute bottom-1 left-1 rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-white">
            ảnh phủ mặc định
          </div>
        )}
      </div>
    </div>
  );
}
