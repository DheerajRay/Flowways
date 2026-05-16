"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { getSupabaseBrowserClient } from "@/shared/supabase-browser";
import { DEFAULT_USER_SETTINGS, type UserSettings } from "@/shared/types/settings";

interface DbItem {
  id: string;
  kind: "checklist" | "journal" | "workflow" | "timeline";
  title: string;
  body: string;
  labels: string[];
  due_at: string | null;
  created_at?: string;
  checked?: boolean;
  workflow_status?: "Backlog" | "Paused" | "In Progress" | "Ready" | "Review" | "Done" | null;
}

type SettingsDraft = UserSettings;

export default function HomePage() {
  type CaptureMode = "auto" | "timeline" | "workflow" | "journal" | "checklist";
  const [sourceText, setSourceText] = useState("");
  const [captureMode, setCaptureMode] = useState<CaptureMode>("auto");
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
  const [petNotice, setPetNotice] = useState("");
  const [petNoticeTone, setPetNoticeTone] = useState<"info" | "warning" | "error">("info");
  const [petExpression, setPetExpression] = useState("^_^");
  const [showHidden, setShowHidden] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedColorTag, setSelectedColorTag] = useState<string>("");
  const selectedColorTagRef = useRef<string>("");
  const settingsColorInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTagWindow, setShowTagWindow] = useState(false);
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);
  const [tagMatchMode, setTagMatchMode] = useState<"AND" | "OR">("AND");
  const [nowMs, setNowMs] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [initialFeedLoaded, setInitialFeedLoaded] = useState(false);
  const [mergeTargetBySource, setMergeTargetBySource] = useState<Record<string, string>>({});
  const [hiddenItemIds, setHiddenItemIds] = useState<string[]>([]);
  const [editChecklistEntries, setEditChecklistEntries] = useState<{ text: string; checked: boolean }[]>([]);
  const [editTimelineDueAt, setEditTimelineDueAt] = useState("");
  const [editTimelineOffsetMin, setEditTimelineOffsetMin] = useState("15");
  const [editWorkflowSummary, setEditWorkflowSummary] = useState("");
  const [editWorkflowComments, setEditWorkflowComments] = useState<string[]>([]);
  const [editWorkflowStartedAt, setEditWorkflowStartedAt] = useState<string | null>(null);
  const [editWorkflowCompletedAt, setEditWorkflowCompletedAt] = useState<string | null>(null);
  const [newWorkflowComment, setNewWorkflowComment] = useState("");
  const [settings, setSettings] = useState<SettingsDraft>(DEFAULT_USER_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const workflowSteps = ["Backlog", "Paused", "In Progress"] as const;
  const workflowIcon: Record<(typeof workflowSteps)[number], "backlog" | "progress" | "ready"> = {
    Backlog: "backlog",
    Paused: "progress",
    "In Progress": "ready"
  };

  async function loadItems() {
    if (!initialFeedLoaded) setSubmitMessage("Loading items...");
    const response = await fetch("/api/items", { cache: "no-store" });
    if (response.status === 401) {
      setAuthRequired(true);
      setInitialFeedLoaded(true);
      return;
    }
    if (!response.ok) {
      setSubmitMessage("Could not load items.");
      setInitialFeedLoaded(true);
      return;
    }
    const data = await response.json();
    setItems(data.items || []);
    setAuthRequired(false);
    setInitialFeedLoaded(true);
    setSubmitMessage("");
  }

  async function loadSettings() {
    const response = await fetch("/api/settings", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json().catch(() => ({}));
    const next = data?.settings || DEFAULT_USER_SETTINGS;
    setSettings(next);
  }

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setAuthRequired(false);
        void loadItems();
        void loadSettings();
      } else {
        setAuthRequired(true);
        setInitialFeedLoaded(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuthRequired(false);
        void loadItems();
        void loadSettings();
      } else {
        setAuthRequired(true);
        setItems([]);
        setInitialFeedLoaded(false);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setHydrated(true);
    setNowMs(Date.now());
    const timer = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("flowways:hidden-items");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setHiddenItemIds(parsed.filter((v) => typeof v === "string"));
    } catch {
      // ignore local storage parse errors
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("flowways:hidden-items", JSON.stringify(hiddenItemIds));
  }, [hiddenItemIds]);

  useEffect(() => {
    if (!petNotice || petNoticeTone !== "info") return;
    const timeoutId = window.setTimeout(() => {
      setPetNotice("");
    }, 30000);
    return () => window.clearTimeout(timeoutId);
  }, [petNotice, petNoticeTone]);

  function setColorTag(value: string) {
    selectedColorTagRef.current = value;
    setSelectedColorTag(value);
  }

  async function applySettings(next: SettingsDraft) {
    setSettingsBusy(true);
    setSettingsError("");
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next)
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setSettingsError(body.error || "Could not save settings.");
        return;
      }
      const data = await response.json();
      const resolved = data?.settings || next;
      setSettings(resolved);
    } finally {
      setSettingsBusy(false);
    }
  }

  function pickSassyQuip(kind: DbItem["kind"], title: string, merged: boolean): { text: string; face: string } {
    const cleanTitle = (title || "").trim();
    const shortTitle = cleanTitle.length > 36 ? `${cleanTitle.slice(0, 33)}...` : cleanTitle;

    if (merged) {
      const options = [
        { text: "Folded into your checklist. No duplicates on my watch.", face: "^_-" },
        { text: "Merged clean. Your list game is suspiciously strong.", face: "u_u" },
        { text: "Checklist upgraded. I even pretended it was hard.", face: "¬_¬" }
      ];
      return options[Math.floor(Math.random() * options.length)];
    }

    const byKind: Record<DbItem["kind"], { text: string; face: string }[]> = {
      timeline: [
        { text: `Timer locked: ${shortTitle || "that task"}. Try beating the clock this time.`, face: "o_o" },
        { text: `Scheduled: ${shortTitle || "timeline item"}. Time waits for nobody.`, face: "•_•" },
        { text: `Timeline set. ${shortTitle || "It"} is now officially your problem.`, face: "^_~" }
      ],
      workflow: [
        { text: `Workflow queued: ${shortTitle || "new work"}. Pretend this is under control.`, face: "¬‿¬" },
        { text: `Backlog fed with ${shortTitle || "a fresh task"}. Very corporate of you.`, face: "u_u" },
        { text: `Task pipelined: ${shortTitle || "it"}. Look at you being organized.`, face: "^_^" }
      ],
      checklist: [
        { text: `Checklist saved: ${shortTitle || "new list"}. Tiny boxes, big ambition.`, face: "•‿•" },
        { text: `List captured. ${shortTitle || "It"} now has accountability.`, face: "^_-" },
        { text: `Checklist ready. One more thing to cross off dramatically.`, face: "o_o" }
      ],
      journal: [
        { text: `Noted: ${shortTitle || "that thought"}. Future-you can decode this later.`, face: "¬_¬" },
        { text: `Journaled: ${shortTitle || "entry saved"}. Main character energy noted.`, face: "^_^" },
        { text: `Captured your note. Surprisingly coherent, too.`, face: "•_•" }
      ]
    };

    const pool = byKind[kind] || byKind.journal;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  async function submitItem() {
    if (!sourceText.trim() || authRequired) return;
    const colorTagAtSubmit = selectedColorTagRef.current;
    setBusy(true);
    setSubmitMessage("");
    setPetNotice("");
    setPetNoticeTone("info");
    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceText,
          modeHint: captureMode,
          petMode: settings.pet_mode,
          petEnabled: settings.pet_enabled,
          clientNow: new Date().toISOString(),
          clientTimezoneOffsetMinutes: new Date().getTimezoneOffset()
        })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setSubmitMessage(body.error || `Save failed (${response.status}).`);
        if (response.status === 400 && String(body.error || "").toLowerCase().includes("invalid timeline input")) {
          setPetNotice("Invalid timer. Please choose a future time.");
          setPetNoticeTone("error");
          setPetExpression("x_x");
        }
        return;
      }

      const data = await response.json();
      const createdId: string | undefined = data?.item?.id;
      if (colorTagAtSubmit && createdId) {
        const existing = Array.isArray(data?.item?.labels) ? data.item.labels : [];
        const withoutOldColor = existing.filter((label: string) => !label.startsWith("color-"));
        await updateItem(createdId, { labels: [...new Set([...withoutOldColor, colorTagAtSubmit])] });
      }
      setSubmitMessage(
        data.merged
          ? `Merged into existing checklist.`
          : `Saved as ${data.classification.kind}: ${data.classification.title}`
      );
      const serverQuip = String(data?.classification?.pet_quip || "").trim();
      const quip = serverQuip
        ? { text: serverQuip, face: settings.pet_mode === "monster" ? ">:)" : settings.pet_mode === "meh" ? "-_-" : "^_^" }
        : pickSassyQuip(data.classification.kind, data.classification.title, Boolean(data.merged));
      if (settings.pet_enabled) {
        setPetNotice(quip.text);
        setPetNoticeTone("info");
        setPetExpression(quip.face);
      } else {
        setPetNotice("");
      }
      setSourceText("");
      await loadItems();
    } catch {
      setSubmitMessage("Save failed due to a network or server error.");
      setPetNotice("Something went wrong. Try again.");
      setPetNoticeTone("error");
      setPetExpression("x_x");
    } finally {
      setBusy(false);
    }
  }

  function runSearch() {
    setSearchText(sourceText.trim().toLowerCase());
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

  function hideItem(id: string) {
    setHiddenItemIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setSubmitMessage("Item hidden from view. Use Undo before completion to bring full actions back.");
  }

  function startEdit(item: DbItem) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditBody(item.body || "");
    setEditChecklistEntries(parseChecklistItems(item.body || item.title));
    setEditTimelineDueAt(item.due_at ? toDatetimeLocal(item.due_at) : "");
    if (item.kind === "timeline" && item.due_at) {
      const dueMs = new Date(item.due_at).getTime();
      if (!Number.isNaN(dueMs)) {
        const remainingMin = Math.max(1, Math.floor((dueMs - nowMs) / 60000));
        setEditTimelineOffsetMin(String(remainingMin));
      } else {
        setEditTimelineOffsetMin("15");
      }
    } else {
      setEditTimelineOffsetMin("15");
    }
    const workflow = parseWorkflowBody(item.body || "");
    setEditWorkflowSummary(workflow.summary);
    setEditWorkflowComments(workflow.comments);
    setEditWorkflowStartedAt(workflow.startedAt);
    setEditWorkflowCompletedAt(workflow.completedAt);
    setNewWorkflowComment("");
  }

  async function saveEdit(id: string) {
    const item = items.find((v) => v.id === id);
    if (!item) return;

    if (item.kind === "checklist") {
      const normalized = editChecklistEntries.map((e) => ({ ...e, text: e.text.trim() })).filter((e) => e.text);
      const body = toChecklistMarkdown(normalized);
      await updateItem(id, { title: editTitle.trim() || "Untitled", body, checked: normalized.length ? normalized.every((e) => e.checked) : false });
      setEditingId(null);
      return;
    }

    if (item.kind === "timeline") {
      const dueAt = editTimelineDueAt ? new Date(editTimelineDueAt).toISOString() : null;
      await updateItem(id, { title: editTitle.trim() || "Untitled", dueAt });
      setEditingId(null);
      return;
    }

    if (item.kind === "workflow") {
      const body = buildWorkflowBody(editWorkflowSummary, editWorkflowComments, editWorkflowStartedAt, editWorkflowCompletedAt);
      await updateItem(id, { title: editTitle.trim() || "Untitled", body });
      setEditingId(null);
      return;
    }

    await updateItem(id, { title: editTitle.trim() || "Untitled", body: editBody });
    setEditingId(null);
  }

  function toDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function parseWorkflowBody(body: string): { summary: string; comments: string[]; startedAt: string | null; completedAt: string | null } {
    const [main = "", meta = ""] = body.split("\n\nMeta:\n");
    const parts = main.split("\n\nComments:\n");
    const summary = parts[0] || "";
    const comments = (parts[1] || "")
      .split("\n")
      .map((line) => line.replace(/^- /, "").trim())
      .filter(Boolean);
    const metaLines = meta.split("\n").map((line) => line.trim()).filter(Boolean);
    const startedAt = metaLines.find((line) => line.toLowerCase().startsWith("startedat:"))?.replace(/^startedAt:\s*/i, "") || null;
    const completedAt = metaLines.find((line) => line.toLowerCase().startsWith("completedat:"))?.replace(/^completedAt:\s*/i, "") || null;
    return { summary, comments, startedAt, completedAt };
  }

  function buildWorkflowBody(summary: string, comments: string[], startedAt: string | null, completedAt: string | null): string {
    const cleanSummary = summary.trim();
    const cleanComments = comments.map((c) => c.trim()).filter(Boolean);
    const sections: string[] = [];
    if (cleanSummary) sections.push(cleanSummary);
    if (cleanComments.length) sections.push(`Comments:\n${cleanComments.map((c) => `- ${c}`).join("\n")}`);
    const metaLines: string[] = [];
    if (startedAt) metaLines.push(`startedAt: ${startedAt}`);
    if (completedAt) metaLines.push(`completedAt: ${completedAt}`);
    if (metaLines.length) sections.push(`Meta:\n${metaLines.join("\n")}`);
    return sections.join("\n\n");
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
    return candidates.length > 0;
  }

  function parseChecklistItems(body: string): { text: string; checked: boolean }[] {
    const normalized = body.trim();
    if (!normalized) return [];

    const lines = normalized.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const markdownLines = lines.filter((line) => /^- \[( |x)\]\s+/i.test(line));
    if (markdownLines.length && markdownLines.length === lines.length) {
      return markdownLines.map((line) => ({
        checked: /\[x\]/i.test(line),
        text: line.replace(/^- \[( |x)\]\s+/i, "").trim()
      }));
    }

    const numberedInline = [...normalized.matchAll(/\d+\.\s+(.+?)(?=(?:\s+\d+\.\s+)|$)/g)]
      .map((match) => (match[1] || "").trim())
      .filter(Boolean);
    if (numberedInline.length >= 2) {
      return numberedInline.map((text) => ({ text, checked: false }));
    }

    if (lines.length > 1) {
      return lines.map((line) => ({ text: line.replace(/^[-*]\s+/, ""), checked: false }));
    }

    const splitByDelimiters = normalized
      .split(/[;,]/)
      .map((token) => token.trim())
      .filter(Boolean);
    if (splitByDelimiters.length >= 2) {
      return splitByDelimiters.map((text) => ({ text, checked: false }));
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
    const workflow = parseWorkflowBody(item.body || "");
    let startedAt = workflow.startedAt;
    let completedAt = workflow.completedAt;

    if (status === "In Progress") {
      if (!startedAt) startedAt = new Date().toISOString();
      completedAt = null;
    }

    const body = buildWorkflowBody(workflow.summary, workflow.comments, startedAt, completedAt);
    await updateItem(item.id, { workflowStatus: status, checked: false, body });
  }

  async function toggleWorkflowDone(item: DbItem, checked: boolean) {
    const workflow = parseWorkflowBody(item.body || "");
    let startedAt = workflow.startedAt;
    let completedAt = workflow.completedAt;

    if (checked) {
      if (!startedAt) startedAt = new Date().toISOString();
      completedAt = new Date().toISOString();
    } else {
      completedAt = null;
    }

    const body = buildWorkflowBody(workflow.summary, workflow.comments, startedAt, completedAt);
    await updateItem(item.id, { checked, body });
  }

  function timelineState(dueAt: string | null) {
    if (!dueAt) return { done: false, label: "No due time set" };
    if (!hydrated) return { done: false, label: "Calculating..." };
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
    if (!hydrated) return 0;
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
    if (item.kind !== "workflow") return null;
    const workflow = parseWorkflowBody(item.body || "");
    if (!workflow.startedAt) return null;
    const startMs = new Date(workflow.startedAt).getTime();
    if (Number.isNaN(startMs)) return null;
    const endMs = workflow.completedAt ? new Date(workflow.completedAt).getTime() : (hydrated ? nowMs : startMs);
    if (Number.isNaN(endMs) || endMs <= startMs) return null;
    const deltaMin = Math.max(1, Math.floor((endMs - startMs) / 60000));
    if (deltaMin < 60) return `${deltaMin}m spent`;
    const hours = Math.floor(deltaMin / 60);
    const mins = deltaMin % 60;
    return mins ? `${hours}h ${mins}m spent` : `${hours}h spent`;
  }

  function Icon({ name }: { name: "done" | "undo" | "edit" | "delete" | "save" | "cancel" | "hide" | "add" | "backlog" | "ready" | "progress" | "review" | "search" | "show" | "signout" | "settings" | "petNo" | "petPro" | "petMeh" | "petNuclear" | "timeline" | "workflow" | "journal" | "checklist" | "auto" | "color" | "tags" | "labelPet" | "labelFont" | "labelText" | "labelColor" | "labelTheme" }) {
    const common = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
    if (name === "done" || name === "save") return <svg {...common}><path d="M3 8.5l3 3L13 4.5" /></svg>;
    if (name === "undo" || name === "cancel") return <svg {...common}><path d="M6 4L2.5 7.5 6 11" /><path d="M3 7.5h5.5A4.5 4.5 0 1 1 8.5 16" /></svg>;
    if (name === "edit") return <svg {...common}><path d="M10.8 2.2l3 3-7.8 7.8-3.6.6.6-3.6z" /></svg>;
    if (name === "delete") return <svg {...common}><path d="M4.2 4.2l7.6 7.6M11.8 4.2l-7.6 7.6" /></svg>;
    if (name === "hide") return <svg {...common}><path d="M1.5 8s2.4-4 6.5-4 6.5 4 6.5 4-2.4 4-6.5 4-6.5-4-6.5-4z" /><path d="M1.5 1.5l13 13" /></svg>;
    if (name === "signout") return <svg {...common}><path d="M9.5 3h3v10h-3" /><path d="M8 8H2.8" /><path d="M5.2 5.6 2.8 8l2.4 2.4" /></svg>;
    if (name === "settings") return <svg {...common}><circle cx="8" cy="8" r="2.2" /><path d="M8 2.2v1.4M8 12.4v1.4M13.8 8h-1.4M3.6 8H2.2M11.9 4.1l-1 1M5.1 10.9l-1 1M11.9 11.9l-1-1M5.1 5.1l-1-1" /></svg>;
    if (name === "petNo") return <svg {...common}><path d="M4 4l8 8M12 4 4 12" /></svg>;
    if (name === "petPro") return <svg {...common}><path d="M5.2 6.2h5.6a1.2 1.2 0 0 1 1.2 1.2v2.8a1.2 1.2 0 0 1-1.2 1.2H5.2A1.2 1.2 0 0 1 4 10.2V7.4a1.2 1.2 0 0 1 1.2-1.2z" /><path d="M6.3 6.2V5.3a1.2 1.2 0 0 1 1.2-1.2h1a1.2 1.2 0 0 1 1.2 1.2v.9" /></svg>;
    if (name === "petMeh") return <svg {...common}><path d="M4.2 6.2h1.6M10.2 6.2h1.6" /><path d="M5 10h6" /></svg>;
    if (name === "petNuclear") return <svg {...common}><circle cx="8" cy="8" r="1.2" /><path d="M8 3.2v2.3M11.9 5l-1.9 1.2M4.1 5l1.9 1.2M8 12.8v-2.3M11.9 11l-1.9-1.2M4.1 11l1.9-1.2" /></svg>;
    if (name === "labelPet") return <svg {...common}><circle cx="5" cy="5" r="1.2" /><circle cx="11" cy="5" r="1.2" /><circle cx="8" cy="8.2" r="1.4" /><path d="M4.4 11.8c1 .8 2 .9 3.6.9 1.7 0 2.7-.1 3.7-.9" /></svg>;
    if (name === "labelFont") return <svg {...common}><path d="M3 12.5 7 3.5h2l4 9" /><path d="M5.2 9.2h5.6" /></svg>;
    if (name === "labelText") return <svg {...common}><path d="M3 4h10M8 4v8M5.8 12h4.4" /></svg>;
    if (name === "labelColor") return <svg {...common}><path d="M5.8 10.8 9.7 6.9a1.2 1.2 0 0 1 1.7 1.7l-3.9 3.9a1.6 1.6 0 0 1-1.2.5h-.8v-.8a1.7 1.7 0 0 1 .3-1.4z" /><circle cx="10.8" cy="7.8" r=".7" /></svg>;
    if (name === "labelTheme") return <svg {...common}><path d="M2.8 8h10.4" /><path d="M8 2.8v10.4" /><circle cx="8" cy="8" r="1.2" /></svg>;
    if (name === "add") return <svg {...common}><path d="M8 3.2v9.6M3.2 8h9.6" /></svg>;
    if (name === "search") return <svg {...common}><circle cx="7" cy="7" r="4.3" /><path d="M10.3 10.3 13.5 13.5" /></svg>;
    if (name === "show") return <svg {...common}><path d="M1.5 8s2.4-4 6.5-4 6.5 4 6.5 4-2.4 4-6.5 4-6.5-4-6.5-4z" /><circle cx="8" cy="8" r="1.5" /></svg>;
    if (name === "auto") return <svg {...common}><path d="M8 2.8v10.4" /><path d="M2.8 8h10.4" /><circle cx="8" cy="8" r="1.6" /></svg>;
    if (name === "timeline") return <svg {...common}><circle cx="8" cy="8" r="5.5" /><path d="M8 5v3.2l2.2 1.2" /></svg>;
    if (name === "workflow") return <svg {...common}><path d="M4.3 6.4h7.4a.9.9 0 0 1 .9.9v3.8a.9.9 0 0 1-.9.9H4.3a.9.9 0 0 1-.9-.9V7.3a.9.9 0 0 1 .9-.9z" /><path d="M6 6.4V5.3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.1" /><path d="M7.4 8.9h1.2" /></svg>;
    if (name === "journal") return <svg {...common}><path d="M4 2.8h7.5a1 1 0 0 1 1 1v8.4a1 1 0 0 1-1 1H4" /><path d="M4 2.8v10.4" /><path d="M6.2 5.6h4M6.2 8h4" /></svg>;
    if (name === "checklist") return <svg {...common}><path d="M6.5 5.2h5M6.5 8h5M6.5 10.8h5" /><path d="M3.2 5.2 4 6l1.1-1.2M3.2 8 4 8.8l1.1-1.2M3.2 10.8 4 11.6l1.1-1.2" /></svg>;
    if (name === "color") return <svg {...common}><path d="M6.1 10 10 6.1a1.2 1.2 0 0 1 1.7 1.7l-3.9 3.9a1.6 1.6 0 0 1-1.2.5h-.8v-.8a1.7 1.7 0 0 1 .3-1.4z" /><circle cx="10.9" cy="6.9" r=".7" /></svg>;
    if (name === "tags") return <svg {...common}><path d="M2.5 8.2 8.2 2.5h4.3v4.3L6.8 12.5a1 1 0 0 1-1.4 0L2.5 9.6a1 1 0 0 1 0-1.4z" /><circle cx="10.1" cy="5.9" r=".7" /></svg>;
    if (name === "backlog") return <svg {...common}><path d="M11.5 8H4.2" /><path d="M6.9 5.3 4.2 8l2.7 2.7" /></svg>;
    if (name === "ready") return <svg {...common}><path d="M5 4.2 11.8 8 5 11.8z" /></svg>;
    if (name === "progress") return <svg {...common}><path d="M5.8 4v8M10.2 4v8" /></svg>;
    return <svg {...common}><circle cx="8" cy="8" r="5.2" /><circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none" /></svg>;
  }

  const baseVisibleItems = items
    .filter((item) => showHidden || !hiddenItemIds.includes(item.id))
    .filter((item) => captureMode === "auto" ? true : item.kind === captureMode)
    .filter((item) => {
      if (!searchText) return true;
      const haystack = `${item.title} ${item.body} ${(item.labels || []).join(" ")}`.toLowerCase();
      return haystack.includes(searchText);
    })
    .filter((item) => !selectedColorTag || (item.labels || []).includes(selectedColorTag));

  const availableTagFilters = [...new Set(baseVisibleItems.flatMap((item) => item.labels || []).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  const visibleItems = baseVisibleItems.filter((item) => {
    if (!activeTagFilters.length) return true;
    const labels = item.labels || [];
    if (tagMatchMode === "AND") return activeTagFilters.every((tag) => labels.includes(tag));
    return activeTagFilters.some((tag) => labels.includes(tag));
  });

  const sortedItems = [...visibleItems].sort((a, b) => {
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

  const overduePetCount = items
    .filter((item) => (showHidden || !hiddenItemIds.includes(item.id)))
    .filter((item) => item.kind === "timeline" && !item.checked && item.due_at)
    .filter((item) => {
      const dueMs = new Date(item.due_at as string).getTime();
      return Number.isFinite(dueMs) && dueMs <= nowMs;
    }).length;

  const autoPetNotice = overduePetCount > 0
    ? `Overdue: ${overduePetCount} timeline ${overduePetCount === 1 ? "item" : "items"}`
    : "";
  const resolvedPetNotice = settings.pet_enabled ? (showHidden ? "Hide mode" : (petNotice || autoPetNotice)) : "";
  const resolvedPetTone: "info" | "warning" | "error" = settings.pet_enabled
    ? (showHidden ? "info" : (petNotice ? petNoticeTone : (autoPetNotice ? "warning" : "info")))
    : "info";
  const systemNotice = !settings.pet_enabled
    ? (showHidden ? "Hide mode" : (petNotice || autoPetNotice || ""))
    : "";
  const resolvedPetFace = busy
    ? "•_•"
    : resolvedPetTone === "error"
      ? "x_x"
      : resolvedPetTone === "warning"
        ? "!_!"
        : showHidden
          ? "(o_o)"
          : petExpression;

  function formatMetaDate(item: DbItem): string | null {
    const raw = item.due_at || item.created_at;
    if (!raw || !hydrated) return null;
    const ms = new Date(raw).getTime();
    if (Number.isNaN(ms)) return null;
    return new Date(raw).toLocaleString();
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

  const colorKeys = ["red", "blue", "green", "amber", "violet"] as const;
  const colorTagIds = colorKeys.map((key) => `color-${key}` as const);
  const fontOptions = [
    { key: "avenir" as const, label: "A", title: "Avenir" },
    { key: "inter" as const, label: "M", title: "Inter" },
    { key: "plex" as const, label: "J", title: "IBM Plex Sans" },
    { key: "rounded" as const, label: "R", title: "Nunito Rounded" },
    { key: "mono" as const, label: "P", title: "IBM Plex Mono" }
  ];
  const themeOptions = [
    { key: "classic" as const, label: "C", title: "Classic Minimal" },
    { key: "neo" as const, label: "N", title: "Neo-Soft" },
    { key: "midnight" as const, label: "M", title: "Midnight Neon" },
    { key: "bold" as const, label: "B", title: "Bold Dashboard" }
  ];
  const petProfile = !settings.pet_enabled
    ? "off"
    : settings.pet_mode === "monster"
      ? "monster"
      : settings.pet_mode === "meh"
        ? "meh"
        : "sweet";
  const themeStyle = {
    ["--tag-red" as string]: settings.color_palette.red,
    ["--tag-blue" as string]: settings.color_palette.blue,
    ["--tag-green" as string]: settings.color_palette.green,
    ["--tag-amber" as string]: settings.color_palette.amber,
    ["--tag-violet" as string]: settings.color_palette.violet
  } as CSSProperties;

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
    <main className={`page font-${settings.font_family} size-${settings.font_size} theme-${settings.theme}`} style={themeStyle}>
      <header className="topbar">
        <div>
          <h1>FlowWays</h1>
          <p className="subtitle">Capture, classify, edit, and manage memory items.</p>
        </div>
        <div className="topbarActions">
          <button
            type="button"
            className={`iconAction topbarAction${showSettings ? " active" : ""}`}
            aria-label="Settings"
            title="Settings"
            onClick={() => {
              setSettingsError("");
              setShowSettings((prev) => !prev);
            }}
          >
            <Icon name="settings" />
          </button>
          <button type="button" className="iconAction topbarAction" aria-label="Sign Out" title="Sign Out" onClick={signOut}><Icon name="signout" /></button>
        </div>
      </header>

      <section className="captureShell">
      <section className="capture">
        {settings.pet_enabled ? (
          <div className={`pixelPal${busy ? " isBusy" : ""}${resolvedPetNotice ? " hasNotice" : ""}${resolvedPetTone === "warning" ? " isWarning" : ""}${resolvedPetTone === "error" ? " isError" : ""}${showHidden ? " isGhost" : ""}`} aria-live="polite" aria-label={busy ? "Classifying task..." : resolvedPetNotice || (showHidden ? "Hidden tasks mode" : "Idle")}>
            <span className="pixelPalFace" aria-hidden="true">{resolvedPetFace}</span>
            {busy ? (
              <span className="pixelPalText">Classifying...</span>
            ) : resolvedPetNotice ? (
              <span className="pixelPalText">{resolvedPetNotice}</span>
            ) : null}
          </div>
        ) : systemNotice ? (
          <div className="systemNotice" aria-live="polite">{systemNotice}</div>
        ) : null}
        <div className="captureBar">
          <input
            id="captureInput"
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              if (busy || !sourceText.trim()) return;
              void submitItem();
            }}
            placeholder="Add task | Search"
          />
          <div className="modeActions" aria-label="Classification mode">
            <button type="button" className={`iconAction compact${captureMode === "auto" ? " active" : ""}`} aria-label="Auto mode" title="Auto mode" onClick={() => setCaptureMode("auto")}><Icon name="auto" /></button>
            <button type="button" className={`iconAction compact${captureMode === "timeline" ? " active" : ""}`} aria-label="Timeline mode" title="Timeline mode" onClick={() => setCaptureMode("timeline")}><Icon name="timeline" /></button>
            <button type="button" className={`iconAction compact${captureMode === "workflow" ? " active" : ""}`} aria-label="Workflow mode" title="Workflow mode" onClick={() => setCaptureMode("workflow")}><Icon name="workflow" /></button>
            <button type="button" className={`iconAction compact${captureMode === "journal" ? " active" : ""}`} aria-label="Journal mode" title="Journal mode" onClick={() => setCaptureMode("journal")}><Icon name="journal" /></button>
            <button type="button" className={`iconAction compact${captureMode === "checklist" ? " active" : ""}`} aria-label="Checklist mode" title="Checklist mode" onClick={() => setCaptureMode("checklist")}><Icon name="checklist" /></button>
            <div className="colorPickerWrap">
              <button
                type="button"
                className={`iconAction compact${selectedColorTag ? ` colorActive ${selectedColorTag}` : ""}`}
                aria-label="Color tag"
                title="Color tag"
                onClick={() => {
                  if (selectedColorTag) {
                    setColorTag("");
                    setShowColorPicker(true);
                    return;
                  }
                  setShowColorPicker((prev) => !prev);
                }}
              >
                <Icon name="color" />
              </button>
              {showColorPicker ? (
                <div className="colorPopover">
                  <button type="button" className="colorDot clear" onClick={() => { setColorTag(""); setShowColorPicker(false); }} title="No color">×</button>
                  {colorTagIds.map((c) => (
                    <button
                      type="button"
                      key={c}
                      className={`colorDot${selectedColorTag === c ? " active" : ""}`}
                      style={{ background: settings.color_palette[c.replace("color-", "") as keyof typeof settings.color_palette] }}
                      onClick={() => { setColorTag(c); setShowColorPicker(false); }}
                      title={c.replace("color-", "")}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <div className="captureActions">
            <button type="button" className="iconAction" aria-label="Add task" title="Add task" onClick={() => void submitItem()} disabled={busy || !sourceText.trim()}><Icon name="add" /></button>
            <button type="button" className="iconAction" aria-label="Search tasks" title="Search tasks" onClick={runSearch}><Icon name="search" /></button>
            <button type="button" className={`iconAction${showTagWindow ? " active" : ""}`} aria-label="Tag filters" title="Tag filters" onClick={() => setShowTagWindow((prev) => !prev)}><Icon name="tags" /></button>
            <button type="button" className={`iconAction${showHidden ? " active" : ""}`} aria-label={showHidden ? "Hide hidden tasks" : "Show hidden tasks"} title={showHidden ? "Hide hidden tasks" : "Show hidden tasks"} onClick={() => setShowHidden((prev) => !prev)}><Icon name={showHidden ? "show" : "hide"} /></button>
          </div>
        </div>
        {showTagWindow ? (
          <div className="tagWindow" aria-label="Tag filters window">
            <div className="tagWindowTop">
              <div className="tagMatchToggle">
                <button type="button" className={tagMatchMode === "AND" ? "active" : ""} onClick={() => setTagMatchMode("AND")}>AND</button>
                <button type="button" className={tagMatchMode === "OR" ? "active" : ""} onClick={() => setTagMatchMode("OR")}>OR</button>
              </div>
              <button type="button" className="tagClear" onClick={() => setActiveTagFilters([])} disabled={!activeTagFilters.length}>Clear tags</button>
            </div>
            <div className="tagWindowChips">
              {availableTagFilters.length === 0 ? <span className="tagWindowEmpty">No tags in current result.</span> : null}
              {availableTagFilters.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={activeTagFilters.includes(tag) ? `tagChip active${tag.startsWith("color-") ? ` colorTag ${tag}` : ""}` : `tagChip${tag.startsWith("color-") ? ` colorTag ${tag}` : ""}`}
                  onClick={() => setActiveTagFilters((prev) => prev.includes(tag) ? prev.filter((v) => v !== tag) : [...prev, tag])}
                >
                  {tag.startsWith("color-") ? <span className="colorSwatch" aria-hidden="true" /> : null}
                  {tag.startsWith("color-") ? tag.replace("color-", "") : `#${tag}`}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>
      {showSettings ? (
        <section className="settingsDock" aria-label="Settings">
          <div className="settingsModal settingsInline">
            <div className="settingsInner">
              <div className="settingsGrid">
                <div className="settingsRow">
                  <span className="settingsLabelIcon" aria-hidden="true"><Icon name="labelPet" /></span>
                  <div className="settingsIconRail">
                    {(["off", "sweet", "meh", "monster"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                      className={`iconAction compact ${petProfile === mode ? "active" : ""}`}
                      title={mode === "off" ? "no" : mode === "sweet" ? "professional" : mode === "meh" ? "meh" : "nuclear"}
                      onClick={() => {
                        const next = mode === "off"
                          ? { ...settings, pet_enabled: false }
                          : { ...settings, pet_enabled: true, pet_mode: mode };
                        setSettings(next);
                        void applySettings(next);
                      }}
                      disabled={settingsBusy}
                    >
                      <Icon name={mode === "off" ? "petNo" : mode === "sweet" ? "petPro" : mode === "meh" ? "petMeh" : "petNuclear"} />
                    </button>
                  ))}
                </div>
                </div>

                <div className="settingsRow">
                  <span className="settingsLabelIcon" aria-hidden="true"><Icon name="labelFont" /></span>
                  <div className="settingsIconRail">
                    {fontOptions.map((font) => (
                      <button
                        key={font.key}
                        type="button"
                        className={`iconAction compact glyphButton ${settings.font_family === font.key ? "active" : ""}`}
                        title={font.title}
                        onClick={() => {
                          const next = { ...settings, font_family: font.key };
                          setSettings(next);
                          void applySettings(next);
                        }}
                        disabled={settingsBusy}
                      >
                        {font.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="settingsRow">
                  <span className="settingsLabelIcon" aria-hidden="true"><Icon name="labelText" /></span>
                  <div className="settingsIconRail">
                    {(["s", "m", "l"] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        className={`iconAction compact glyphButton sizeGlyph ${settings.font_size === size ? "active" : ""}`}
                        title={`Text ${size.toUpperCase()}`}
                        onClick={() => {
                          const next = { ...settings, font_size: size };
                          setSettings(next);
                          void applySettings(next);
                        }}
                        disabled={settingsBusy}
                      >
                        {size.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="settingsRow">
                  <span className="settingsLabelIcon" aria-hidden="true"><Icon name="labelTheme" /></span>
                  <div className="settingsIconRail">
                    {themeOptions.map((theme) => (
                      <button
                        key={theme.key}
                        type="button"
                        className={`iconAction compact glyphButton ${settings.theme === theme.key ? "active" : ""}`}
                        title={theme.title}
                        onClick={() => {
                          const next = { ...settings, theme: theme.key };
                          setSettings(next);
                          void applySettings(next);
                        }}
                        disabled={settingsBusy}
                      >
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="settingsRow colorSettings">
                  <span className="settingsLabelIcon" aria-hidden="true"><Icon name="labelColor" /></span>
                  <div className="settingsIconRail">
                    {colorKeys.map((key) => (
                      <label key={key} className="paletteCell" title={key}>
                        <span className="srOnly">{key}</span>
                        <button
                          type="button"
                          className="colorDot"
                          style={{ background: settings.color_palette[key] }}
                          onClick={() => settingsColorInputRefs.current[key]?.click()}
                          disabled={settingsBusy}
                        >
                          <span aria-hidden="true">-</span>
                        </button>
                        <input
                          type="color"
                          ref={(node) => { settingsColorInputRefs.current[key] = node; }}
                          className="hiddenColorInput"
                          value={settings.color_palette[key]}
                          onChange={(event) => {
                            const next = {
                              ...settings,
                              color_palette: { ...settings.color_palette, [key]: event.target.value }
                            };
                            setSettings(next);
                            void applySettings(next);
                          }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {settingsError ? <p className="settingsError">{settingsError}</p> : null}
          </div>
        </section>
      ) : null}
      </section>

      <section className="feedShell" aria-label="Saved items">
        <div className="feed">
        <div className="feedCards">
        {sortedItems.length === 0 ? <p className="empty">{initialFeedLoaded ? "No items yet." : "Loading items..."}</p> : null}
        {sortedItems.map((item) => {
          const timeState = item.kind === "timeline" ? timelineState(item.due_at) : null;
          const metaDate = formatMetaDate(item);
          const isTimelineExpired = item.kind === "timeline" && !item.checked && Boolean(timeState?.done);
          const isDone = Boolean(item.checked);
          const isHiddenItem = hiddenItemIds.includes(item.id);
          const colorLabel = (item.labels || []).find((label) => label.startsWith("color-"));
          return (
          <article key={item.id} className={`item item-${item.kind}${isTimelineExpired ? " item-timeline-alert" : ""}${isDone ? " item-done" : ""}${isHiddenItem ? " item-hidden" : ""}${colorLabel ? ` ${colorLabel}` : ""}`}>
            <div className="itemHead">
              <span className="kind">
                <Icon name={item.kind} />
                <span>{item.title}</span>
              </span>
              <div className="actions">
                {item.checked ? (
                  <>
                    <button type="button" className="iconAction" aria-label="Undo" title="Undo" onClick={() => item.kind === "workflow" ? toggleWorkflowDone(item, false) : updateItem(item.id, { checked: false })}><Icon name="undo" /></button>
                    <button type="button" className="iconAction" aria-label="Hide" title="Hide" onClick={() => hideItem(item.id)}><Icon name="hide" /></button>
                  </>
                ) : (
                  <>
                    {editingId === item.id ? (
                      <>
                        <button type="button" className="iconAction" aria-label="Save" title="Save" onClick={() => saveEdit(item.id)}><Icon name="save" /></button>
                        <button type="button" className="iconAction" aria-label="Cancel" title="Cancel" onClick={() => setEditingId(null)}><Icon name="cancel" /></button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="iconAction" aria-label="Done" title="Done" onClick={() => item.kind === "workflow" ? toggleWorkflowDone(item, true) : updateItem(item.id, { checked: true })}><Icon name="done" /></button>
                        <button type="button" className="iconAction" aria-label="Edit" title="Edit" onClick={() => startEdit(item)}><Icon name="edit" /></button>
                        <button type="button" className="iconAction danger" aria-label="Delete" title="Delete" onClick={() => deleteItem(item.id)}><Icon name="delete" /></button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {editingId === item.id ? (
              <div className="editor">
                <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
                {item.kind === "checklist" ? (
                  <div className="typeEditor">
                    {editChecklistEntries.map((entry, index) => (
                      <div key={`${item.id}-edit-check-${index}`} className="editRow">
                        <input
                          type="checkbox"
                          checked={entry.checked}
                          onChange={(event) => setEditChecklistEntries((prev) => prev.map((v, i) => i === index ? { ...v, checked: event.target.checked } : v))}
                        />
                        <input
                          value={entry.text}
                          onChange={(event) => setEditChecklistEntries((prev) => prev.map((v, i) => i === index ? { ...v, text: event.target.value } : v))}
                        />
                        <button type="button" className="iconAction compact danger" aria-label="Remove item" title="Remove item" onClick={() => setEditChecklistEntries((prev) => prev.filter((_, i) => i !== index))}><Icon name="delete" /></button>
                      </div>
                    ))}
                    <button type="button" className="iconAction compact" aria-label="Add item" title="Add item" onClick={() => setEditChecklistEntries((prev) => [...prev, { text: "", checked: false }])}><Icon name="add" /></button>
                  </div>
                ) : item.kind === "timeline" ? (
                  <div className="typeEditor">
                    <div className="editRow">
                      <label>Exact time</label>
                      <input
                        type="datetime-local"
                        value={editTimelineDueAt}
                        onChange={(event) => setEditTimelineDueAt(event.target.value)}
                      />
                    </div>
                    <div className="editRow">
                      <label>In minutes</label>
                      <input
                        type="number"
                        min={1}
                        value={editTimelineOffsetMin}
                        onChange={(event) => setEditTimelineOffsetMin(event.target.value)}
                      />
                      <button
                        type="button"
                        className="iconAction compact"
                        aria-label="Apply minutes"
                        title="Apply minutes"
                        onClick={() => {
                          const n = Number(editTimelineOffsetMin);
                          if (!Number.isFinite(n) || n <= 0) return;
                          setEditTimelineDueAt(toDatetimeLocal(new Date(Date.now() + n * 60000).toISOString()));
                        }}
                      >
                        <Icon name="save" />
                      </button>
                    </div>
                  </div>
                ) : item.kind === "workflow" ? (
                  <div className="typeEditor">
                    <textarea value={editWorkflowSummary} onChange={(event) => setEditWorkflowSummary(event.target.value)} />
                    <div className="commentList">
                      {editWorkflowComments.map((comment, index) => (
                        <div key={`${item.id}-comment-${index}`} className="editRow">
                          <input
                            value={comment}
                            onChange={(event) => setEditWorkflowComments((prev) => prev.map((v, i) => i === index ? event.target.value : v))}
                          />
                          <button type="button" className="iconAction compact danger" aria-label="Remove comment" title="Remove comment" onClick={() => setEditWorkflowComments((prev) => prev.filter((_, i) => i !== index))}><Icon name="delete" /></button>
                        </div>
                      ))}
                    </div>
                    <div className="editRow">
                      <input
                        placeholder="Add workflow comment"
                        value={newWorkflowComment}
                        onChange={(event) => setNewWorkflowComment(event.target.value)}
                      />
                      <button
                        type="button"
                        className="iconAction compact"
                        aria-label="Add comment"
                        title="Add comment"
                        onClick={() => {
                          const next = newWorkflowComment.trim();
                          if (!next) return;
                          setEditWorkflowComments((prev) => [...prev, next]);
                          setNewWorkflowComment("");
                        }}
                      >
                        <Icon name="add" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <textarea value={editBody} onChange={(event) => setEditBody(event.target.value)} />
                )}
              </div>
            ) : (
              <>
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
                    {(() => {
                      const wf = parseWorkflowBody(item.body || "");
                      return (
                        <>
                          {wf.summary ? <p>{wf.summary}</p> : null}
                          {wf.comments.length ? (
                            <div className="workflowComments">
                              {wf.comments.map((comment, idx) => <p key={`${item.id}-wf-comment-${idx}`}>- {comment}</p>)}
                            </div>
                          ) : null}
                        </>
                      );
                    })()}
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
              {metaDate ? <span className="dateChip">{metaDate}</span> : null}
              {item.kind === "timeline" && !item.checked && timeState?.done ? <span className="overdueTagChip">OVER DUE</span> : null}
              {item.kind === "workflow" && formatTimeSpent(item) ? <span className="dateChip">{formatTimeSpent(item)}</span> : null}
              {item.labels?.map((label) => {
                const isColorLabel = label.startsWith("color-");
                const colorName = label.replace("color-", "");
                return (
                  <button
                    type="button"
                    className={`${activeTagFilters.includes(label) ? "tagChip active" : "tagChip"}${isColorLabel ? ` colorTag ${label}` : ""}`}
                    key={label}
                    onClick={() => {
                      setActiveTagFilters((prev) => prev.includes(label) ? prev.filter((v) => v !== label) : [...prev, label]);
                      if (!showTagWindow) setShowTagWindow(true);
                    }}
                  >
                    {isColorLabel ? <span className="colorSwatch" aria-hidden="true" /> : null}
                    {isColorLabel ? colorName : `#${label}`}
                  </button>
                );
              })}
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
        </div>
        </div>
      </section>
    </main>
  );
}

