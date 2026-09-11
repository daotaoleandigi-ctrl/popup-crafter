// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { onRequestGet as getPublicPopup } from "../../functions/api/public/popups/[id].js";
import { onRequest as handleSupabaseProxy } from "../../functions/api/supabase/[[path]].js";

describe("Cloudflare Functions", () => {
  const mockEnv = {
    SUPABASE_URL: "https://mock.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "mock-pub-key",
  };

  describe("api/public/popups/[id]", () => {
    it("returns 400 for invalid popup ID format", async () => {
      const response = await getPublicPopup({
        env: mockEnv,
        params: { id: "short" },
      });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Invalid popup ID");
    });

    it("fetches published popup from Supabase RPC for valid ID", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "valid-popup-id-123", name: "Test Popup" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const response = await getPublicPopup({
        env: mockEnv,
        params: { id: "valid-popup-id-123" },
      });

      expect(response.status).toBe(200);
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://mock.supabase.co/rest/v1/rpc/get_published_popup",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: "mock-pub-key",
            Authorization: "Bearer mock-pub-key",
          },
          body: JSON.stringify({ p_id: "valid-popup-id-123" }),
        }),
      );
      fetchSpy.mockRestore();
    });

    it("returns 503 if Supabase fetch throws an error", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));
      const response = await getPublicPopup({
        env: mockEnv,
        params: { id: "valid-popup-id-123" },
      });
      expect(response.status).toBe(503);
      fetchSpy.mockRestore();
    });
  });

  describe("api/supabase/[[path]]", () => {
    it("rejects cross-origin requests with 403", async () => {
      const request = new Request("https://myapp.com/api/supabase/auth/v1/signup", {
        headers: { Origin: "https://malicious.com" },
      });
      const response = await handleSupabaseProxy({
        request,
        env: mockEnv,
        params: { path: ["auth", "v1", "signup"] },
      });
      expect(response.status).toBe(403);
    });

    it("rejects unauthenticated non-public requests with 401", async () => {
      const request = new Request("https://myapp.com/api/supabase/rest/v1/popups", {
        headers: { Origin: "https://myapp.com" },
      });
      const response = await handleSupabaseProxy({
        request,
        env: mockEnv,
        params: { path: ["rest", "v1", "popups"] },
      });
      expect(response.status).toBe(401);
    });

    it("proxies allowed auth endpoint correctly", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ user: { id: "u1" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const request = new Request("https://myapp.com/api/supabase/auth/v1/signup", {
        method: "POST",
        headers: {
          Origin: "https://myapp.com",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: "test@example.com", password: "password123" }),
      });

      const response = await handleSupabaseProxy({
        request,
        env: mockEnv,
        params: { path: ["auth", "v1", "signup"] },
      });

      expect(response.status).toBe(200);
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://mock.supabase.co/auth/v1/signup",
        expect.objectContaining({
          method: "POST",
        }),
      );
      fetchSpy.mockRestore();
    });
  });
});
