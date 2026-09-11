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

export function getSupabaseConfig(env = {}) {
  const url = String(
    env.SUPABASE_URL ||
    env.VITE_SUPABASE_URL ||
    ""
  ).replace(/\/$/, "");

  const key = String(
    env.SUPABASE_PUBLISHABLE_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    ""
  );

  if (!url && !key) throw new Error("Thiếu SUPABASE_URL và SUPABASE_PUBLISHABLE_KEY trong Cloudflare Environment Variables");
  if (!url) throw new Error("Thiếu SUPABASE_URL trong Cloudflare Environment Variables");
  if (!key) throw new Error("Thiếu SUPABASE_PUBLISHABLE_KEY trong Cloudflare Environment Variables");

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
