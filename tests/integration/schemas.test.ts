import { describe, expect, it } from "vitest";
import { classificationResultSchema } from "@/shared/types/schemas";

describe("classification schema", () => {
  it("validates expected payload", () => {
    const parsed = classificationResultSchema.parse({
      kind: "checklist",
      title: "Call vendor",
      body: "",
      labels: ["ops"],
      due_at: null,
      workflow_status: null,
      confidence: 0.8,
      reason: "AI parsed imperative",
      fallbackUsed: false
    });

    expect(parsed.kind).toBe("checklist");
  });
});


