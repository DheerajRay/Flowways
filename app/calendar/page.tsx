"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import { authenticatedFetch } from "@/shared/authenticated-fetch";

type DbItem = {
  id: string;
  kind: "checklist" | "journal" | "workflow" | "timeline";
  title: string;
  body: string;
  labels: string[];
  due_at: string | null;
  checked?: boolean;
};

type CalendarEvent = {
  id: string;
  title: string;
  detail: string;
  start: string;
  end?: string;
  source: string;
};

function toIsoLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatWeekdayShort(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function parseTimeRangeFromText(text: string): { start: string; end?: string } | null {
  const source = text.trim();
  if (!source) return null;
  const rangeMatch = source.match(/(\d{1,2}:\d{2})\s*[-to]{1,3}\s*(\d{1,2}:\d{2})/i);
  if (rangeMatch) {
    return { start: rangeMatch[1], end: rangeMatch[2] };
  }
  const startOnly = source.match(/\b(\d{1,2}:\d{2})\b/);
  if (startOnly) {
    return { start: startOnly[1] };
  }
  return null;
}

function minutesFromTimeString(timeValue: string): number {
  const [hRaw, mRaw] = timeValue.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

function buildMonthGrid(viewDate: Date): Date[] {
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const next = new Date(start);
    next.setDate(start.getDate() + index);
    return next;
  });
}

function mapTimelineItemsToEvents(items: DbItem[]): Record<string, CalendarEvent[]> {
  const byDay: Record<string, CalendarEvent[]> = {};

  for (const item of items) {
    if (item.kind !== "timeline" || !item.due_at || item.checked) continue;

    const due = new Date(item.due_at);
    if (Number.isNaN(due.getTime())) continue;

    const isoDay = toIsoLocalDate(due);
    const explicitTime = parseTimeRangeFromText(`${item.title} ${item.body}`);
    const dueClock = due.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

    const event: CalendarEvent = {
      id: item.id,
      title: item.title,
      detail: item.body || "Timeline task",
      start: explicitTime?.start || dueClock,
      end: explicitTime?.end,
      source: "FlowWays"
    };

    if (!byDay[isoDay]) byDay[isoDay] = [];
    byDay[isoDay].push(event);
  }

  for (const key of Object.keys(byDay)) {
    byDay[key].sort((a, b) => minutesFromTimeString(a.start) - minutesFromTimeString(b.start));
  }

  return byDay;
}

export default function CalendarPage() {
  const [items, setItems] = useState<DbItem[]>([]);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      setLoading(true);
      setLoadError("");
      try {
        const response = await authenticatedFetch("/api/items", { cache: "no-store" });
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Sign in required to load calendar items.");
          }
          throw new Error("Could not load calendar items.");
        }
        const data = await response.json();
        if (!cancelled) setItems(Array.isArray(data?.items) ? data.items : []);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Could not load calendar items.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadItems();

    return () => {
      cancelled = true;
    };
  }, []);

  const eventsByDay = useMemo(() => mapTimelineItemsToEvents(items), [items]);
  const monthGrid = useMemo(() => buildMonthGrid(viewDate), [viewDate]);
  const selectedIso = toIsoLocalDate(selectedDate);
  const selectedEvents = eventsByDay[selectedIso] || [];

  const checklistItems = useMemo(
    () => items.filter((item) => item.kind === "checklist" && !item.checked).slice(0, 6),
    [items]
  );

  const dayEventCount = (date: Date) => {
    const iso = toIsoLocalDate(date);
    return eventsByDay[iso]?.length || 0;
  };

  return (
    <main className={styles.page}>
      <section className={styles.board}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHead}>
            <h2>Calendar</h2>
            <span>{formatMonthYear(viewDate)}</span>
          </div>

          <div className={styles.weekHeader}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((weekday) => <span key={weekday}>{weekday}</span>)}
          </div>

          <div className={styles.monthGrid}>
            {monthGrid.map((date) => {
              const iso = toIsoLocalDate(date);
              const inMonth = date.getMonth() === viewDate.getMonth();
              const selected = iso === selectedIso;
              const hasEvents = dayEventCount(date) > 0;

              return (
                <button
                  key={iso}
                  type="button"
                  className={`${styles.dayCell}${inMonth ? "" : ` ${styles.outMonth}`}${selected ? ` ${styles.selectedDay}` : ""}`}
                  onClick={() => setSelectedDate(date)}
                >
                  {date.getDate()}
                  {hasEvents ? <span className={styles.dayDot} aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>

          <div className={styles.taskShelf}>
            <h3>Tasks</h3>
            {checklistItems.length === 0 ? (
              <p>No checklist items.</p>
            ) : (
              checklistItems.map((task) => <p key={task.id}>{task.title}</p>)
            )}
          </div>
        </aside>

        <section className={styles.schedule}>
          <div className={styles.scheduleHead}>
            <h3>{formatMonthYear(selectedDate)}</h3>
            <div className={styles.scheduleActions}>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setSelectedDate(now);
                  setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
                }}
              >
                Today
              </button>
              <button type="button" onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>
                Prev
              </button>
              <button type="button" onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>
                Next
              </button>
            </div>
          </div>

          <div className={styles.dayPane}>
            <div className={styles.dayNumber}>
              <span className={styles.dayNumberValue}>{String(selectedDate.getDate()).padStart(2, "0")}</span>
              <span className={styles.dayNumberWeekday}>{formatWeekdayShort(selectedDate)}</span>
            </div>

            <div className={styles.eventList}>
              {loading ? <div className={styles.placeholder}>Loading calendar items...</div> : null}
              {!loading && loadError ? <div className={styles.placeholder}>{loadError}</div> : null}
              {!loading && !loadError && selectedEvents.length === 0 ? (
                <div className={styles.placeholder}>There are no timeline events on this day.</div>
              ) : null}

              {!loading && !loadError && selectedEvents.map((event) => (
                <article key={event.id} className={styles.eventRow}>
                  <div className={styles.timeCol}>
                    <strong>{event.start}</strong>
                    {event.end ? <span>{event.end}</span> : null}
                  </div>
                  <div className={styles.eventCol}>
                    <h4>{event.title}</h4>
                    <p>{event.detail}</p>
                    <small>{event.source}</small>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
