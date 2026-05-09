"use client";

import { useEffect, useMemo, useState } from "react";

interface DbItem {
  id: string;
  kind: "checklist" | "journal" | "workflow" | "timeline";
  title: string;
  body: string;
  labels: string[];
  checked: boolean;
  workflow_status: string | null;
  due_at: string | null;
}

export default function HomePage() {
  const [sourceText, setSourceText] = useState("");
  const [items, setItems] = useState<DbItem[]>([]);
  const [filter, setFilter] = useState<"active" | "all" | "done">("active");
  const [query, setQuery] = useState("");
  const [classifyPreview, setClassifyPreview] = useState("");
  const [authRequired, setAuthRequired] = useState(false);

  async function loadItems() {
    const response = await fetch("/api/items");
    if (response.status === 401) {
      setAuthRequired(true);
      return;
    }
    if (!response.ok) return;
    const data = await response.json();
    setItems(data.items || []);
  }

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    const id = setTimeout(async () => {
      if (sourceText.trim().length < 4 || authRequired) {
        setClassifyPreview("");
        return;
      }
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sourceText, modeHint: "auto" })
      });
      if (!response.ok) return;
      const data = await response.json();
      setClassifyPreview(`${data.result.kind} • ${data.result.title}`);
    }, 450);

    return () => clearTimeout(id);
  }, [sourceText, authRequired]);

  async function submitItem() {
    if (!sourceText.trim() || authRequired) return;
    const response = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceText, modeHint: "auto" })
    });
    if (!response.ok) return;
    setSourceText("");
    setClassifyPreview("");
    loadItems();
  }

  async function toggleDone(item: DbItem) {
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked: !item.checked, workflowStatus: !item.checked ? "Done" : item.workflow_status })
    });
    loadItems();
  }

  async function enableReminders() {
    if (!("Notification" in window)) return;
    await Notification.requestPermission();
  }

  const visible = useMemo(() => {
    return items
      .filter((item) => {
        if (filter === "active") return !item.checked;
        if (filter === "done") return item.checked;
        return true;
      })
      .filter((item) => `${item.title} ${item.body} ${item.labels.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  }, [items, filter, query]);

  if (authRequired) {
    return (
      <main className="authGate">
        <h1>FlowWays</h1>
        <p>This workspace requires auth. Configure Supabase auth and sign in to use task memory features.</p>
      </main>
    );
  }

  return (
    <main className="app">
      <aside className="rail">
        <h1>FlowWays</h1>
        <p>Task memory map</p>
        <div className="filters">
          <button className={filter === "active" ? "active" : ""} onClick={() => setFilter("active")}>Active</button>
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button>
          <button className={filter === "done" ? "active" : ""} onClick={() => setFilter("done")}>Done</button>
        </div>
      </aside>
      <section className="workspace">
        <header>
          <h2>Capture</h2>
          <p>Write naturally; AI maps it into the right flow.</p>
        </header>
        <div className="composer">
          <textarea
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
            placeholder="Try: Draft launch notes tomorrow 3pm #release"
            aria-label="Capture input"
          />
          <div className="composerActions">
            <button onClick={submitItem}>Add</button>
            <button onClick={enableReminders}>Enable Reminders</button>
            <span aria-live="polite">{classifyPreview}</span>
          </div>
        </div>
        <div className="search">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks, notes, labels" />
        </div>

        <section className="mapPanel" aria-label="Task map">
          {visible.map((item) => (
            <article key={item.id} className={`card tone-${item.kind}`}>
              <label>
                <input type="checkbox" checked={item.checked} onChange={() => toggleDone(item)} />
                <strong>{item.title}</strong>
              </label>
              {item.body ? <p>{item.body}</p> : null}
              <footer>
                <span>{item.kind}</span>
                {item.due_at ? <span>{new Date(item.due_at).toLocaleString()}</span> : null}
                {item.labels.map((label) => (
                  <span key={label}>#{label}</span>
                ))}
              </footer>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}



