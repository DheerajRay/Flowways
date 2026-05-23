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
