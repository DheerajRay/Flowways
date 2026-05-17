import { describe, expect, it } from "vitest";
import { classificationResultSchema } from "@/shared/types/schemas";

describe("classification schema", () => {
  it("validates expected payload", () => {
    const parsed = classificationResultSchema.parse({
      kind: "journal",
      title: "Diary",
      body: "[05/17/2026, 09:01:02 AM] <today felt good>",
      labels: ["ops"],
      due_at: null,
      journal_meta: {
        journal_subtype: "diary",
        diary_entry_count: 1,
        last_entry_at: "2026-05-17T13:01:02.000Z"
      },
      workflow_status: null,
      confidence: 0.8,
      reason: "AI parsed imperative",
      fallbackUsed: false
    });

    expect(parsed.kind).toBe("journal");
  });
});


