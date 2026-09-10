export const browserKey = "popup-crafter-browser";

export function json(value, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

export function getSupabaseConfig(env) {
  const url = String(env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = String(env.SUPABASE_PUBLISHABLE_KEY || "");
  if (!url || !key) throw new Error("Cloud service is not configured");
  return { url, key };
}

export function hasUserToken(request) {
  const auth = request.headers.get("Authorization") || "";
  return auth.startsWith("Bearer ") && auth !== `Bearer ${browserKey}`;
}

export function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}
