import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();

vi.mock("@/shared/supabase-browser", () => ({
  getSupabaseBrowserClient: () => ({ auth: { getSession } })
}));

import { authenticatedFetch } from "@/shared/authenticated-fetch";

describe("authenticatedFetch", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("attaches the persisted Supabase access token", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "test-access-token" } } });

    await authenticatedFetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const [, init] = fetchMock.mock.calls[0];
    const headers = init.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer test-access-token");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("keeps unauthenticated requests free of an authorization header", async () => {
    getSession.mockResolvedValue({ data: { session: null } });

    await authenticatedFetch("/api/items", { cache: "no-store" });

    const [, init] = fetchMock.mock.calls[0];
    const headers = init.headers as Headers;
    expect(headers.has("Authorization")).toBe(false);
  });
});