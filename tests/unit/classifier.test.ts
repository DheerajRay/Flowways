import { describe, expect, it } from "vitest";
import { extractLabels, fallbackClassify, normalizeText, parseDueAt } from "@/shared/domain/classifier";

describe("classifier fallback", () => {
  const base = new Date("2026-04-24T12:00:00-04:00");

  it("normalizes whitespace", () => {
    expect(normalizeText("  hello   world ")).toBe("hello world");
  });

  it("extracts labels", () => {
    expect(extractLabels("Task #Launch #Ops")).toEqual(["launch", "ops"]);
  });

  it("parses due dates", () => {
    expect(parseDueAt("tomorrow 3pm", base)).toBeTruthy();
    expect(parseDueAt("remind me in 15 minutes", base)).toBeTruthy();
    expect(parseDueAt("remind me in 30 seconds", base)).toBeTruthy();
    expect(parseDueAt("check on rex at 4 pm", base)).toBeTruthy();
    expect(parseDueAt("check on rex at 16:30", base)).toBeTruthy();

    const localTime = parseDueAt("check on baby at 4 pm", base);
    expect(localTime).toBeTruthy();
    const deltaHours = (new Date(localTime!).getTime() - base.getTime()) / (60 * 60 * 1000);
    expect(deltaHours).toBeGreaterThan(3.5);
    expect(deltaHours).toBeLessThan(4.5);
  });

  it("classifies timeline items", () => {
    const c = fallbackClassify("Ship demo tomorrow 2pm #release", "auto", base);
    expect(c.kind).toBe("timeline");
    expect(c.labels).toContain("release");

    const d = fallbackClassify("Remind me in 15 minutes to check build", "auto", base);
    expect(d.kind).toBe("timeline");
    expect(d.due_at).toBeTruthy();

    const e = fallbackClassify("Check on Rex at 4 PM", "auto", base);
    expect(e.kind).toBe("timeline");
    expect(e.due_at).toBeTruthy();
  });

  it("classifies workflow items", () => {
    const c = fallbackClassify("Blocked on review", "auto", base);
    expect(c.kind).toBe("workflow");
    expect(c.workflow_status).toBe("Backlog");
  });
});


