"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DRIBBLE_SEED_TASKS,
  DRIBBLE_STATUS_ACCENTS,
  DRIBBLE_STATUS_LABELS,
  DRIBBLE_STATUSES,
  createDribbleTask,
  getDribbleMetrics,
  groupDribbleTasks,
  moveDribbleTask,
  type DribbleStatus,
  type DribbleTask
} from "@/dribble/board";
import styles from "./dribble.module.css";

const storageKey = "dribble-desk:v1";

const researchNotes = [
  "Dribbble task boards lean on multi-view tabs, avatars, progress chips, and dense cards that still scan quickly.",
  "Current SaaS references favor calm defaults: advanced controls hide until needed, with typography and spacing doing the work.",
  "Motion should explain state changes: lane shifts, card focus, and metric changes get subtle continuity rather than decoration.",
  "Backend shape should stay product-grade: isolated schema, explicit board events, row-level ownership, and no coupling to FlowWays items."
];

const backendBlueprint = [
  { label: "Storage", value: "dribble_workspaces, dribble_tasks, dribble_events" },
  { label: "API", value: "GET /api/dribble/tasks, POST /api/dribble/tasks, PATCH /api/dribble/tasks/:id" },
  { label: "Realtime", value: "task_moved and task_commented events fan out per workspace" },
  { label: "AI layer", value: "optional prioritization worker, not required for core CRUD" }
];

export default function DribblePage() {
  const [tasks, setTasks] = useState<DribbleTask[]>(DRIBBLE_SEED_TASKS);
  const [selectedId, setSelectedId] = useState(DRIBBLE_SEED_TASKS[1]?.id || "");
  const [draftTitle, setDraftTitle] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          setTasks(parsed);
          setSelectedId(String(parsed[0]?.id || ""));
        }
      }
    } catch {
      setTasks(DRIBBLE_SEED_TASKS);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify(tasks));
  }, [hydrated, tasks]);

  const grouped = useMemo(() => groupDribbleTasks(tasks), [tasks]);
  const metrics = useMemo(() => getDribbleMetrics(tasks), [tasks]);
  const selectedTask = tasks.find((task) => task.id === selectedId) || tasks[0];

  function moveTask(taskId: string, nextStatus: DribbleStatus) {
    setTasks((current) => moveDribbleTask(current, taskId, nextStatus));
    setSelectedId(taskId);
  }

  function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTask = createDribbleTask(draftTitle, "backlog");
    setTasks((current) => [nextTask, ...current]);
    setSelectedId(nextTask.id);
    setDraftTitle("");
  }

  function resetDemo() {
    setTasks(DRIBBLE_SEED_TASKS);
    setSelectedId(DRIBBLE_SEED_TASKS[1]?.id || "");
  }

  return (
    <main className={styles.shell}>
      <div className={styles.orbOne} />
      <div className={styles.orbTwo} />
      <aside className={styles.sidebar} aria-label="Dribble workspace navigation">
        <div className={styles.logoMark}>D</div>
        <nav className={styles.navStack}>
          {["Desk", "Boards", "Timeline", "Signals", "Schema"].map((item, index) => (
            <a className={index === 0 ? styles.navActive : styles.navItem} href={`#${item.toLowerCase()}`} key={item}>
              {item}
            </a>
          ))}
        </nav>
        <div className={styles.sideCard}>
          <span>Research source</span>
          <strong>Task management UI synthesis</strong>
          <p>Dribbble boards, SaaS trend reports, and production PM patterns translated into one isolated demo.</p>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.hero} id="desk">
          <div>
            <p className={styles.eyebrow}>/dribble side project</p>
            <h1>Task workbench with calm depth and execution signals.</h1>
            <p className={styles.heroText}>
              A standalone interpretation of modern task-management UI: kanban clarity, bento analytics, progressive detail,
              and a backend plan that can become real without touching FlowWays data.
            </p>
          </div>
          <form className={styles.quickAdd} onSubmit={addTask}>
            <label htmlFor="dribble-task">Quick capture</label>
            <div>
              <input
                id="dribble-task"
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                placeholder="Add a task to the board"
              />
              <button type="submit">Add</button>
            </div>
          </form>
        </header>

        <section className={styles.metrics} aria-label="Board metrics">
          <MetricCard label="Active tasks" value={metrics.activeTasks.toString()} detail={`${metrics.totalTasks} total cards`} />
          <MetricCard label="Avg progress" value={`${metrics.averageProgress}%`} detail="Across all lanes" />
          <MetricCard label="Capacity" value={`${metrics.totalEstimateHours}h`} detail="Estimated effort" />
          <button className={styles.resetCard} type="button" onClick={resetDemo}>Reset local demo</button>
        </section>

        <section className={styles.contentGrid}>
          <div className={styles.boardPanel} id="boards">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Board</p>
                <h2>Execution lanes</h2>
              </div>
              <div className={styles.viewTabs} aria-label="View switcher">
                {["Board", "List", "Timeline", "Calendar"].map((view, index) => (
                  <span className={index === 0 ? styles.tabActive : styles.tab} key={view}>{view}</span>
                ))}
              </div>
            </div>

            <div className={styles.board}>
              {DRIBBLE_STATUSES.map((status) => (
                <section className={styles.lane} key={status}>
                  <div className={styles.laneHeader}>
                    <span className={styles.laneDot} style={{ background: DRIBBLE_STATUS_ACCENTS[status] }} />
                    <h3>{DRIBBLE_STATUS_LABELS[status]}</h3>
                    <b>{grouped[status].length}</b>
                  </div>
                  <div className={styles.cards}>
                    {grouped[status].map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        selected={selectedTask?.id === task.id}
                        onSelect={() => setSelectedId(task.id)}
                        onMove={moveTask}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>

          <aside className={styles.detailPanel} id="signals">
            {selectedTask ? (
              <>
                <p className={styles.eyebrow}>Focused card</p>
                <h2>{selectedTask.title}</h2>
                <div className={styles.progressRing} style={{ "--progress": `${selectedTask.progress}%` } as React.CSSProperties}>
                  <span>{selectedTask.progress}%</span>
                </div>
                <dl className={styles.detailList}>
                  <div><dt>Project</dt><dd>{selectedTask.project}</dd></div>
                  <div><dt>Signal</dt><dd>{selectedTask.signal}</dd></div>
                  <div><dt>Due</dt><dd>{selectedTask.due}</dd></div>
                  <div><dt>Estimate</dt><dd>{selectedTask.estimateHours}h</dd></div>
                </dl>
                <div className={styles.assigneeRow}>
                  {selectedTask.assignees.map((person) => <span key={person}>{person}</span>)}
                </div>
              </>
            ) : null}
          </aside>
        </section>

        <section className={styles.bottomGrid}>
          <article className={styles.researchPanel}>
            <p className={styles.eyebrow}>UI research synthesis</p>
            <h2>Elements carried into the visual system</h2>
            {researchNotes.map((note) => <p key={note}>{note}</p>)}
          </article>
          <article className={styles.blueprintPanel} id="schema">
            <p className={styles.eyebrow}>Backend interpretation</p>
            <h2>How I would make it production-grade</h2>
            {backendBlueprint.map((item) => (
              <div className={styles.blueprintRow} key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </article>
        </section>
      </section>
    </main>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className={styles.metricCard}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function TaskCard({
  task,
  selected,
  onSelect,
  onMove
}: {
  task: DribbleTask;
  selected: boolean;
  onSelect: () => void;
  onMove: (taskId: string, nextStatus: DribbleStatus) => void;
}) {
  return (
    <article className={selected ? styles.cardSelected : styles.card} onClick={onSelect}>
      <div className={styles.cardTop}>
        <span className={styles.priority}>{task.priority}</span>
        <span>{task.due}</span>
      </div>
      <h4>{task.title}</h4>
      <p>{task.project}</p>
      <div className={styles.tagRow}>
        {task.tags.map((tag) => <span key={tag}>#{tag}</span>)}
      </div>
      <div className={styles.cardProgress} aria-label={`${task.progress}% complete`}>
        <span style={{ width: `${task.progress}%` }} />
      </div>
      <div className={styles.cardFooter}>
        <div className={styles.assigneeRow}>
          {task.assignees.map((person) => <span key={person}>{person}</span>)}
        </div>
        <select
          aria-label={`Move ${task.title}`}
          value={task.status}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => onMove(task.id, event.target.value as DribbleStatus)}
        >
          {DRIBBLE_STATUSES.map((status) => (
            <option value={status} key={status}>{DRIBBLE_STATUS_LABELS[status]}</option>
          ))}
        </select>
      </div>
    </article>
  );
}
