"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/shared/supabase-browser";

interface DbItem {
  id: string;
  kind: "checklist" | "journal" | "workflow" | "timeline";
  title: string;
  body: string;
  labels: string[];
  due_at: string | null;
  created_at?: string;
  checked?: boolean;
  workflow_status?: "Backlog" | "Ready" | "In Progress" | "Review" | "Done" | null;
}

export default function HomePage() {
  const [sourceText, setSourceText] = useState("");
  const [items, setItems] = useState<DbItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [authRequired, setAuthRequired] = useState(true);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const [mergeTargetBySource, setMergeTargetBySource] = useState<Record<string, string>>({});
  const workflowSteps = ["Backlog", "Ready", "In Progress", "Review", "Done"] as const;
  const workflowIcon: Record<(typeof workflowSteps)[number], "backlog" | "ready" | "progress" | "review" | "done"> = {
    Backlog: "backlog",
    Ready: "ready",
    "In Progress": "progress",
    Review: "review",
    Done: "done"
  };
  const genericLabels = new Set(["personal", "work", "idea", "list", "task"]);

  async function loadItems() {
    const response = await fetch("/api/items", { cache: "no-store" });
    if (response.status === 401) {
      setAuthRequired(true);
      return;
    }
    if (!response.ok) {
      setSubmitMessage("Could not load items.");
      return;
    }
    const data = await response.json();
    setItems(data.items || []);
    setAuthRequired(false);
  }

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setAuthRequired(false);
        void loadItems();
      } else {
        setAuthRequired(true);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuthRequired(false);
        void loadItems();
      } else {
        setAuthRequired(true);
        setItems([]);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  async function submitItem() {
    if (!sourceText.trim() || authRequired) return;
    setBusy(true);
    setSubmitMessage("");

    const response = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceText, modeHint: "auto", clientNow: new Date().toISOString() })
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setSubmitMessage(body.error || `Save failed (${response.status}).`);
      setBusy(false);
      return;
    }

    const data = await response.json();
    setSubmitMessage(
      data.merged
        ? `Merged into existing checklist.`
        : `Saved as ${data.classification.kind}: ${data.classification.title}`
    );
    setSourceText("");
    await loadItems();
    setBusy(false);
  }

  async function updateItem(id: string, patch: Record<string, unknown>) {
    const response = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setSubmitMessage(body.error || "Update failed.");
      return;
    }
    await loadItems();
  }

  async function deleteItem(id: string) {
    const response = await fetch(`/api/items/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setSubmitMessage(body.error || "Delete failed.");
      return;
    }
    await loadItems();
  }

  function startEdit(item: DbItem) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditBody(item.body || "");
  }

  async function saveEdit(id: string) {
    await updateItem(id, { title: editTitle.trim() || "Untitled", body: editBody });
    setEditingId(null);
  }

  function toChecklistMarkdown(entries: { text: string; checked: boolean }[]): string {
    return entries.map((entry) => `- [${entry.checked ? "x" : " "}] ${entry.text}`).join("\n");
  }

  async function mergeChecklistIntoTarget(source: DbItem, targetId: string) {
    if (!targetId || source.id === targetId) return;
    const target = items.find((item) => item.id === targetId);
    if (!target) return;

    const sourceEntries = parseChecklistItems(source.body || source.title).map((entry) => ({
      text: entry.text,
      checked: false
    }));
    const targetEntries = parseChecklistItems(target.body || target.title);
    const seen = new Set(targetEntries.map((entry) => entry.text.toLowerCase()));

    const merged = [...targetEntries];
    for (const entry of sourceEntries) {
      const key = entry.text.toLowerCase();
      if (!seen.has(key)) {
        merged.push(entry);
        seen.add(key);
      }
    }

    const mergedBody = toChecklistMarkdown(merged);
    const mergedLabels = [...new Set([...(target.labels || []), ...(source.labels || [])])];

    await updateItem(target.id, { body: mergedBody, labels: mergedLabels });
    await deleteItem(source.id);
    setSubmitMessage(`Merged checklist into "${target.title}".`);
  }

  function shouldShowMergeControls(item: DbItem): boolean {
    if (item.kind !== "checklist" || item.checked) return false;
    const candidates = items.filter((candidate) => candidate.kind === "checklist" && !candidate.checked && candidate.id !== item.id);
    if (!candidates.length) return false;

    const hasSpecificLabels = (item.labels || []).some((label) => !genericLabels.has(label));
    const title = (item.title || "").toLowerCase();
    const ambiguousTitle = title === "simple list" || title === "item list" || title === "untitled item";

    return ambiguousTitle || !hasSpecificLabels;
  }

  function parseChecklistItems(body: string): { text: string; checked: boolean }[] {
    const normalized = body.trim();
    if (!normalized) return [];

    const markdownMatches = normalized.match(/^- \[( |x)\] .+$/gim);
    if (markdownMatches?.length) {
      return markdownMatches.map((line) => {
        const checked = /\[x\]/i.test(line);
        const text = line.replace(/^- \[( |x)\]\s+/i, "").trim();
        return { text, checked };
      });
    }

    const numberedMatches = normalized.match(/\d+\.\s+[^0-9]+(?=(\d+\.\s+)|$)/g);
    if (numberedMatches?.length) {
      return numberedMatches.map((entry) => ({ text: entry.replace(/^\d+\.\s+/, "").trim(), checked: false }));
    }

    const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length > 1) {
      return lines.map((line) => ({ text: line.replace(/^[-*]\s+/, ""), checked: false }));
    }

    return [];
  }

  async function toggleChecklistSubItem(item: DbItem, index: number) {
    const entries = parseChecklistItems(item.body);
    if (!entries.length) {
      await updateItem(item.id, { checked: !item.checked });
      return;
    }

    const updated = entries.map((entry, i) => (i === index ? { ...entry, checked: !entry.checked } : entry));
    const body = updated.map((entry) => `- [${entry.checked ? "x" : " "}] ${entry.text}`).join("\n");
    const allDone = updated.every((entry) => entry.checked);
    await updateItem(item.id, { body, checked: allDone });
  }

  async function moveWorkflowStatus(item: DbItem, status: (typeof workflowSteps)[number]) {
    await updateItem(item.id, { workflowStatus: status, checked: status === "Done" });
  }

  function timelineState(dueAt: string | null) {
    if (!dueAt) return { done: false, label: "No due time set" };
    const dueMs = new Date(dueAt).getTime();
    if (Number.isNaN(dueMs)) return { done: false, label: "Invalid due time" };
    const delta = dueMs - nowMs;
    if (delta <= 0) return { done: true, label: "Timer done" };
    const mins = Math.max(1, Math.floor(delta / 60000));
    if (mins < 60) return { done: false, label: `Due in ${mins} min` };
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return { done: false, label: `Due in ${hours}h ${remMins}m` };
  }

  function timelineProgress(item: DbItem): number {
    if (!item.due_at) return 0;
    const dueMs = new Date(item.due_at).getTime();
    if (Number.isNaN(dueMs)) return 0;
    const createdMs = item.created_at ? new Date(item.created_at).getTime() : nowMs - 60 * 60 * 1000;
    const startMs = Number.isNaN(createdMs) ? nowMs - 60 * 60 * 1000 : createdMs;
    const span = Math.max(dueMs - startMs, 1);
    const elapsed = nowMs - startMs;
    return Math.min(100, Math.max(0, (elapsed / span) * 100));
  }

  function timelineProgressStyle(item: DbItem) {
    const pct = timelineProgress(item);
    return { width: `${pct}%`, minWidth: pct > 0 ? "10px" : "0px" };
  }

  function formatTimeSpent(item: DbItem): string | null {
    if (item.kind !== "workflow" || !item.created_at) return null;
    const startMs = new Date(item.created_at).getTime();
    if (Number.isNaN(startMs)) return null;
    const endMs = item.checked ? new Date().getTime() : nowMs;
    const deltaMin = Math.max(1, Math.floor((endMs - startMs) / 60000));
    if (deltaMin < 60) return `${deltaMin}m spent`;
    const hours = Math.floor(deltaMin / 60);
    const mins = deltaMin % 60;
    return mins ? `${hours}h ${mins}m spent` : `${hours}h spent`;
  }

  function Icon({ name }: { name: "done" | "undo" | "edit" | "delete" | "save" | "cancel" | "backlog" | "ready" | "progress" | "review" }) {
    const common = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
    if (name === "done" || name === "save") return <svg {...common}><path d="M3 8.5l3 3L13 4.5" /></svg>;
    if (name === "undo" || name === "cancel") return <svg {...common}><path d="M6 4L2.5 7.5 6 11" /><path d="M3 7.5h5.5A4.5 4.5 0 1 1 8.5 16" /></svg>;
    if (name === "edit") return <svg {...common}><path d="M10.8 2.2l3 3-7.8 7.8-3.6.6.6-3.6z" /></svg>;
    if (name === "delete") return <svg {...common}><path d="M4.2 4.2l7.6 7.6M11.8 4.2l-7.6 7.6" /></svg>;
    if (name === "backlog") return <svg {...common}><path d="M11.5 8H4.2" /><path d="M6.9 5.3 4.2 8l2.7 2.7" /></svg>;
    if (name === "ready") return <svg {...common}><path d="M5 4.2 11.8 8 5 11.8z" /></svg>;
    if (name === "progress") return <svg {...common}><path d="M5.8 4v8M10.2 4v8" /></svg>;
    return <svg {...common}><circle cx="8" cy="8" r="5.2" /><circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none" /></svg>;
  }

  const sortedItems = [...items].sort((a, b) => {
    const timelineRank = (item: DbItem) => {
      if (item.kind !== "timeline") return 3;
      if (item.checked) return 2;
      if (!item.due_at) return 1;
      return new Date(item.due_at).getTime() <= nowMs ? 0 : 1;
    };

    const rankDiff = timelineRank(a) - timelineRank(b);
    if (rankDiff !== 0) return rankDiff;

    if (a.kind === "timeline" && b.kind === "timeline" && a.due_at && b.due_at) {
      return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
    }
    const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bCreated - aCreated;
  });

  async function signInOrUp() {
    setBusy(true);
    setAuthMessage("");
    const supabase = getSupabaseBrowserClient();

    if (authMode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthMessage(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setAuthMessage(error.message);
      } else if (data.session) {
        setAuthMessage("Account created and signed in.");
      } else {
        const signInAttempt = await supabase.auth.signInWithPassword({ email, password });
        if (signInAttempt.error) {
          setAuthMessage("Account created. Sign in after confirmation if required.");
          setAuthMode("signin");
        } else {
          setAuthMessage("Account created and signed in.");
        }
      }
    }

    setBusy(false);
  }

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
  }

  if (authRequired) {
    return (
      <main className="authGate">
        <section className="authCard">
          <h1>FlowWays</h1>
          <div className="authTabs">
            <button type="button" className={authMode === "signin" ? "active" : ""} onClick={() => setAuthMode("signin")}>Sign In</button>
            <button type="button" className={authMode === "signup" ? "active" : ""} onClick={() => setAuthMode("signup")}>Create Account</button>
          </div>
          <input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <button type="button" onClick={signInOrUp} disabled={busy || !email || !password}>{busy ? "Please wait..." : authMode === "signin" ? "Sign In" : "Create Account"}</button>
          <p className="message">{authMessage}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <h1>FlowWays</h1>
          <p className="subtitle">Capture, classify, edit, and manage memory items.</p>
        </div>
        <button type="button" onClick={signOut}>Sign Out</button>
      </header>

      <section className="capture">
        <label htmlFor="captureInput">Add memory</label>
        <textarea id="captureInput" value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="Write anything: task, note, workflow, or timed item" />
        <button type="button" onClick={submitItem} disabled={busy || !sourceText.trim()}>{busy ? "Saving..." : "Save"}</button>
        <p className="message">{submitMessage}</p>
      </section>

      <section className="feed" aria-label="Saved items">
        {items.length === 0 ? <p className="empty">No items yet.</p> : null}
        {sortedItems.map((item) => {
          const timeState = item.kind === "timeline" ? timelineState(item.due_at) : null;
          const isTimelineExpired = item.kind === "timeline" && !item.checked && Boolean(timeState?.done);
          return (
          <article key={item.id} className={`item item-${item.kind}${isTimelineExpired ? " item-timeline-alert" : ""}`}>
            <div className="itemHead">
              <span className="kind">{item.kind}</span>
              <div className="actions">
                <button type="button" className="iconAction" aria-label={item.checked ? "Undo" : "Done"} title={item.checked ? "Undo" : "Done"} onClick={() => updateItem(item.id, { checked: !item.checked })}><Icon name={item.checked ? "undo" : "done"} /></button>
                {editingId === item.id ? <button type="button" className="iconAction" aria-label="Save" title="Save" onClick={() => saveEdit(item.id)}><Icon name="save" /></button> : <button type="button" className="iconAction" aria-label="Edit" title="Edit" onClick={() => startEdit(item)}><Icon name="edit" /></button>}
                {editingId === item.id ? <button type="button" className="iconAction" aria-label="Cancel" title="Cancel" onClick={() => setEditingId(null)}><Icon name="cancel" /></button> : null}
                <button type="button" className="iconAction danger" aria-label="Delete" title="Delete" onClick={() => deleteItem(item.id)}><Icon name="delete" /></button>
              </div>
            </div>

            {editingId === item.id ? (
              <div className="editor">
                <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
                <textarea value={editBody} onChange={(event) => setEditBody(event.target.value)} />
              </div>
            ) : (
              <>
                <h3>{item.title}</h3>
                {item.kind === "checklist" ? (
                  <div className="checklistBlock">
                    {parseChecklistItems(item.body).length ? (
                      parseChecklistItems(item.body).map((entry, index) => (
                        <label key={`${item.id}-${index}`} className="checkRow">
                          <input type="checkbox" checked={entry.checked} onChange={() => toggleChecklistSubItem(item, index)} />
                          <span>{entry.text}</span>
                        </label>
                      ))
                    ) : (
                      <label className="checkRow">
                        <input type="checkbox" checked={Boolean(item.checked)} onChange={() => updateItem(item.id, { checked: !item.checked })} />
                        <span>{item.body || item.title}</span>
                      </label>
                    )}
                  </div>
                ) : item.kind === "workflow" ? (
                  <div className="workflowBlock">
                    {item.body ? <p>{item.body}</p> : null}
                  </div>
                ) : item.kind === "timeline" ? (
                  <div className="timelineBlock">
                  </div>
                ) : (
                  item.body ? <p>{item.body}</p> : null
                )}
              </>
            )}

            <div className={`meta metaRow${item.kind === "timeline" ? " timelineMetaRow" : ""}`}>
              {item.due_at ? <span className="dateChip">{new Date(item.due_at).toLocaleString()}</span> : item.created_at ? <span className="dateChip">{new Date(item.created_at).toLocaleString()}</span> : null}
              {item.kind === "timeline" && !item.checked && timeState?.done ? <span className="overdueTagChip">OVER DUE</span> : null}
              {item.kind === "workflow" && formatTimeSpent(item) ? <span className="dateChip">{formatTimeSpent(item)}</span> : null}
              {item.labels?.map((label) => <span className="tagChip" key={label}>#{label}</span>)}
              {item.kind === "timeline" && !item.checked && item.due_at && !timeState?.done ? (
                <div className="dueRailInline" aria-label="Due progress">
                  <span className="dueLabel">Time ({timeState?.label?.replace("Due in ", "") || "--"})</span>
                  <div className="dueRailWrap">
                    <div className="dueRail" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(timelineProgress(item))}>
                      <span className="dueRailFill" style={timelineProgressStyle(item)} />
                    </div>
                  </div>
                </div>
              ) : null}
              {item.kind === "workflow" ? (
                <div className="workflowRailInline">
                  {workflowSteps.map((step) => (
                    <button
                      type="button"
                      key={`${item.id}-${step}`}
                      className={item.workflow_status === step ? "workflowDot active" : "workflowDot"}
                      aria-label={step}
                      title={step}
                      onClick={() => moveWorkflowStatus(item, step)}
                    >
                      <Icon name={workflowIcon[step]} />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            {shouldShowMergeControls(item) && (
              <div className="mergeRow">
                <select
                  value={mergeTargetBySource[item.id] || ""}
                  onChange={(event) => setMergeTargetBySource((prev) => ({ ...prev, [item.id]: event.target.value }))}
                >
                  <option value="">Merge with existing list...</option>
                  {items
                    .filter((candidate) => candidate.kind === "checklist" && !candidate.checked && candidate.id !== item.id)
                    .map((candidate) => (
                      <option key={`${item.id}-${candidate.id}`} value={candidate.id}>
                        {candidate.title}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  disabled={!mergeTargetBySource[item.id]}
                  onClick={() => mergeChecklistIntoTarget(item, mergeTargetBySource[item.id])}
                >
                  Merge
                </button>
              </div>
            )}
          </article>
        );
        })}
      </section>
    </main>
  );
}
