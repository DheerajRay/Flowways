import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  getBearerClient: vi.fn(),
  getCookieClient: vi.fn()
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("@/server/supabase/server", () => ({
  getSupabaseBearerClient: mocks.getBearerClient,
  getSupabaseServerClient: mocks.getCookieClient
}));

import { requireAuth } from "@/server/api/auth";

describe("requireAuth", () => {
  afterEach(() => vi.clearAllMocks());

  it("authenticates bearer sessions without depending on cookies", async () => {
    const user = { id: "embedded-user" };
    const bearerClient = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) } };
    mocks.headers.mockResolvedValue(new Headers({ Authorization: "Bearer embedded-token" }));
    mocks.getBearerClient.mockReturnValue(bearerClient);

    const result = await requireAuth();

    expect(mocks.getBearerClient).toHaveBeenCalledWith("embedded-token");
    expect(bearerClient.auth.getUser).toHaveBeenCalledWith("embedded-token");
    expect(mocks.getCookieClient).not.toHaveBeenCalled();
    expect(result).toMatchObject({ user, error: null });
  });

  it("retains cookie authentication as a compatibility fallback", async () => {
    const user = { id: "cookie-user" };
    const cookieClient = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) } };
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getCookieClient.mockResolvedValue(cookieClient);

    const result = await requireAuth();

    expect(result).toMatchObject({ user, error: null });
  });

  it("returns 401 when neither bearer nor cookie authentication is valid", async () => {
    const cookieClient = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("invalid") }) } };
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getCookieClient.mockResolvedValue(cookieClient);

    const result = await requireAuth();

    expect(result.error?.status).toBe(401);
  });
});