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
  const workflowSteps = ["Backlog", "Ready", "In Progress", "Review", "Done"] as const;

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

  async function submitItem() {
    if (!sourceText.trim() || authRequired) return;
    setBusy(true);
    setSubmitMessage("");

    const response = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceText, modeHint: "auto" })
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setSubmitMessage(body.error || `Save failed (${response.status}).`);
      setBusy(false);
      return;
    }

    const data = await response.json();
    setSubmitMessage(`Saved as ${data.classification.kind}: ${data.classification.title}`);
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
        {items.map((item) => (
          <article key={item.id} className={`item item-${item.kind}`}>
            <div className="itemHead">
              <span className="kind">{item.kind}</span>
              <div className="actions">
                <button type="button" onClick={() => updateItem(item.id, { checked: !item.checked })}>{item.checked ? "Undo" : "Done"}</button>
                {editingId === item.id ? <button type="button" onClick={() => saveEdit(item.id)}>Save</button> : <button type="button" onClick={() => startEdit(item)}>Edit</button>}
                {editingId === item.id ? <button type="button" onClick={() => setEditingId(null)}>Cancel</button> : null}
                <button type="button" className="danger" onClick={() => deleteItem(item.id)}>Delete</button>
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
                    <div className="statusRail">
                      {workflowSteps.map((step) => (
                        <button
                          type="button"
                          key={`${item.id}-${step}`}
                          className={item.workflow_status === step ? "statusChip active" : "statusChip"}
                          onClick={() => moveWorkflowStatus(item, step)}
                        >
                          {step}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : item.kind === "timeline" ? (
                  <div className="timelineBlock">
                    {item.body ? <p>{item.body}</p> : null}
                    <div className="timeActions">
                      <button type="button" onClick={() => updateItem(item.id, { dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() })}>Due +1 day</button>
                      <button type="button" onClick={() => updateItem(item.id, { dueAt: null })}>Clear Due</button>
                    </div>
                  </div>
                ) : (
                  item.body ? <p>{item.body}</p> : null
                )}
              </>
            )}

            <div className="meta">
              {item.due_at ? <span>{new Date(item.due_at).toLocaleString()}</span> : null}
              {item.labels?.map((label) => <span key={label}>#{label}</span>)}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
