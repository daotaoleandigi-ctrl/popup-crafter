(function () {
  "use strict";
  var me = document.currentScript;
  if (!me) return;
  var source = new URL(me.src);
  var project = source.searchParams.get("project");
  var key = source.searchParams.get("key");
  var id = source.searchParams.get("id");
  if (!project || !key || !id || !/^[A-Za-z0-9_-]{8,100}$/.test(id)) return;
  var anchor = document.createElement("span");
  me.parentNode.insertBefore(anchor, me);
  fetch(project.replace(/\/$/, "") + "/rest/v1/rpc/get_published_popup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: "Bearer " + key,
    },
    body: JSON.stringify({ p_id: id }),
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
