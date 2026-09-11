import { getSupabaseConfig, json } from "../../_lib/supabase.js";

function read(input, keys) {
  for (const key of keys) if (input?.[key] != null) return String(input[key]);
  return "";
}

export async function onRequestPost({ request, env }) {
  const supplied = request.headers.get("X-Popup-Crafter-Secret") || "";
  if (!env.GHL_WEBHOOK_SECRET || supplied !== env.GHL_WEBHOOK_SECRET) {
    return json({ message: "Unauthorized" }, 401);
  }
  try {
    const input = await request.json();
    const claimId = read(input, ["claim_id", "popup_claim_id", "Popup Claim ID"]);
    if (!/^[0-9a-f-]{36}$/i.test(claimId)) return json({ message: "Invalid claim ID" }, 400);
    const { url, key } = getSupabaseConfig(env);
    const response = await fetch(`${url}/rest/v1/rpc/confirm_voucher_claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        p_claim_id: claimId,
        p_contact_id: read(input, ["contact_id", "contactId", "id"]),
        p_email: read(input, ["email"]),
        p_phone: read(input, ["phone"]),
      }),
    });
    const body = await response.text();
    return new Response(body, { status: response.status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return json({ message: "Unable to confirm voucher claim" }, 503);
  }
}
