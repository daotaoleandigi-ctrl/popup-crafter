import { getSupabaseConfig, json } from "../../../_lib/supabase.js";

export async function onRequestGet({ env, params }) {
  const id = String(params.id || "");
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(id)) {
    return json({ message: "Invalid popup ID" }, 400, {
      "Access-Control-Allow-Origin": "*",
    });
  }

  try {
    const { url, key } = getSupabaseConfig(env);
    const response = await fetch(`${url}/rest/v1/rpc/get_published_popup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ p_id: id }),
    });
    const body = await response.text();
    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=30, s-maxage=60",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return json({ message: "Popup unavailable" }, 503, {
      "Access-Control-Allow-Origin": "*",
    });
  }
}
