import { afterEach, describe, expect, it, vi } from "vitest";
import type { ClassificationResult, ItemKind } from "@/shared/types/item";

const baseDate = new Date("2026-07-08T10:00:00-04:00");

function aiResult(overrides: Partial<ClassificationResult>): ClassificationResult {
  return {
    kind: "journal",
    title: "AI title",
    body: "AI body",
    labels: [],
    pet_quip: "Saved.",
    due_at: null,
    workflow_status: null,
    confidence: 0.8,
    reason: "mocked ai",
    fallbackUsed: false,
    ...overrides
  };
}

async function classifyFromMockedAi(
  text: string,
  modeHint: "auto" | ItemKind,
  mocked: ClassificationResult
): Promise<ClassificationResult> {
  vi.resetModules();
  const create = vi.fn().mockResolvedValue({ output_text: JSON.stringify(mocked) });

  vi.doMock("openai", () => ({
    default: class MockOpenAI {
      responses = { create };
    }
  }));

  process.env.OPENAI_API_KEY = "test-key";
  const { classifyWithAiOrFallback } = await import("@/server/ai/classifier-service");
  return classifyWithAiOrFallback(text, modeHint, "sweet", true, [], baseDate, 240);
}

afterEach(() => {
  vi.doUnmock("openai");
  vi.resetModules();
  delete process.env.OPENAI_API_KEY;
});

describe("classifier service AI post-processing", () => {
  it.each([
    ["today was productive and calm", "timeline", "journal"],
    ["prepare release handoff", "checklist", "workflow"],
    ["buy eggs milk", "workflow", "checklist"]
  ] as const)("treats manual %s mode as authoritative", async (text, modeHint, aiKind) => {
    const result = await classifyFromMockedAi(
      text,
      modeHint,
      aiResult({ kind: aiKind })
    );

    expect(result.kind).toBe(modeHint);
  });

  it.each([
    "jj called to check if we need some cheese",
    "note from jj, called to collect camera"
  ])("maps person-directed action snippets to workflow when AI returns journal: %s", async (text) => {
    const result = await classifyFromMockedAi(
      text,
      "auto",
      aiResult({ kind: "journal", labels: ["jj", "cheese"] })
    );

    expect(result.kind).toBe("workflow");
    expect(result.workflow_status).toBe("Backlog");
  });

  it("keeps short comma-separated action batches as checklist when there are no hard workflow cues", async () => {
    const result = await classifyFromMockedAi(
      "fix typo, update title, publish page",
      "auto",
      aiResult({ kind: "workflow", labels: ["typo", "title-update", "publish"] })
    );

    expect(result.kind).toBe("checklist");
    expect(result.workflow_status).toBeNull();
  });

  it("preserves tickets as a useful timeline retrieval label", async () => {
    const result = await classifyFromMockedAi(
      "remind me to book train tickets tomorrow at 8am",
      "auto",
      aiResult({ kind: "timeline", labels: ["book", "train"], due_at: "2026-07-09T12:00:00.000Z" })
    );

    expect(result.kind).toBe("timeline");
    expect(result.labels).toContain("tickets");
  });
});
