import { describe, expect, it } from "vitest";
import { resolveAmbiguousChecklistAppend } from "@/server/checklist-append-resolver";

describe("checklist append resolver", () => {
  const open = [
    {
      id: "c1",
      title: "Shopping List",
      body: "- [ ] eggs\n- [ ] bread",
      labels: ["shopping", "grocery"]
    },
    {
      id: "c2",
      title: "Work Tasks",
      body: "- [ ] draft release notes",
      labels: ["work", "release"]
    }
  ];

  it("resolves short comma list to an existing checklist", () => {
    const result = resolveAmbiguousChecklistAppend("milk, chips", ["grocery"], open);
    expect(result).toBeTruthy();
    expect(result?.target.id).toBe("c1");
    expect(result?.items).toEqual(["milk", "chips"]);
  });

  it("resolves short and-pair when context is strong", () => {
    const result = resolveAmbiguousChecklistAppend("milk and chips", ["shopping"], open);
    expect(result).toBeTruthy();
    expect(result?.target.id).toBe("c1");
    expect(result?.items).toEqual(["milk", "chips"]);
  });

  it("strips numbered fragment inside comma list", () => {
    const result = resolveAmbiguousChecklistAppend("coke, 1. mike", ["shopping"], open);
    expect(result).toBeTruthy();
    expect(result?.items).toEqual(["coke", "mike"]);
  });

  it("falls back to single open checklist for short ambiguous list", () => {
    const single = [open[0]];
    const result = resolveAmbiguousChecklistAppend("maggi, chips, coke", [], single);
    expect(result).toBeTruthy();
    expect(result?.target.id).toBe("c1");
  });

  it("does not resolve reflective journal-like text", () => {
    const result = resolveAmbiguousChecklistAppend("happy and fun", ["diary"], open);
    expect(result).toBeNull();
  });

  it("does not resolve reminder/timeline text", () => {
    const result = resolveAmbiguousChecklistAppend("today remind me at 7 pm", ["meeting"], open);
    expect(result).toBeNull();
  });
});
