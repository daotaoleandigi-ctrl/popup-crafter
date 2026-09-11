(function () {
  "use strict";
  var script = document.currentScript;
  var params = new URLSearchParams(window.location.search);
  var mappings = {
    claimField: "popup_claim_id",
    voucherField: "popup_voucher_name",
    codeField: "popup_voucher_code",
    campaignField: "popup_campaign",
  };
  function setField(id, value) {
    if (!id || !value) return;
    var field = document.getElementsByName(id)[0] || document.getElementById(id);
    if (!field) return;
    field.value = value;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function populate() {
    Object.keys(mappings).forEach(function (key) {
      setField(script && script.dataset[key], params.get(mappings[key]));
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", populate);
  else populate();
  setTimeout(populate, 750);
})();
