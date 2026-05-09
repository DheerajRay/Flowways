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
          <p>Email + password only</p>
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
                {item.body ? <p>{item.body}</p> : null}
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
