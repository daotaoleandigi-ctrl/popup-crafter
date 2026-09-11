(function () {
  "use strict";
  var me = document.currentScript;
  if (!me) return;
  var source = new URL(me.src);
  var id = source.searchParams.get("id");
  if (!id || !/^[A-Za-z0-9_-]{8,100}$/.test(id)) return;
  var anchor = document.createElement("span");
  me.parentNode.insertBefore(anchor, me);
  function visitorKey() {
    var key = "";
    try {
      key = localStorage.getItem("popup-crafter:visitor:" + id) || "";
      if (!key) {
        key = (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)).replace(/-/g, "_");
        localStorage.setItem("popup-crafter:visitor:" + id, key);
      }
    } catch (e) {
      key = (Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2));
    }
    return key;
  }
  function requestClaim(config) {
    return fetch(new URL("api/public/claims", source).href, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ popupId: id, visitorKey: visitorKey() }),
    }).then(function (response) {
      if (!response.ok) throw new Error("Claim unavailable");
      return response.json();
    }).then(function (claim) {
      if (!claim) return config;
      config.serverClaimId = claim.claimId;
      config.selectedVoucherId = claim.voucherId;
      config.voucherCode = claim.code || "";
      ["rewardText", "rewardSubtitle", "rewardImage", "rewardTextColor", "rewardSubtitleColor"].forEach(function (key) {
        if (claim[key] != null) config[key] = claim[key];
      });
      config.voucherRandomEnabled = false;
      return config;
    }).catch(function () { return config; });
  }
  fetch(new URL("api/public/popups/" + encodeURIComponent(id), source).href, {
    method: "GET",
    cache: "no-store",
  })
    .then(function (response) {
      if (!response.ok) throw new Error("Popup unavailable (HTTP " + response.status + ")");
      return response.json();
    })
    .then(function (config) {
      if (!config) {
        anchor.remove();
        console.warn("[Popup Crafter] Popup chưa được xuất bản hoặc không tồn tại.");
        return;
      }
      return requestClaim(config);
    })
    .then(function (config) {
      if (!config) return;
      var script = document.createElement("script");
      script.src = new URL("widget-runtime.js", source).href;
      script.dataset.config = btoa(
        unescape(encodeURIComponent(JSON.stringify(config))),
      );
      anchor.replaceWith(script);
    })
    .catch(function (error) {
      anchor.remove();
      console.warn("[Popup Crafter] Không tải được popup đã xuất bản.", error);
    });
})();
