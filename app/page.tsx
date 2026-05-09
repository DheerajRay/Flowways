"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/shared/supabase-browser";

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
  const [authRequired, setAuthRequired] = useState(true);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadItems() {
    const response = await fetch("/api/items");
    if (response.status === 401) {
      setAuthRequired(true);
      return;
    }
    if (!response.ok) return;
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

    return () => {
      subscription.subscription.unsubscribe();
    };
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
      setClassifyPreview(`${data.result.kind} - ${data.result.title}`);
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
    void loadItems();
  }

  async function toggleDone(item: DbItem) {
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked: !item.checked, workflowStatus: !item.checked ? "Done" : item.workflow_status })
    });
    void loadItems();
  }

  async function enableReminders() {
    if (!("Notification" in window)) return;
    await Notification.requestPermission();
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
          setAuthMessage("Account created. Sign in after confirming email settings in Supabase.");
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
        <div className="authHero">
          <h1>FlowWays</h1>
          <p>City-like task memory. Sign in with email and password.</p>
        </div>
        <div className="authCard">
          <div className="authTabs">
            <button type="button" className={authMode === "signin" ? "active" : ""} onClick={() => setAuthMode("signin")}>Sign In</button>
            <button type="button" className={authMode === "signup" ? "active" : ""} onClick={() => setAuthMode("signup")}>Create Account</button>
          </div>
          <input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <button type="button" onClick={signInOrUp} disabled={busy || !email || !password}>
            {busy ? "Please wait..." : authMode === "signin" ? "Sign In" : "Create Account"}
          </button>
          <p className="authMessage">{authMessage}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app">
      <aside className="rail">
        <h1>FlowWays</h1>
        <p className="subline">Task memory map</p>
        <div className="miniMap" aria-hidden="true">
          <span className="route route-a"></span>
          <span className="route route-b"></span>
          <span className="route route-c"></span>
          <span className="hub hub-a"></span>
          <span className="hub hub-b"></span>
          <span className="hub hub-c"></span>
          <span className="hub hub-d"></span>
        </div>
        <div className="filters">
          <button className={filter === "active" ? "active" : ""} onClick={() => setFilter("active")}>Active</button>
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button>
          <button className={filter === "done" ? "active" : ""} onClick={() => setFilter("done")}>Done</button>
        </div>
      </aside>
      <section className="workspace">
        <header>
          <h2>Capture</h2>
          <p>Write naturally. AI routes each item into the right lane.</p>
          <button type="button" className="signOut" onClick={signOut}>Sign Out</button>
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
