import type { PopupConfig } from "@/types";

/**
 * Shared popup-widget runtime — used by the /demo page (inline).
 * Renders a Shadow-DOM-isolated scratch popup from a PopupConfig.
 *
 * NOTE: This module is the React-app version used only by the /demo preview.
 * The production embed code uses the self-contained WIDGET_RUNTIME string
 * (src/lib/widget-runtime.ts) which is inlined into the <script> tag.
 */

function decodeConfig(str: string): PopupConfig | null {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(str))));
  } catch {
    try {
      return JSON.parse(atob(str));
    } catch {
      return null;
    }
  }
}

function esc(s: unknown): string {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildStyles(
  c: PopupConfig,
  mode: "popup" | "embed" = "popup",
): string {
  const radius = c.borderRadius ?? 16;
  const maxW = c.maxWidth ?? 880;
  const closeBase =
    c.closeStyle === "text"
      ? "padding:2px 8px;border-radius:6px;font-size:14px;font-weight:600;"
      : c.closeStyle === "square"
        ? "height:32px;width:32px;border-radius:6px;font-size:18px;display:flex;align-items:center;justify-content:center;font-weight:700;"
        : "height:32px;width:32px;border-radius:9999px;font-size:18px;display:flex;align-items:center;justify-content:center;font-weight:700;";
  const overlayStyle =
    mode === "embed"
      ? ".pb-overlay{display:block}"
      : ".pb-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px;animation:pbFade .25s ease}";
  return (
    "<style>" +
    ":host{all:initial}" +
    overlayStyle +
    (mode === "popup"
      ? "@keyframes pbFade{from{opacity:0}to{opacity:1}}"
      : "") +
    "@keyframes pbPop{from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}}" +
    ".pb-root{position:relative;width:100%;max-width:" +
    maxW +
    "px;background:" +
    esc(c.bgColor || "#fff") +
    ";border-radius:" +
    radius +
    "px;overflow:hidden;box-shadow:0 25px 60px -15px rgba(0,0,0,.5);font-family:" +
    esc(c.fontFamily || "system-ui,sans-serif") +
    ";display:grid;grid-template-columns:1fr 1fr;min-height:420px;animation:pbPop .3s ease}" +
    ".pb-close{position:absolute;top:12px;right:12px;z-index:30;cursor:pointer;border:0;color:" +
    esc(c.closeColor || "#fff") +
    ";background:" +
    esc(c.closeBgColor || "rgba(0,0,0,.45)") +
    ";" +
    closeBase +
    "}" +
    ".pb-close:hover{opacity:.8}" +
    ".pb-left{position:relative;display:flex;flex-direction:column;padding:24px}" +
    ".pb-right{position:relative;overflow:hidden;background:#f1f5f9;min-height:420px}" +
    ".pb-right img{width:100%;height:100%;object-fit:" +
    esc(c.bannerFit || "cover") +
    ";object-position:" +
    esc(c.bannerPosition || "center") +
    "}" +
    ".pb-banner-placeholder{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#fff;background:linear-gradient(135deg,#7c3aed,#a78bfa);text-align:center;padding:24px}" +
    ".pb-step{display:none;flex-direction:column;flex:1;align-items:center;justify-content:center;gap:16px}" +
    ".pb-left[data-step='1'] .pb-step-1,.pb-left[data-step='2'] .pb-step-2,.pb-left[data-step='3'] .pb-step-3{display:flex}" +
    ".pb-title{font-size:20px;font-weight:800;text-align:center;margin:0;color:" +
    esc(c.scratchTitleColor || "#1e293b") +
    "}" +
    ".pb-hint{font-size:12px;color:#64748b;text-align:center;max-width:280px;margin:0}" +
    ".pb-claim{display:none;flex-direction:column;align-items:center;gap:8px}" +
    ".pb-claim-btn{border:0;cursor:pointer;border-radius:12px;padding:12px 28px;font-size:15px;font-weight:700;color:" +
    esc(c.claimButtonTextColor || "#fff") +
    ";background:" +
    (c.claimButtonGradient
      ? "linear-gradient(135deg," +
        esc(c.claimButtonColor || "#7c3aed") +
        "," +
        esc(c.claimButtonColor2 || "#a78bfa") +
        ")"
      : esc(c.claimButtonColor || "#7c3aed")) +
    ";box-shadow:0 8px 16px -4px rgba(0,0,0,.25)}" +
    ".pb-claim-btn:hover{opacity:.92}" +
    ".pb-decline-btn{border:0;background:transparent;cursor:pointer;font-size:12px;color:#64748b;text-decoration:underline;text-underline-offset:2px}" +
    ".pb-decline-btn:hover{color:#1e293b}" +
    ".pb-scratch-wrap{position:relative;width:300px;height:200px;border-radius:12px;overflow:hidden;background:#f1f5f9}" +
    ".pb-reward{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:0 16px;text-align:center}" +
    ".pb-reward img{width:100%;height:100%;object-fit:cover}" +
    ".pb-reward-subtitle{font-weight:600;color:" +
    esc(c.rewardSubtitleColor || "#64748b") +
    ";font-size:" +
    (c.rewardSubtitleFontSize || 13) +
    "px;font-family:" +
    esc(c.rewardSubtitleFontFamily || "system-ui,sans-serif") +
    "}" +
    ".pb-reward-text{font-size:" +
    (c.rewardTextFontSize || 18) +
    "px;font-weight:800;color:" +
    esc(c.rewardTextColor || "#0f172a") +
    ";font-family:" +
    esc(c.rewardTextFontFamily || "system-ui,sans-serif") +
    ";display:flex;align-items:center;justify-content:center;gap:6px}" +
    ".pb-reward-line{white-space:pre-wrap;line-height:1.3}" +
    ".pb-ico{line-height:1}" +
    ".pb-scratch{position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:grab}" +
    ".pb-form-title{font-size:16px;font-weight:700;margin:0 0 12px;color:" +
    esc(c.scratchTitleColor || "#1e293b") +
    "}" +
    ".pb-form-box{flex:1;overflow:auto;padding:8px;min-height:240px}" +
    ".pb-thanks{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center}" +
    ".pb-thanks-badge{height:56px;width:56px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-size:24px;color:#fff;background:linear-gradient(135deg,#fbbf24,#7c3aed);box-shadow:0 10px 20px -5px rgba(0,0,0,.3)}" +
    ".pb-thanks-title{font-size:20px;font-weight:800;margin:0;color:" +
    esc(c.thanksTextColor || "#0f172a") +
    ";font-family:" +
    esc(c.thanksFontFamily || "system-ui,sans-serif") +
    "}" +
    ".pb-thanks-msg{font-size:14px;margin:0;max-width:260px;color:" +
    esc(c.thanksTextColor || "#0f172a") +
    ";font-family:" +
    esc(c.thanksFontFamily || "system-ui,sans-serif") +
    "}" +
    ".pb-thanks-btn{margin-top:8px;border:0;cursor:pointer;border-radius:12px;padding:10px 20px;font-size:14px;font-weight:600;color:#fff;background:linear-gradient(135deg,#7c3aed,#a78bfa);box-shadow:0 8px 16px -4px rgba(124,58,237,.5);font-family:" +
    esc(c.thanksFontFamily || "system-ui,sans-serif") +
    "}" +
    ".pb-confetti{position:absolute;inset:0;pointer-events:none;z-index:50}" +
    "@media(max-width:640px){.pb-root{grid-template-columns:1fr}.pb-right{min-height:160px;height:160px}.pb-scratch-wrap{width:260px;height:170px}}" +
    "</style>"
  );
}

function buildMarkup(
  c: PopupConfig,
  mode: "popup" | "embed" = "popup",
): string {
  const banner = c.bannerImage
    ? '<img src="' + esc(c.bannerImage) + '" alt="Banner">'
    : '<div class="pb-banner-placeholder"><span style="font-size:30px">🎁</span><span style="font-size:14px;font-weight:600;opacity:.9">Banner</span></div>';

  const iconBefore = c.rewardIconBefore ? esc(c.rewardIconBefore) : "";
  const iconAfter = c.rewardIconAfter ? esc(c.rewardIconAfter) : "";
  const subtitle = c.rewardSubtitle
    ? '<div class="pb-reward-subtitle">' +
      esc(c.rewardSubtitle).replace(/\n/g, "<br>") +
      "</div>"
    : "";
  const reward = c.rewardImage
    ? '<div class="pb-reward"><img src="' +
      esc(c.rewardImage) +
      '" alt="reward"></div>'
    : '<div class="pb-reward">' +
      subtitle +
      '<div class="pb-reward-text">' +
      (iconBefore ? '<span class="pb-ico">' + iconBefore + "</span>" : "") +
      "<span class='pb-reward-line'>" +
      esc(c.rewardText || "Phần thưởng").replace(/\n/g, "<br>") +
      "</span>" +
      (iconAfter ? '<span class="pb-ico">' + iconAfter + "</span>" : "") +
      "</div></div>";

  const formInner = c.formEmbedCode
    ? ""
    : '<div style="display:flex;height:100%;align-items:center;justify-content:center;text-align:center;font-size:12px;color:#94a3b8">Form sẽ hiển thị tại đây</div>';

  const closeBtn =
    mode === "popup"
      ? '<button class="pb-close" aria-label="Đóng">' +
        (c.closeStyle === "text" ? "Đóng ×" : "×") +
        "</button>"
      : "";

  const declineBtn =
    c.showDeclineButton === false
      ? ""
      : '<button class="pb-decline-btn">' +
        esc(c.declineButtonLabel || "Không, cảm ơn") +
        "</button>";

  return (
    '<div class="pb-overlay">' +
    '<div class="pb-root">' +
    closeBtn +
    '<div class="pb-left" data-step="1">' +
    '<canvas class="pb-confetti"></canvas>' +
    '<div class="pb-step pb-step-1">' +
    '<h2 class="pb-title">' +
    esc(c.scratchTitle || "Cào quà ngay!") +
    "</h2>" +
    '<div class="pb-scratch-wrap">' +
    reward +
    '<canvas class="pb-scratch"></canvas></div>' +
    '<p class="pb-hint">' +
    esc(c.scratchHint || "Cào lên thẻ để mở quà") +
    "</p>" +
    '<div class="pb-claim">' +
    '<button class="pb-claim-btn">' +
    esc(c.claimButtonLabel || "Nhận quà ngay!") +
    "</button>" +
    declineBtn +
    "</div>" +
    "</div>" +
    '<div class="pb-step pb-step-2" style="align-items:stretch">' +
    '<h3 class="pb-form-title">' +
    esc(c.formTitle || "Điền thông tin để nhận quà") +
    "</h3>" +
    '<div class="pb-form-box">' +
    formInner +
    "</div>" +
    "</div>" +
    '<div class="pb-step pb-step-3">' +
    '<div class="pb-thanks">' +
    '<div class="pb-thanks-badge">✓</div>' +
    '<h3 class="pb-thanks-title">' +
    esc(c.thanksTitle || "Chúc mừng bạn!") +
    "</h3>" +
    '<p class="pb-thanks-msg">' +
    esc(c.thanksMessage || "Phần quà đã được gửi về email của bạn.") +
    "</p>" +
    '<button class="pb-thanks-btn">' +
    esc(c.thanksButtonLabel || "Đóng") +
    "</button>" +
    "</div></div>" +
    "</div>" +
    '<div class="pb-right">' +
    banner +
    "</div>" +
    "</div></div>"
  );
}

function initScratch(
  canvas: HTMLCanvasElement,
  surface: HTMLElement,
  config: PopupConfig,
  onComplete: () => void,
) {
  const W = (canvas.width = 300);
  const H = (canvas.height = 200);
  const ctx = canvas.getContext("2d")!;

  function fillDefault() {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#a78bfa");
    g.addColorStop(1, "#7c3aed");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CÀO ĐỂ NHẬN QUÀ", W / 2, H / 2);
  }

  if (config.scratchCoverImage) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => ctx.drawImage(img, 0, 0, W, H);
    img.onerror = fillDefault;
    img.src = config.scratchCoverImage;
  } else {
    fillDefault();
  }

  let drawing = false;
  let last: { x: number; y: number } | null = null;
  const rect = (clientX: number, clientY: number) => {
    const r = canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) * (W / r.width),
      y: (clientY - r.top) * (H / r.height),
    };
  };

  const clamp = (x: number, y: number) => ({
    x: Math.max(0, Math.min(W, x)),
    y: Math.max(0, Math.min(H, y)),
  });

  function scratch(x: number, y: number) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    if (last) {
      ctx.lineWidth = 40;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    last = { x, y };
  }

  let lastCheck = 0;
  function check() {
    try {
      const d = ctx.getImageData(0, 0, W, H).data;
      let cleared = 0;
      let total = 0;
      for (let i = 3; i < d.length; i += 32) {
        total++;
        if (d[i] === 0) cleared++;
      }
      if (cleared / total >= (config.scratchPercent || 50) / 100) onComplete();
    } catch {
      /* tainted canvas */
    }
  }

  surface.addEventListener("pointerdown", (e) => {
    drawing = true;
    last = null;
    lastCheck = 0;
    const coords = rect(e.clientX, e.clientY);
    const p = clamp(coords.x, coords.y);
    scratch(p.x, p.y);
  });
  window.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    const coords = rect(e.clientX, e.clientY);
    const p = clamp(coords.x, coords.y);
    scratch(p.x, p.y);
    const now = performance.now();
    if (now - lastCheck > 80) {
      lastCheck = now;
      check();
    }
  });
  const end = () => {
    if (drawing) {
      drawing = false;
      check();
    }
  };
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);
}

function fireConfetti(
  canvas: HTMLCanvasElement | null,
  originEl?: Element | null,
) {
  if (!canvas) return;
  // Promote the confetti canvas to a fixed, full-viewport layer so the burst
  // is never clipped by the popup's overflow:hidden / rounded corners.
  canvas.style.cssText =
    "position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483647;pointer-events:none;";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d")!;
  const W = (canvas.width = window.innerWidth);
  const H = (canvas.height = window.innerHeight);

  // Burst origin = scratch card center (viewport coords), else center screen.
  let ox = W / 2;
  let oy = H / 2;
  if (originEl) {
    const r = (originEl as HTMLElement).getBoundingClientRect();
    ox = r.left + r.width / 2;
    oy = r.top + r.height / 2;
  }

  const colors = [
    "#7c3aed",
    "#a78bfa",
    "#fbbf24",
    "#f59e0b",
    "#ec4899",
    "#34d399",
  ];
  const P: Array<{
    x: number;
    y: number;
    r: number;
    c: string;
    vx: number;
    vy: number;
    rot: number;
    vr: number;
  }> = [];
  for (let i = 0; i < 140; i++) {
    P.push({
      x: ox + (Math.random() - 0.5) * 60,
      y: oy + (Math.random() - 0.5) * 30,
      r: 4 + Math.random() * 6,
      c: colors[(Math.random() * colors.length) | 0],
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 9 - 4,
      rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.3,
    });
  }
  const start = performance.now();
  function tick(t: number) {
    const el = t - start;
    ctx.clearRect(0, 0, W, H);
    P.forEach((p) => {
      p.vy += 0.2;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      const life = Math.max(0, 1 - el / 1800);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = life;
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      ctx.restore();
    });
    if (el < 1900) requestAnimationFrame(tick);
    else {
      ctx.clearRect(0, 0, W, H);
      canvas.remove();
    }
  }
  requestAnimationFrame(tick);
}

export function mountPopup(config: PopupConfig): () => void {
  const host = document.createElement("div");
  host.id =
    "scratch-popup-" + (config.id || Math.random().toString(36).slice(2));
  host.style.cssText = "all:initial;position:fixed;inset:0;z-index:2147483647;";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = buildStyles(config) + buildMarkup(config, "popup");

  const overlay = shadow.querySelector(".pb-overlay") as HTMLElement | null;
  const closeBtn = shadow.querySelector(
    ".pb-close",
  ) as HTMLButtonElement | null;
  const confettiCanvas = shadow.querySelector(
    ".pb-confetti",
  ) as HTMLCanvasElement | null;
  const leftCol = shadow.querySelector(".pb-left") as HTMLElement | null;
  const scratchCanvas = shadow.querySelector(
    ".pb-scratch",
  ) as HTMLCanvasElement | null;

  const scratchStateKey = `popup-crafter-scratched:${config.id || "default"}`;
  const readScratchState = () => {
    try {
      return window.sessionStorage.getItem(scratchStateKey) === "1";
    } catch {
      return false;
    }
  };
  const saveScratchState = () => {
    try {
      window.sessionStorage.setItem(scratchStateKey, "1");
    } catch {
      // The in-memory state still works when storage is unavailable.
    }
  };

  let step = 1;
  let autoCloseTimer: number | null = null;
  let completed = readScratchState();

  // Bubble element (lives OUTSIDE shadow so it can be positioned freely)
  let bubbleEl: HTMLElement | null = null;
  const useBubble =
    config.displayMode === "popup" && config.bubbleEnabled !== false;

  function createBubble() {
    if (!useBubble) return null;
    const b = document.createElement("div");
    b.className = "scratch-popup-bubble";
    const size = config.bubbleSize ?? 60;
    const isRight =
      config.bubblePosition === "bottom-right" ||
      config.bubblePosition === "top-right";
    const isTop =
      config.bubblePosition === "top-left" ||
      config.bubblePosition === "top-right";
    const pos = isRight ? "right" : "left";
    const vert = isTop ? "top" : "bottom";
    const label = config.bubbleText || "Nhận quà";
    b.style.cssText =
      `position:fixed;z-index:2147483646;${vert}:24px;${pos}:24px;` +
      `cursor:pointer;` +
      `transition:transform .2s ease;` +
      `animation:pbBounceIn .35s ease;user-select:none;-webkit-user-select:none;`;
    b.innerHTML =
      `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:${esc(config.bubbleBgColor || "#7c3aed")};color:${esc(config.bubbleTextColor || "#fff")};font-size:${Math.max(16, size * 0.32)}px;box-shadow:0 8px 28px -8px rgba(0,0,0,.4);">🎁</div>` +
      `<span class="pb-bubble-label" style="position:absolute;top:50%;${pos === "right" ? "right:100%;margin-right:8px;" : "left:100%;margin-left:8px;"}transform:translateY(-50%) translateX(${pos === "right" ? "8px" : "-8px"});opacity:0;white-space:nowrap;background:${esc(config.bubbleBgColor || "#7c3aed")};color:${esc(config.bubbleTextColor || "#fff")};font-size:${config.bubbleFontSize ?? 14}px;font-family:${esc(config.bubbleFontFamily || config.fontFamily || "system-ui,sans-serif")};font-weight:600;padding:6px 14px;border-radius:9999px;box-shadow:0 8px 20px -6px rgba(0,0,0,.4);pointer-events:none;transition:opacity .25s ease,transform .25s ease;">${esc(label)}</span>`;
    const labelEl = b.querySelector(".pb-bubble-label") as HTMLElement | null;
    const expand = () => {
      b.style.transform = "scale(1.06)";
      if (labelEl) {
        labelEl.style.opacity = "1";
        labelEl.style.transform = `translateY(-50%) translateX(0px)`;
      }
    };
    const collapse = () => {
      b.style.transform = "";
      if (labelEl) {
        labelEl.style.opacity = "0";
        labelEl.style.transform = `translateY(-50%) translateX(${pos === "right" ? "8px" : "-8px"})`;
      }
    };
    b.addEventListener("mouseenter", expand);
    b.addEventListener("mouseleave", collapse);
    b.addEventListener("focus", expand);
    b.addEventListener("blur", collapse);
    // Inject bounce keyframes if not already in document
    if (!document.getElementById("pb-bubble-styles")) {
      const s = document.createElement("style");
      s.id = "pb-bubble-styles";
      s.textContent =
        "@keyframes pbBounceIn{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}";
      document.head.appendChild(s);
    }
    return b;
  }

  function showBubble() {
    if (!bubbleEl) bubbleEl = createBubble();
    if (bubbleEl && !document.body.contains(bubbleEl)) {
      document.body.appendChild(bubbleEl);
    }
    // Hide popup overlay
    if (host) host.style.display = "none";
  }

  function hideBubble() {
    if (bubbleEl && document.body.contains(bubbleEl)) {
      bubbleEl.remove();
    }
    // Show popup
    if (host) host.style.display = "";
  }

  function close() {
    if (useBubble) {
      showBubble();
    } else {
      host.remove();
    }
    if (autoCloseTimer) clearTimeout(autoCloseTimer);
  }

  if (closeBtn) closeBtn.addEventListener("click", close);
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
  }

  function setStep(s: number) {
    step = s;
    if (leftCol) leftCol.dataset.step = String(s);
    if (s === 3) {
      autoCloseTimer = window.setTimeout(close, 5000);
    }
  }

  if (scratchCanvas && completed) {
    scratchCanvas.style.display = "none";
    const claim = shadow.querySelector(".pb-claim") as HTMLElement | null;
    const hint = shadow.querySelector(".pb-hint") as HTMLElement | null;
    if (hint) hint.style.display = "none";
    if (claim) claim.style.display = "flex";
  } else if (scratchCanvas) {
    const step1 = shadow.querySelector(".pb-step-1") as HTMLElement | null;
    if (step1) {
      step1.style.touchAction = "none";
      step1.style.cursor = "grab";
    }
    initScratch(scratchCanvas, step1 || scratchCanvas, config, () => {
      if (completed) return;
      completed = true;
      saveScratchState();
      fireConfetti(confettiCanvas, shadow.querySelector(".pb-scratch-wrap"));
      const ctx = scratchCanvas.getContext("2d")!;
      ctx.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);
      const claim = shadow.querySelector(".pb-claim") as HTMLElement | null;
      const hint = shadow.querySelector(".pb-hint") as HTMLElement | null;
      if (hint) (hint as HTMLElement).style.display = "none";
      if (claim) claim.style.display = "flex";
    });
  }

  const claimBtn = shadow.querySelector(".pb-claim-btn");
  const declineBtn = shadow.querySelector(".pb-decline-btn");
  if (claimBtn) claimBtn.addEventListener("click", () => setStep(2));
  if (declineBtn)
    declineBtn.addEventListener("click", () => {
      if (useBubble) showBubble();
      else close();
    });

  const thanksBtn = shadow.querySelector(".pb-thanks-btn");
  if (thanksBtn) thanksBtn.addEventListener("click", close);

  const onMessage = (e: MessageEvent) => {
    const d = e.data;
    if (!d) return;
    if (
      d.event === "form:submit" ||
      d.type === "ghl_form_submit" ||
      d.submitted === true
    ) {
      if (step === 2) setStep(3);
    }
  };
  window.addEventListener("message", onMessage);

  const formBox = shadow.querySelector(".pb-form-box");
  if (formBox && config.formEmbedCode) {
    formBox.innerHTML = config.formEmbedCode;
    formBox.querySelectorAll("script").forEach((old) => {
      const s = document.createElement("script");
      for (let i = 0; i < old.attributes.length; i++) {
        s.setAttribute(old.attributes[i].name, old.attributes[i].value);
      }
      s.textContent = old.textContent;
      old.replaceWith(s);
    });
  }

  // Bubble click -> reopen
  if (useBubble) {
    document.addEventListener(
      "click",
      (e) => {
        const t = e.target as HTMLElement;
        if (t.closest && t.closest(".scratch-popup-bubble")) {
          hideBubble();
          setStep(1);
        }
      },
      true,
    );
  }

  return () => {
    window.removeEventListener("message", onMessage);
    host.remove();
    if (bubbleEl && document.body.contains(bubbleEl)) bubbleEl.remove();
    if (autoCloseTimer) clearTimeout(autoCloseTimer);
  };
}

/**
 * Inline (embed) mode: render the popup as a static section inside a given
 * container — no overlay, no close button, no auto-open. The user cào →
 * form → cảm ơn right in place.
 */
export function mountInline(
  config: PopupConfig,
  container: HTMLElement,
): () => void {
  const host = document.createElement("div");
  host.id =
    "scratch-inline-" + (config.id || Math.random().toString(36).slice(2));
  host.style.cssText = "all:initial;display:block;width:100%;";
  container.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML =
    buildStyles(config, "embed") + buildMarkup(config, "embed");

  const confettiCanvas = shadow.querySelector(
    ".pb-confetti",
  ) as HTMLCanvasElement | null;
  const leftCol = shadow.querySelector(".pb-left") as HTMLElement | null;
  const scratchCanvas = shadow.querySelector(
    ".pb-scratch",
  ) as HTMLCanvasElement | null;

  let step = 1;
  let completed = false;

  function setStep(s: number) {
    step = s;
    if (leftCol) leftCol.dataset.step = String(s);
  }

  if (scratchCanvas) {
    const step1 = shadow.querySelector(".pb-step-1") as HTMLElement | null;
    if (step1) {
      step1.style.touchAction = "none";
      step1.style.cursor = "grab";
    }
    initScratch(scratchCanvas, step1 || scratchCanvas, config, () => {
      if (completed) return;
      completed = true;
      fireConfetti(confettiCanvas, shadow.querySelector(".pb-scratch-wrap"));
      const ctx = scratchCanvas.getContext("2d")!;
      ctx.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);
      const claim = shadow.querySelector(".pb-claim") as HTMLElement | null;
      const hint = shadow.querySelector(".pb-hint") as HTMLElement | null;
      if (hint) (hint as HTMLElement).style.display = "none";
      if (claim) claim.style.display = "flex";
    });
  }

  const claimBtn = shadow.querySelector(".pb-claim-btn");
  if (claimBtn) claimBtn.addEventListener("click", () => setStep(2));

  const onMessage = (e: MessageEvent) => {
    const d = e.data;
    if (!d) return;
    if (
      d.event === "form:submit" ||
      d.type === "ghl_form_submit" ||
      d.submitted === true
    ) {
      if (step === 2) setStep(3);
    }
  };
  window.addEventListener("message", onMessage);

  const formBox = shadow.querySelector(".pb-form-box");
  if (formBox && config.formEmbedCode) {
    formBox.innerHTML = config.formEmbedCode;
    formBox.querySelectorAll("script").forEach((old) => {
      const s = document.createElement("script");
      for (let i = 0; i < old.attributes.length; i++) {
        s.setAttribute(old.attributes[i].name, old.attributes[i].value);
      }
      s.textContent = old.textContent;
      old.replaceWith(s);
    });
  }

  return () => {
    window.removeEventListener("message", onMessage);
    host.remove();
  };
}
declare global {
  interface Window {
    ScratchPopup?: {
      open?: () => void;
      config?: PopupConfig;
    };
  }
}

/**
 * Bootstrap helper used by the /demo preview page.
 * Mirrors the embed runtime: exposes window.ScratchPopup.open(), click
 * delegation for .scratch-popup-trigger / [data-scratch-popup], and optional
 * auto-show on load (with delay + once-per-session via sessionStorage).
 */
export function bootstrapPopup(config: PopupConfig): () => void {
  window.ScratchPopup = window.ScratchPopup || {};
  window.ScratchPopup.config = config;

  // Popup mode: auto-open overlay on page load (with optional delay).
  // Exposes open() so manual triggers still work.
  if (config.displayMode === "popup") {
    window.ScratchPopup.open = () => mountPopup(config);

    const onClick = (e: MouseEvent) => {
      let t = e.target as HTMLElement | null;
      while (t && t instanceof HTMLElement) {
        if (t.classList && t.classList.contains("scratch-popup-trigger")) {
          e.preventDefault();
          window.ScratchPopup?.open?.();
          return;
        }
        if (t.dataset && typeof t.dataset.scratchPopup !== "undefined") {
          e.preventDefault();
          window.ScratchPopup?.open?.();
          return;
        }
        t = t.parentElement;
      }
    };
    document.addEventListener("click", onClick);

    let autoTimer: number | null = null;
    const autoOpen = () => mountPopup(config);
    const delay = (config.autoShowDelay || 0) * 1000;
    if (delay > 0) {
      autoTimer = window.setTimeout(autoOpen, delay);
    } else if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", autoOpen);
    } else {
      autoOpen();
    }

    return () => {
      document.removeEventListener("click", onClick);
      if (autoTimer) clearTimeout(autoTimer);
    };
  }

  // Embed mode: render inline section at the script's location. No overlay,
  // no auto-open, no close.
  const me = document.currentScript as HTMLScriptElement | null;
  const container = me?.parentElement || document.body;
  const cleanup = mountInline(config, container);
  return cleanup;
}

export function decodePopupConfig(str: string): PopupConfig | null {
  return decodeConfig(str);
}
