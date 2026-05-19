import { NextResponse } from "next/server";
import { classifyInputSchema } from "@/shared/types/schemas";
import { classifyWithAiOrFallback } from "@/server/ai/classifier-service";
import { checkDailyLimit } from "@/server/api/rate-limit";
import { requireAuth } from "@/server/api/auth";

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const limited = checkDailyLimit(auth.user.id);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Daily classification limit reached" }, { status: 429 });
  }

  const raw = await request.json().catch(() => null);
  if (!raw || typeof raw !== "object") {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const normalizedPayload = {
    ...(raw as Record<string, unknown>),
    text:
      typeof (raw as { text?: unknown }).text === "string"
        ? (raw as { text: string }).text
        : typeof (raw as { sourceText?: unknown }).sourceText === "string"
          ? (raw as { sourceText: string }).sourceText
          : undefined
  };

  const parsed = classifyInputSchema.safeParse(normalizedPayload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid classification input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const result = await classifyWithAiOrFallback(
    payload.text,
    payload.modeHint,
    payload.petMode,
    payload.petEnabled,
    [],
    payload.clientNow ? new Date(payload.clientNow) : undefined,
    payload.clientTimezoneOffsetMinutes
  );

  return NextResponse.json({ result, remaining: limited.remaining });
}
