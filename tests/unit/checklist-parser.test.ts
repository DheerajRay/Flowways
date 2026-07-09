import { describe, expect, it } from "vitest";
import { parseListFromText } from "@/server/checklist-parser";

describe("checklist parser", () => {
  it("splits inline numbered lists into separate rows", () => {
    expect(parseListFromText("1. maggi 2. crayons 3. papers")).toEqual(["maggi", "crayons", "papers"]);
  });

  it("splits comma-separated action batches", () => {
    expect(parseListFromText("fix typo, update title, publish page")).toEqual(["fix typo", "update title", "publish page"]);
  });

  it("splits natural grocery word lists after a buy cue", () => {
    expect(parseListFromText("buy eggs milk and bread")).toEqual(["eggs", "milk", "bread"]);
    expect(parseListFromText("today buy eggs milk bread")).toEqual(["eggs", "milk", "bread"]);
  });

  it("does not split reflective or timeline text", () => {
    expect(parseListFromText("today was productive and calm")).toEqual([]);
    expect(parseListFromText("remind me to buy eggs at 7pm")).toEqual([]);
  });
});
