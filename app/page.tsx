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
}

export default function HomePage() {
  const [sourceText, setSourceText] = useState("");
  const [items, setItems] = useState<DbItem[]>([]);
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

    return () => {
      subscription.subscription.unsubscribe();
    };
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
      setSubmitMessage("Save failed. Check auth/session and try again.");
      setBusy(false);
      return;
    }

    const data = await response.json();
    setSubmitMessage(`Saved as ${data.classification.kind}: ${data.classification.title}`);
    setSourceText("");
    await loadItems();
    setBusy(false);
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
          setAuthMessage("Account created. If signup requires email confirmation, sign in after confirmation.");
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
          <button type="button" onClick={signInOrUp} disabled={busy || !email || !password}>
            {busy ? "Please wait..." : authMode === "signin" ? "Sign In" : "Create Account"}
          </button>
          <p className="message">{authMessage}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="topbar">
        <h1>FlowWays</h1>
        <button type="button" onClick={signOut}>Sign Out</button>
      </header>

      <section className="capture">
        <label htmlFor="captureInput">Add memory</label>
        <textarea
          id="captureInput"
          value={sourceText}
          onChange={(event) => setSourceText(event.target.value)}
          placeholder="Write anything: task, note, workflow, or timed item"
        />
        <button type="button" onClick={submitItem} disabled={busy || !sourceText.trim()}>
          {busy ? "Saving..." : "Save"}
        </button>
        <p className="message">{submitMessage}</p>
      </section>

      <section className="feed" aria-label="Saved items">
        {items.length === 0 ? <p className="empty">No items yet.</p> : null}
        {items.map((item) => (
          <article key={item.id} className={`item item-${item.kind}`}>
            <div className="itemHead">
              <strong>{item.title}</strong>
              <span className="kind">{item.kind}</span>
            </div>
            {item.body ? <p>{item.body}</p> : null}
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
