/*!
 * Scratch Popup Widget — Shadow DOM isolated popup renderer
 * Embed: <script src="popup-widget.js" data-config="BASE64" async></script>
 * or:    <script src="popup-widget.js" data-id="POPUP_123" async></script>
 *        (requires window.__POPUP_CONFIGS__ = { POPUP_123: {...} })
 */
(function () {
  "use strict";

  function decodeConfig(str) {
    try {
      return JSON.parse(decodeURIComponent(escape(atob(str))));
    } catch (e) {
      try {
        return JSON.parse(atob(str));
      } catch (e2) {
        return null;
      }
    }
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildStyles(c, mode) {
    mode = mode || "popup";
    var radius = c.borderRadius || 16;
    var maxW = c.maxWidth || 880;
    var cb =
      c.closeStyle === "text"
        ? "padding:2px 8px;border-radius:6px;font-size:14px;font-weight:600;"
        : c.closeStyle === "square"
        ? "height:32px;width:32px;border-radius:6px;font-size:18px;display:flex;align-items:center;justify-content:center;font-weight:700;"
        : "height:32px;width:32px;border-radius:9999px;font-size:18px;display:flex;align-items:center;justify-content:center;font-weight:700;";
    var overlay =
      mode === "embed"
        ? ".pb-overlay{display:block}"
        : ".pb-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px;animation:pbFade .25s ease}";
    return (
      "<style>:host{all:initial}" +
      overlay +
      (mode === "popup" ? "@keyframes pbFade{from{opacity:0}to{opacity:1}}" : "") +
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
      cb +
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

  function buildMarkup(c, mode) {
    mode = mode || "popup";
    var banner = c.bannerImage
      ? '<img src="' + esc(c.bannerImage) + '" alt="Banner">'
      : '<div class="pb-banner-placeholder"><span style="font-size:30px">🎁</span><span style="font-size:14px;font-weight:600;opacity:.9">Banner</span></div>';

var iconBefore = c.rewardIconBefore ? esc(c.rewardIconBefore) : "";
    var iconAfter = c.rewardIconAfter ? esc(c.rewardIconAfter) : "";
    var subtitle = c.rewardSubtitle
      ? '<div class="pb-reward-subtitle">' +
        esc(c.rewardSubtitle).replace(/\n/g, "<br>") +
        "</div>"
      : "";
    var reward = c.rewardImage
      ? '<div class="pb-reward"><img src="' + esc(c.rewardImage) + '" alt="reward"></div>'
      : '<div class="pb-reward">' +
        subtitle +
        '<div class="pb-reward-text">' +
        (iconBefore ? '<span class="pb-ico">' + iconBefore + "</span>" : "") +
        "<span class='pb-reward-line'>" +
        esc(c.rewardText || "Phần thưởng").replace(/\n/g, "<br>") +
        "</span>" +
        (iconAfter ? '<span class="pb-ico">' + iconAfter + "</span>" : "") +
        "</div></div>";

    var formInner = c.formEmbedCode
      ? ""
      : '<div style="display:flex;height:100%;align-items:center;justify-content:center;text-align:center;font-size:12px;color:#94a3b8">Form sẽ hiển thị tại đây</div>';

    var closeBtn =
      mode === "popup"
        ? '<button class="pb-close" aria-label="Đóng">' +
          (c.closeStyle === "text" ? "Đóng ×" : "×") +
          "</button>"
        : "";

    var declineBtn =
      c.showDeclineButton === false
        ? ""
        : '<button class="pb-decline-btn">' +
          esc(c.declineButtonLabel || "Không, cảm ơn") +
          "</button>";

    return (
      '<div class="pb-overlay"><div class="pb-root">' +
      closeBtn +
      '<div class="pb-left" data-step="1"><canvas class="pb-confetti"></canvas>' +
      '<div class="pb-step pb-step-1"><h2 class="pb-title">' +
      esc(c.scratchTitle || "Cào quà ngay!") +
      '</h2><div class="pb-scratch-wrap">' +
      reward +
      '<canvas class="pb-scratch"></canvas></div><p class="pb-hint">' +
      esc(c.scratchHint || "Cào lên thẻ để mở quà") +
      '</p><div class="pb-claim"><button class="pb-claim-btn">' +
      esc(c.claimButtonLabel || "Nhận quà ngay!") +
      "</button>" +
      declineBtn +
      '</div></div>' +
      '<div class="pb-step pb-step-2" style="align-items:stretch"><h3 class="pb-form-title">' +
      esc(c.formTitle || "Điền thông tin để nhận quà") +
      '</h3><div class="pb-form-box">' +
      formInner +
      '</div></div>' +
      '<div class="pb-step pb-step-3"><div class="pb-thanks">' +
      '<div class="pb-thanks-badge">✓</div>' +
      '<h3 class="pb-thanks-title">' +
      esc(c.thanksTitle || "Chúc mừng bạn!") +
      '</h3><p class="pb-thanks-msg">' +
      esc(c.thanksMessage || "Phần quà đã được gửi về email của bạn.") +
      '</p><button class="pb-thanks-btn">' +
      esc(c.thanksButtonLabel || "Đóng") +
      '</button></div></div></div>' +
      '<div class="pb-right">' +
      banner +
      "</div></div></div>"
    );
  }

  function initScratch(canvas, surface, config, onComplete) {
    var W = (canvas.width = 300);
    var H = (canvas.height = 200);
    var ctx = canvas.getContext("2d");

    function fillDefault() {
      var g = ctx.createLinearGradient(0, 0, W, H);
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
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        ctx.drawImage(img, 0, 0, W, H);
      };
      img.onerror = fillDefault;
      img.src = config.scratchCoverImage;
    } else {
      fillDefault();
    }

    var drawing = false;
    var last = null;
    var lastCheck = 0;
    function rect(clientX, clientY) {
      var r = canvas.getBoundingClientRect();
      return {
        x: (clientX - r.left) * (W / r.width),
        y: (clientY - r.top) * (H / r.height),
      };
    }

    // Clamp to canvas bounds so dragging in from outside draws from the edge.
    function clamp(x, y) {
      return { x: Math.max(0, Math.min(W, x)), y: Math.max(0, Math.min(H, y)) };
    }

    function scratch(x, y) {
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
      last = { x: x, y: y };
    }

    function check() {
      try {
        var d = ctx.getImageData(0, 0, W, H).data;
        var cleared = 0,
          total = 0;
        for (var i = 3; i < d.length; i += 32) {
          total++;
          if (d[i] === 0) cleared++;
        }
        if (cleared / total >= (config.scratchPercent || 50) / 100)
          onComplete();
      } catch (e) {}
    }

    // pointerdown on the whole step surface so users can start scratching
    // from outside the card and drag in. move/up tracked on window.
    surface.addEventListener("pointerdown", function (e) {
      drawing = true;
      last = null;
      lastCheck = 0;
      var coords = rect(e.clientX, e.clientY);
      var p = clamp(coords.x, coords.y);
      scratch(p.x, p.y);
    });
    window.addEventListener("pointermove", function (e) {
      if (!drawing) return;
      var coords = rect(e.clientX, e.clientY);
      var p = clamp(coords.x, coords.y);
      scratch(p.x, p.y);
      // Real-time percent check (throttled ~80ms) so the popup advances as
      // soon as the threshold is reached, not only on pointer release.
      var now = performance.now();
      if (now - lastCheck > 80) {
        lastCheck = now;
        check();
      }
    });
    function end() {
      if (drawing) {
        drawing = false;
        check();
      }
    }
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }

  function fireConfetti(canvas, originEl) {
    if (!canvas) return;
    canvas.style.cssText =
      "position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483647;pointer-events:none;";
    document.body.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var W = (canvas.width = window.innerWidth);
    var H = (canvas.height = window.innerHeight);
    var ox = W / 2, oy = H / 2;
    if (originEl) {
      var r = originEl.getBoundingClientRect();
      ox = r.left + r.width / 2;
      oy = r.top + r.height / 2;
    }
    var colors = ["#7c3aed", "#a78bfa", "#fbbf24", "#f59e0b", "#ec4899", "#34d399"];
    var P = [];
    for (var i = 0; i < 140; i++) {
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
    var start = performance.now();
    function tick(t) {
      var el = t - start;
      ctx.clearRect(0, 0, W, H);
      P.forEach(function (p) {
        p.vy += 0.2;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        var life = Math.max(0, 1 - el / 1800);
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

  function watchForm(box, onDone) {
    if (!box) return function () {};
    var done = false;
    function fire() { if (!done) { done = true; onDone(); } }
    var armed = false;
    setTimeout(function () { armed = true; }, 1500);
    var iframes = box.querySelectorAll("iframe");
    if (iframes.length) {
      Array.prototype.forEach.call(iframes, function (f) {
        f.addEventListener("load", function () { if (armed) fire(); });
      });
    }
    var kw = /(thank|cảm ơn|cam on|success|thành công|thanh cong|đã gửi|da gui|submitted|complete|hoàn tất|hoan tat)/i;
    var ob = new MutationObserver(function () {
      var forms = box.querySelectorAll("form");
      if (!forms.length && kw.test(box.textContent || "")) fire();
    });
    ob.observe(box, { childList: true, subtree: true, characterData: true });
    return function () { ob.disconnect(); };
  }

  function mountPopup(config) {
    var host = document.createElement("div");
    host.id =
      "scratch-popup-" + (config.id || Math.random().toString(36).slice(2));
    host.style.cssText =
      "all:initial;position:fixed;inset:0;z-index:2147483647;";
    document.body.appendChild(host);

    var shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = buildStyles(config) + buildMarkup(config);

    var overlay = shadow.querySelector(".pb-overlay");
    var closeBtn = shadow.querySelector(".pb-close");
    var confettiCanvas = shadow.querySelector(".pb-confetti");
    var leftCol = shadow.querySelector(".pb-left");
    var scratchCanvas = shadow.querySelector(".pb-scratch");

    var step = 1;
    var autoCloseTimer = null;
    var completed = false;

    // --- Bubble (minimize-to-chat-widget) ---
    var bubbleEl = null;
    var useBubble =
      config.displayMode === "popup" && config.bubbleEnabled !== false;

    function createBubble() {
      if (!useBubble) return null;
      var b = document.createElement("div");
      b.className = "scratch-popup-bubble";
      var size = config.bubbleSize || 60;
      var isRight = config.bubblePosition === "bottom-right" || config.bubblePosition === "top-right";
      var isTop = config.bubblePosition === "top-left" || config.bubblePosition === "top-right";
      var pos = isRight ? "right" : "left";
      var vert = isTop ? "top" : "bottom";
      var label = config.bubbleText || "Nh\u1EADn qu\xE0";
      b.style.cssText =
        "position:fixed;z-index:2147483646;" + vert + ":24px;" +
        pos + ":24px;" +
        "cursor:pointer;" +
        "transition:transform .2s ease;" +
        "animation:pbBounceIn .35s ease;user-select:none;-webkit-user-select:none;";
      b.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;width:' +
        size + "px;height:" +
        size + 'px;border-radius:9999px;background:' + esc(config.bubbleBgColor || "#7c3aed") +
        ';color:' + esc(config.bubbleTextColor || "#fff") +
        ';font-size:' + Math.max(16, size * 0.32) + 'px;box-shadow:0 8px 28px -8px rgba(0,0,0,.4);">\u{1F381}</div>' +
        '<span class="pb-bubble-label" style="position:absolute;top:50%;' +
        (pos === "right" ? "right:100%;margin-right:8px;" : "left:100%;margin-left:8px;") +
        'transform:translateY(-50%) translateX(' + (pos === "right" ? "8px" : "-8px") +
        ');opacity:0;white-space:nowrap;background:' + esc(config.bubbleBgColor || "#7c3aed") +
        ';color:' + esc(config.bubbleTextColor || "#fff") +
';font-size:' + (config.bubbleFontSize || 14) + 'px;font-family:' + esc(config.bubbleFontFamily || config.fontFamily || "system-ui,sans-serif") + ';font-weight:600;padding:6px 14px;border-radius:9999px;box-shadow:0 8px 20px -6px rgba(0,0,0,.4);pointer-events:none;transition:opacity .25s ease,transform .25s ease;">' +
        esc(label) + "</span>";
      var labelEl = b.querySelector(".pb-bubble-label");
      function expand() {
        b.style.transform = "scale(1.06)";
        if (labelEl) {
          labelEl.style.opacity = "1";
          labelEl.style.transform = "translateY(-50%) translateX(0px)";
        }
      }
      function collapse() {
        b.style.transform = "";
        if (labelEl) {
          labelEl.style.opacity = "0";
          labelEl.style.transform = "translateY(-50%) translateX(" + (pos === "right" ? "8px" : "-8px") + ")";
        }
      }
      b.addEventListener("mouseenter", expand);
      b.addEventListener("mouseleave", collapse);
      b.addEventListener("focus", expand);
      b.addEventListener("blur", collapse);
      // Inject bounce keyframes once
      if (!document.getElementById("pb-bubble-styles")) {
        var s = document.createElement("style");
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
      host.style.display = "none";
    }

    function hideBubble() {
      if (bubbleEl && document.body.contains(bubbleEl)) {
        bubbleEl.remove();
      }
      host.style.display = "";
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
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) close();
      });
    }

    function setStep(s) {
      step = s;
      if (leftCol) leftCol.dataset.step = String(s);
      if (s === 3) {
        autoCloseTimer = setTimeout(close, 5000);
      }
    }

    if (scratchCanvas) {
      var step1 = shadow.querySelector(".pb-step-1");
      if (step1) {
        step1.style.touchAction = "none";
        step1.style.cursor = "grab";
      }
      initScratch(scratchCanvas, step1 || scratchCanvas, config, function () {
        if (completed) return;
        completed = true;
        fireConfetti(confettiCanvas, shadow.querySelector(".pb-scratch-wrap"));
        var ctx = scratchCanvas.getContext("2d");
        ctx.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);
        var claim = shadow.querySelector(".pb-claim");
        var hint = shadow.querySelector(".pb-hint");
        if (hint) hint.style.display = "none";
        if (claim) claim.style.display = "flex";
      });
    }

    var claimBtn = shadow.querySelector(".pb-claim-btn");
    var declineBtn = shadow.querySelector(".pb-decline-btn");
    if (claimBtn) claimBtn.addEventListener("click", function () { setStep(2); });
    if (declineBtn)
      declineBtn.addEventListener("click", function () {
        if (useBubble) showBubble();
        else close();
      });

    var thanksBtn = shadow.querySelector(".pb-thanks-btn");
    if (thanksBtn) thanksBtn.addEventListener("click", close);

    var onMessage = function (e) {
      var d = e.data;
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

    var formBox = shadow.querySelector(".pb-form-box");
    var formCleanup = function () {};
    if (formBox && config.formEmbedCode) {
      formBox.innerHTML = config.formEmbedCode;
      formBox.querySelectorAll("script").forEach(function (old) {
        var s = document.createElement("script");
        for (var i = 0; i < old.attributes.length; i++) {
          s.setAttribute(old.attributes[i].name, old.attributes[i].value);
        }
        s.textContent = old.textContent;
        old.replaceWith(s);
      });
      formCleanup = watchForm(formBox, function () {
        if (step === 2) setStep(3);
      });
    }

    // Bubble click -> reopen popup
    if (useBubble) {
      document.addEventListener(
        "click",
        function (e) {
          var t = e.target;
          if (t.closest && t.closest(".scratch-popup-bubble")) {
            hideBubble();
            setStep(1);
            completed = false;
            // Re-init scratch for fresh experience
            if (scratchCanvas) {
              var s1 = shadow.querySelector(".pb-step-1");
              initScratch(scratchCanvas, s1 || scratchCanvas, config, function () {
                if (completed) return;
                completed = true;
                fireConfetti(confettiCanvas, shadow.querySelector(".pb-scratch-wrap"));
                var cx = scratchCanvas.getContext("2d");
                cx.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);
                var cl = shadow.querySelector(".pb-claim");
                var hi = shadow.querySelector(".pb-hint");
                if (hi) hi.style.display = "none";
                if (cl) cl.style.display = "flex";
              });
            }
          }
        },
        true,
      );
    }

    return function () {
      window.removeEventListener("message", onMessage);
      formCleanup();
      host.remove();
      if (bubbleEl && document.body.contains(bubbleEl)) bubbleEl.remove();
      if (autoCloseTimer) clearTimeout(autoCloseTimer);
    };
  }

  // --- Inline (embed) mode --------------------------------------------------
  // Render the popup as a static section inside a given container — no overlay,
  // no close button, no auto-open. Cào -> form -> cảm ơn right in place.
  function mountInline(config, container) {
    var host = document.createElement("div");
    host.id =
      "scratch-inline-" + (config.id || Math.random().toString(36).slice(2));
    host.style.cssText = "all:initial;display:block;width:100%;";
    container.appendChild(host);

    var shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = buildStyles(config, "embed") + buildMarkup(config, "embed");

    var confettiCanvas = shadow.querySelector(".pb-confetti");
    var leftCol = shadow.querySelector(".pb-left");
    var scratchCanvas = shadow.querySelector(".pb-scratch");
    var step = 1;
    var completed = false;

    function setStep(s) {
      step = s;
      if (leftCol) leftCol.dataset.step = String(s);
    }

    if (scratchCanvas) {
      var step1 = shadow.querySelector(".pb-step-1");
      if (step1) {
        step1.style.touchAction = "none";
        step1.style.cursor = "grab";
      }
      initScratch(scratchCanvas, step1 || scratchCanvas, config, function () {
        if (completed) return;
        completed = true;
        fireConfetti(confettiCanvas, shadow.querySelector(".pb-scratch-wrap"));
        var ctx = scratchCanvas.getContext("2d");
        ctx.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);
        var claim = shadow.querySelector(".pb-claim");
        var hint = shadow.querySelector(".pb-hint");
        if (hint) hint.style.display = "none";
        if (claim) claim.style.display = "flex";
      });
    }

    var claimBtn2 = shadow.querySelector(".pb-claim-btn");
    if (claimBtn2) claimBtn2.addEventListener("click", function () { setStep(2); });

    var onMessage2 = function (e) {
      var d = e.data;
      if (!d) return;
      if (
        d.event === "form:submit" ||
        d.type === "ghl_form_submit" ||
        d.submitted === true
      ) {
        if (step === 2) setStep(3);
      }
    };
    window.addEventListener("message", onMessage2);

    var formBox2 = shadow.querySelector(".pb-form-box");
    if (formBox2 && config.formEmbedCode) {
      formBox2.innerHTML = config.formEmbedCode;
      formBox2.querySelectorAll("script").forEach(function (old) {
        var s = document.createElement("script");
        for (var i = 0; i < old.attributes.length; i++) {
          s.setAttribute(old.attributes[i].name, old.attributes[i].value);
        }
        s.textContent = old.textContent;
        old.replaceWith(s);
      });
    }

    return function () {
      window.removeEventListener("message", onMessage2);
      host.remove();
    };
  }

  // --- Bootstrap ------------------------------------------------------------
  // Respects config.displayMode:
  //   "popup" -> overlay auto-opens on load (after optional autoShowDelay), with
  //              bubble minimize + close button + click-outside-to-close. Also
  //              exposes window.ScratchPopup.open() + click delegation for
  //              .scratch-popup-trigger / [data-scratch-popup] manual triggers.
  //   "embed" -> inline section rendered at the script's location (no overlay).
  function loadConfigs() {
    var scripts = document.querySelectorAll(
      "script.popup-widget, script[data-popup-widget], script[data-config], script[data-id][src*='popup-widget']"
    );
    Array.prototype.forEach.call(scripts, function (script) {
      if (script.dataset.__pbInit) return;
      if (script.src && script.src.indexOf("popup-widget") === -1) return;
      script.dataset.__pbInit = "1";

      var config = null;
      if (script.dataset.config) {
        config = decodeConfig(script.dataset.config);
      } else if (script.dataset.id && window.__POPUP_CONFIGS__) {
        config = window.__POPUP_CONFIGS__[script.dataset.id];
      }
      if (!config) return;

      window.ScratchPopup = window.ScratchPopup || {};
      window.ScratchPopup.config = config;

      // Embed mode: render inline section at the script's location. No overlay,
      // no auto-open, no close.
      if (config.displayMode === "embed") {
        var container = script.parentElement || document.body;
        mountInline(config, container);
        return;
      }

      // Popup mode: auto-open overlay on load (with optional delay). Expose
      // open() so manual trigger elements still work.
      window.ScratchPopup.open = function () { mountPopup(config); };
      var delay = (config.autoShowDelay || 0) * 1000;
      function autoOpen() { mountPopup(config); }
      if (delay > 0) setTimeout(autoOpen, delay);
      else if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", autoOpen);
      else autoOpen();
    });
  }

  // Click delegation for manual trigger elements (works for dynamically added nodes).
  document.addEventListener("click", function (e) {
    var t = e.target;
    while (t && t !== document) {
      if (t.classList && t.classList.contains("scratch-popup-trigger")) {
        e.preventDefault();
        if (window.ScratchPopup && window.ScratchPopup.open)
          window.ScratchPopup.open();
        return;
      }
      if (t.dataset && typeof t.dataset.scratchPopup !== "undefined") {
        e.preventDefault();
        if (window.ScratchPopup && window.ScratchPopup.open)
          window.ScratchPopup.open();
        return;
      }
      t = t.parentNode;
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadConfigs);
  } else {
    loadConfigs();
  }
})();
