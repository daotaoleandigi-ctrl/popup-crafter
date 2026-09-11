import { getSupabaseConfig, json } from "../../_lib/supabase.js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestPost({ request, env }) {
  try {
    const input = await request.json();
    const popupId = String(input?.popupId || "");
    const visitorKey = String(input?.visitorKey || "");
    if (!/^[A-Za-z0-9_-]{8,100}$/.test(popupId) || !/^[A-Za-z0-9_-]{16,100}$/.test(visitorKey)) {
      return json({ message: "Invalid claim request" }, 400, cors);
    }
    const { url, key } = getSupabaseConfig(env);
    const response = await fetch(`${url}/rest/v1/rpc/create_voucher_claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
      body: JSON.stringify({ p_popup_id: popupId, p_visitor_key: visitorKey }),
    });
    const body = await response.text();
    return new Response(body, { status: response.status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return json({ message: "Unable to create voucher claim" }, 503, cors);
  }
}
