const assert = require("assert");
const domain = require("../src/domain");

const baseDate = new Date("2026-04-24T12:00:00-04:00");

const timeline = domain.classifyInput("Draft release notes tomorrow 3pm #release", "auto", baseDate);
assert.equal(timeline.kind, "timeline");
assert.equal(timeline.title, "Draft release notes");
assert.deepEqual(timeline.labels, ["release"]);
assert.ok(timeline.dueAt);

const workflow = domain.classifyInput("Blocked on design review #ux", "auto", baseDate);
assert.equal(workflow.kind, "workflow");

const journal = domain.classifyInput(
  "This is a longer reflection about how the app should keep local data durable before showing a success state. It is clearly a note.",
  "auto",
  baseDate
);
assert.equal(journal.kind, "journal");

const item = domain.createItem("Call vendor today #ops", "checklist", 1, baseDate);
assert.equal(item.kind, "checklist");
assert.equal(item.position, 1);

const summary = domain.summarize([
  item,
  { ...item, id: "done", checked: true, dueAt: null },
  { ...item, id: "future", checked: false, dueAt: "2026-04-30T12:00:00.000Z" }
], baseDate);
assert.equal(summary.total, 3);
assert.equal(summary.done, 1);
assert.equal(summary.today, 1);
assert.equal(summary.upcoming, 1);

const filtered = domain.filterItems([item, { ...item, id: "note", kind: "journal", title: "Quiet map note" }], "journal", "map", "all");
assert.equal(filtered.length, 1);
assert.equal(filtered[0].id, "note");

console.log("Domain tests passed.");

