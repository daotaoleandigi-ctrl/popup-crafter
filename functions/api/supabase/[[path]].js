import {
  browserKey,
  getSupabaseConfig,
  hasUserToken,
  json,
  sameOrigin,
} from "../../_lib/supabase.js";

const allowedAuth = [
  "/auth/v1/signup",
  "/auth/v1/token",
  "/auth/v1/user",
  "/auth/v1/logout",
  "/auth/v1/recover",
  "/auth/v1/verify",
];

export async function onRequest({ request, env, params }) {
  if (!sameOrigin(request)) return json({ message: "Origin not allowed" }, 403);

  const parts = Array.isArray(params.path) ? params.path : [params.path];
  const path = `/${parts.filter(Boolean).join("/")}`;
  const isAuth = allowedAuth.some(
    (route) => path === route || path.startsWith(`${route}?`),
  );
  const isPublicPopup = path === "/rest/v1/rpc/get_published_popup";
  const isPublicAsset =
    request.method === "GET" && path.startsWith("/storage/v1/object/public/");
  if (!isAuth && !isPublicPopup && !isPublicAsset && !hasUserToken(request)) {
    return json({ message: "Authentication required" }, 401);
  }

  try {
    const { url, key } = getSupabaseConfig(env);
    const incoming = new URL(request.url);
    const target = new URL(`${path}${incoming.search}`, `${url}/`);
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("origin");
    headers.delete("referer");
    headers.set("apikey", key);
    if ((headers.get("Authorization") || "") === `Bearer ${browserKey}`) {
      headers.set("Authorization", `Bearer ${key}`);
    }

    const body =
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer();

    const response = await fetch(target.href, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
    });
    const outputHeaders = new Headers(response.headers);
    outputHeaders.set(
      "Cache-Control",
      isPublicAsset ? "public, max-age=3600, s-maxage=86400" : "no-store",
    );
    if (isPublicAsset) outputHeaders.set("Access-Control-Allow-Origin", "*");
    outputHeaders.set("X-Content-Type-Options", "nosniff");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: outputHeaders,
    });
  } catch (error) {
    return json({ message: error?.message || "Cloud service unavailable" }, 503);
  }
}
