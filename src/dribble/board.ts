export const DRIBBLE_STATUSES = ["backlog", "progress", "review", "done"] as const;

export type DribbleStatus = (typeof DRIBBLE_STATUSES)[number];
export type DribblePriority = "Low" | "Medium" | "High" | "Urgent";

export interface DribbleTask {
  id: string;
  title: string;
  status: DribbleStatus;
  priority: DribblePriority;
  progress: number;
  estimateHours: number;
  tags: string[];
  assignees: string[];
  due: string;
  project: string;
  signal: string;
}

export type DribbleTaskInput = Omit<DribbleTask, "id"> & { id?: string };
export type DribbleTaskCollection = readonly DribbleTask[];
export type DribbleTaskGroups = Record<DribbleStatus, DribbleTask[]>;
export type DribbleViewMode = "board" | "list" | "timeline" | "calendar";

export interface DribbleTimelineEntry {
  task: DribbleTask;
  offset: number;
  width: number;
  label: string;
}

export interface DribbleCalendarDay {
  label: string;
  date: string;
  tone: "hot" | "active" | "quiet";
  tasks: DribbleTask[];
}

export const DRIBBLE_STATUS_LABELS: Record<DribbleStatus, string> = {
  backlog: "Backlog",
  progress: "In motion",
  review: "Review",
  done: "Done"
};

export const DRIBBLE_STATUS_ACCENTS: Record<DribbleStatus, string> = {
  backlog: "#f8d774",
  progress: "#88d8ff",
  review: "#ff9f8f",
  done: "#9ff0b0"
};

export const DRIBBLE_VIEW_LABELS: Record<DribbleViewMode, string> = {
  board: "Board",
  list: "List",
  timeline: "Timeline",
  calendar: "Calendar"
};

const priorityRank: Record<DribblePriority, number> = {
  Urgent: 0,
  High: 1,
  Medium: 2,
  Low: 3
};

export const DRIBBLE_SEED_TASKS: DribbleTask[] = [
  {
    id: "dribble-seed-1",
    title: "Audit activation funnel friction",
    status: "backlog",
    priority: "High",
    progress: 18,
    estimateHours: 5,
    tags: ["research", "growth"],
    assignees: ["AM", "JR"],
    due: "Today",
    project: "Activation Lab",
    signal: "Heatmap spike"
  },
  {
    id: "dribble-seed-2",
    title: "Prototype spatial board transitions",
    status: "progress",
    priority: "Urgent",
    progress: 64,
    estimateHours: 9,
    tags: ["motion", "ui"],
    assignees: ["NX"],
    due: "May 24",
    project: "Interface System",
    signal: "2 risks"
  },
  {
    id: "dribble-seed-3",
    title: "Write adaptive dashboard rules",
    status: "review",
    priority: "Medium",
    progress: 82,
    estimateHours: 4,
    tags: ["backend", "ai"],
    assignees: ["SL", "VM"],
    due: "May 25",
    project: "Execution Engine",
    signal: "Needs copy pass"
  },
  {
    id: "dribble-seed-4",
    title: "Publish beta feedback digest",
    status: "done",
    priority: "Low",
    progress: 100,
    estimateHours: 3,
    tags: ["ops"],
    assignees: ["TD"],
    due: "Done",
    project: "Launch Room",
    signal: "Shipped"
  },
  {
    id: "dribble-seed-5",
    title: "Design task detail command sheet",
    status: "progress",
    priority: "High",
    progress: 46,
    estimateHours: 7,
    tags: ["cards", "command"],
    assignees: ["AM"],
    due: "Tomorrow",
    project: "Interface System",
    signal: "3 comments"
  }
];

export function groupDribbleTasks(tasks: DribbleTaskCollection): DribbleTaskGroups {
  return DRIBBLE_STATUSES.reduce<DribbleTaskGroups>((groups, status) => {
    groups[status] = tasks.filter((task) => task.status === status);
    return groups;
  }, { backlog: [], progress: [], review: [], done: [] });
}

export function moveDribbleTask(
  tasks: DribbleTaskCollection,
  taskId: string,
  nextStatus: DribbleStatus
): DribbleTask[] {
  return tasks.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task));
}

export function createDribbleTask(title: string, status: DribbleStatus = "backlog"): DribbleTask {
  const cleanTitle = title.trim() || "Untitled task";
  return {
    id: `dribble-${Date.now().toString(36)}-${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 28) || "task"}`,
    title: cleanTitle,
    status,
    priority: "Medium",
    progress: 15,
    estimateHours: 2,
    tags: ["new", "triage"],
    assignees: ["YOU"],
    due: "This week",
    project: "Dribble Desk",
    signal: "Fresh capture"
  };
}

export function getDribbleMetrics(tasks: DribbleTaskCollection) {
  const totalTasks = tasks.length;
  const activeTasks = tasks.filter((task) => task.status !== "done").length;
  const averageProgress = totalTasks
    ? Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / totalTasks)
    : 0;
  const totalEstimateHours = tasks.reduce((sum, task) => sum + task.estimateHours, 0);

  return {
    totalTasks,
    activeTasks,
    averageProgress,
    totalEstimateHours
  };
}

export function getDribbleDueRank(due: string): number {
  const normalized = due.trim().toLowerCase();
  if (normalized === "today") return 0;
  if (normalized === "tomorrow") return 1;
  if (normalized === "this week") return 3;
  if (normalized === "done") return 8;
  const mayMatch = normalized.match(/^may\s+(\d{1,2})$/);
  if (mayMatch) return Math.max(0, Number(mayMatch[1]) - 23);
  return 5;
}

export function getDribbleSortedTasks(tasks: DribbleTaskCollection): DribbleTask[] {
  return [...tasks].sort((a, b) => {
    const priorityDelta = priorityRank[a.priority] - priorityRank[b.priority];
    if (priorityDelta !== 0) return priorityDelta;
    const dueDelta = getDribbleDueRank(a.due) - getDribbleDueRank(b.due);
    if (dueDelta !== 0) return dueDelta;
    return b.progress - a.progress;
  });
}

export function buildDribbleTimeline(tasks: DribbleTaskCollection): DribbleTimelineEntry[] {
  return getDribbleSortedTasks(tasks).map((task) => {
    const offset = Math.min(82, getDribbleDueRank(task.due) * 14);
    const width = Math.max(14, Math.min(42, task.estimateHours * 4));
    return {
      task,
      offset,
      width,
      label: task.due
    };
  });
}

export function buildDribbleCalendarDays(tasks: DribbleTaskCollection): DribbleCalendarDay[] {
  const labels = ["Today", "Tomorrow", "May 25", "May 26", "May 27", "May 28", "Later"];
  return labels.map((label, index) => {
    const dayTasks = tasks.filter((task) => {
      if (label === "Later") return getDribbleDueRank(task.due) >= 5;
      return task.due.toLowerCase() === label.toLowerCase();
    });
    const urgentCount = dayTasks.filter((task) => task.priority === "Urgent" || task.priority === "High").length;
    return {
      label,
      date: index < 6 ? String(23 + index).padStart(2, "0") : "+",
      tone: urgentCount > 0 ? "hot" : dayTasks.length > 0 ? "active" : "quiet",
      tasks: getDribbleSortedTasks(dayTasks)
    };
  });
}
