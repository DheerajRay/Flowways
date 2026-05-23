import { describe, expect, it } from "vitest";
import {
  buildDribbleCalendarDays,
  buildDribbleTimeline,
  createDribbleTask,
  getDribbleMetrics,
  getDribbleSortedTasks,
  groupDribbleTasks,
  moveDribbleTask
} from "@/dribble/board";
import type { DribbleTask } from "@/dribble/board";

describe("dribble board model", () => {
  const tasks: DribbleTask[] = [
    {
      id: "a",
      title: "Map onboarding drop-off",
      status: "backlog",
      priority: "High",
      progress: 10,
      estimateHours: 4,
      tags: ["research"],
      assignees: ["MX"],
      due: "Today",
      project: "Activation",
      signal: "12 comments"
    },
    {
      id: "b",
      title: "Ship command palette",
      status: "progress",
      priority: "Medium",
      progress: 65,
      estimateHours: 8,
      tags: ["frontend"],
      assignees: ["RN"],
      due: "Tomorrow",
      project: "Velocity",
      signal: "2 blockers"
    }
  ];

  it("groups tasks into all board lanes", () => {
    const grouped = groupDribbleTasks(tasks);

    expect(grouped.backlog.map((task) => task.id)).toEqual(["a"]);
    expect(grouped.progress.map((task) => task.id)).toEqual(["b"]);
    expect(grouped.review).toEqual([]);
    expect(grouped.done).toEqual([]);
  });

  it("moves a task without mutating the original collection", () => {
    const moved = moveDribbleTask(tasks, "a", "review");

    expect(moved.find((task) => task.id === "a")?.status).toBe("review");
    expect(tasks[0].status).toBe("backlog");
  });

  it("creates a focused task with deterministic defaults", () => {
    const task = createDribbleTask("Design empty state", "review");

    expect(task.title).toBe("Design empty state");
    expect(task.status).toBe("review");
    expect(task.progress).toBe(15);
    expect(task.tags).toContain("new");
    expect(task.id).toMatch(/^dribble-/);
  });

  it("summarizes board health metrics", () => {
    const metrics = getDribbleMetrics(tasks);

    expect(metrics.totalTasks).toBe(2);
    expect(metrics.activeTasks).toBe(2);
    expect(metrics.averageProgress).toBe(38);
    expect(metrics.totalEstimateHours).toBe(12);
  });

  it("sorts list view by urgency, due rank, and progress", () => {
    const sorted = getDribbleSortedTasks([
      ...tasks,
      {
        id: "c",
        title: "Resolve production issue",
        status: "review",
        priority: "Urgent",
        progress: 80,
        estimateHours: 1,
        tags: ["incident"],
        assignees: ["OP"],
        due: "May 25",
        project: "Reliability",
        signal: "Customer impact"
      }
    ]);

    expect(sorted.map((task) => task.id)).toEqual(["c", "a", "b"]);
  });

  it("builds timeline entries with deterministic offsets", () => {
    const timeline = buildDribbleTimeline(tasks);

    expect(timeline.map((entry) => entry.task.id)).toEqual(["a", "b"]);
    expect(timeline[0].offset).toBe(0);
    expect(timeline[1].offset).toBeGreaterThan(timeline[0].offset);
  });

  it("maps tasks into calendar days", () => {
    const days = buildDribbleCalendarDays(tasks);
    const today = days.find((day) => day.label === "Today");
    const tomorrow = days.find((day) => day.label === "Tomorrow");

    expect(days).toHaveLength(7);
    expect(today?.tasks.map((task) => task.id)).toEqual(["a"]);
    expect(tomorrow?.tasks.map((task) => task.id)).toEqual(["b"]);
  });
});
