"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { getSupabaseBrowserClient } from "@/shared/supabase-browser";
import { DEFAULT_USER_SETTINGS, type UserSettings } from "@/shared/types/settings";
import { defaultTimelineMeta, nextOccurrenceFromRule, type RecurrenceRule, type TimelineMeta, type TimelineSubtype } from "@/shared/domain/timeline";
import { defaultJournalMeta, type JournalMeta, type JournalSubtype } from "@/shared/domain/journal";

interface DbItem {
  id: string;
  kind: "checklist" | "journal" | "workflow" | "timeline";
  title: string;
  body: string;
  labels: string[];
  due_at: string | null;
  timeline_meta?: {
    timeline_subtype: TimelineSubtype;
    remind_at: string | null;
    remind_lead_minutes: number;
    recurrence_rule: {
      frequency: "daily" | "weekly" | "monthly";
      interval: number;
      byWeekday?: number[];
      time: string;
    } | null;
    countup_started_at: string | null;
    countup_stopped_at: string | null;
    last_notified_at?: string | null;
    last_notified_occurrence_at?: string | null;
  } | null;
  journal_meta?: {
    journal_subtype: JournalSubtype;
    diary_entry_count?: number;
    last_entry_at?: string | null;
  } | null;
  created_at?: string;
  checked?: boolean;
  workflow_status?: "Backlog" | "Paused" | "In Progress" | "Ready" | "Review" | "Done" | null;
  classification_confidence?: number | null;
  classification_reason?: string | null;
}

type SettingsDraft = UserSettings;
type HeaderSpinIcon =
  | "circleBolt"
  | "circleStar"
  | "circleHeart"
  | "circleRadiation"
  | "circleHalfStroke"
  | "circleThreeQuarters"
  | "circleCheck"
  | "circleX"
  | "circleLocationArrow"
  | "circleQuarters"
  | "circleExclamation"
  | "circleQuestion"
  | "circleDot"
  | "circleArrowDownLeft"
  | "circleArrowRight"
  | "circlePlus"
  | "circleDivide"
  | "circleMinus"
  | "circleDollar";

export default function HomePage() {
  type CaptureMode = "auto" | "timeline" | "workflow" | "journal" | "checklist";
  type CaptureIntent = "create" | "search";
  type SavedView = "all" | "today" | "overdue" | "deepwork" | "journal";
  const APP_VERSION = "2026.05.20-phase1";
  const [sourceText, setSourceText] = useState("");
  const [captureIntent, setCaptureIntent] = useState<CaptureIntent>("create");
  const [captureMode, setCaptureMode] = useState<CaptureMode>("auto");
  const [savedView, setSavedView] = useState<SavedView>("all");
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
  const [recastMenuItemId, setRecastMenuItemId] = useState<string | null>(null);
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
  const [editTimelineSubtype, setEditTimelineSubtype] = useState<TimelineSubtype>("stopwatch");
  const [editTimelineLeadMin, setEditTimelineLeadMin] = useState("5");
  const [editTimelineFreq, setEditTimelineFreq] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [editTimelineWeekday, setEditTimelineWeekday] = useState("1");
  const [editWorkflowSummary, setEditWorkflowSummary] = useState("");
  const [editWorkflowComments, setEditWorkflowComments] = useState<string[]>([]);
  const [editWorkflowStartedAt, setEditWorkflowStartedAt] = useState<string | null>(null);
  const [editWorkflowCompletedAt, setEditWorkflowCompletedAt] = useState<string | null>(null);
  const [newWorkflowComment, setNewWorkflowComment] = useState("");
  const [settings, setSettings] = useState<SettingsDraft>(DEFAULT_USER_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileCompactMeta, setMobileCompactMeta] = useState(false);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [pwaDiagnostics, setPwaDiagnostics] = useState<{ manifestOk: boolean; icon192Ok: boolean; icon512Ok: boolean; swSupported: boolean; swControlled: boolean } | null>(null);
  const [versionRefreshHint, setVersionRefreshHint] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [titleIcons, setTitleIcons] = useState<HeaderSpinIcon[]>(["circleBolt", "circleStar", "circleCheck", "circleX"]);
  const [titleAnimating, setTitleAnimating] = useState(true);
  const [titleBlinking, setTitleBlinking] = useState(false);
  const titleSpinIntervalRef = useRef<number | null>(null);
  const titleSpinStopRef = useRef<number | null>(null);
  const titleBlinkStopRef = useRef<number | null>(null);
  const workflowSteps = ["Backlog", "Paused", "In Progress"] as const;
  const timelineSubtypeLabel: Record<TimelineSubtype, string> = {
    stopwatch: "Stopwatch",
    reminder: "Reminder",
    recurring: "Recurring",
    countup: "Count-up"
  };
  const journalSubtypeLabel: Record<JournalSubtype, string> = {
    diary: "Diary",
    note: "Note",
    idea: "Idea"
  };
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
    const applyCompact = () => setMobileCompactMeta(window.innerWidth <= 430);
    applyCompact();
    window.addEventListener("resize", applyCompact);
    return () => window.removeEventListener("resize", applyCompact);
  }, []);

  function toggleSettingsDock() {
    setSettingsError("");
    setShowSettings((prev) => {
      const next = !prev;
      if (next) setShowTagWindow(false);
      return next;
    });
  }

  function toggleTagWindow() {
    setShowTagWindow((prev) => {
      const next = !prev;
      if (next) setShowSettings(false);
      return next;
    });
  }

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
    const previous = window.localStorage.getItem("flowways:app-version");
    if (previous && previous !== APP_VERSION) setVersionRefreshHint(true);
    window.localStorage.setItem("flowways:app-version", APP_VERSION);
  }, []);

  useEffect(() => {
    if (!petNotice || petNoticeTone !== "info") return;
    const timeoutId = window.setTimeout(() => {
      setPetNotice("");
    }, 3000);
    return () => window.clearTimeout(timeoutId);
  }, [petNotice, petNoticeTone]);

  async function runPwaDiagnostics() {
    const manifestCheck = fetch("/manifest.webmanifest", { cache: "no-store" }).then((res) => res.ok).catch(() => false);
    const icon192Check = fetch("/icons/icon-192-v3.png", { method: "HEAD", cache: "no-store" }).then((res) => res.ok).catch(() => false);
    const icon512Check = fetch("/icons/icon-512-v3.png", { method: "HEAD", cache: "no-store" }).then((res) => res.ok).catch(() => false);
    const [manifestOk, icon192Ok, icon512Ok] = await Promise.all([manifestCheck, icon192Check, icon512Check]);
    const swSupported = typeof navigator !== "undefined" && "serviceWorker" in navigator;
    const swControlled = swSupported ? Boolean(navigator.serviceWorker.controller) : false;
    setPwaDiagnostics({ manifestOk, icon192Ok, icon512Ok, swSupported, swControlled });
  }

  const headerIconPool: HeaderSpinIcon[] = [
    "circleBolt",
    "circleStar",
    "circleHeart",
    "circleRadiation",
    "circleCheck",
    "circleX",
    "circleLocationArrow",
    "circleQuarters",
    "circleExclamation",
    "circleQuestion",
    "circleDot",
    "circleArrowDownLeft",
    "circleArrowRight",
    "circlePlus",
    "circleDivide",
    "circleMinus",
    "circleDollar"
  ];

  function pickTitleIcons() {
    const unique = [...new Set(headerIconPool)];
    for (let i = unique.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [unique[i], unique[j]] = [unique[j], unique[i]];
    }
    return unique.slice(0, 4);
  }

  function clearTitleSpinTimers() {
    if (titleSpinIntervalRef.current) window.clearInterval(titleSpinIntervalRef.current);
    if (titleSpinStopRef.current) window.clearTimeout(titleSpinStopRef.current);
    if (titleBlinkStopRef.current) window.clearTimeout(titleBlinkStopRef.current);
    titleSpinIntervalRef.current = null;
    titleSpinStopRef.current = null;
    titleBlinkStopRef.current = null;
  }

  function startTitleSpin() {
    clearTitleSpinTimers();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setTitleIcons(pickTitleIcons());
      setTitleAnimating(false);
      setTitleBlinking(false);
      return;
    }

    setTitleBlinking(false);
    setTitleAnimating(true);
    setTitleIcons(pickTitleIcons());
    titleSpinIntervalRef.current = window.setInterval(() => setTitleIcons(pickTitleIcons()), 132);
    titleSpinStopRef.current = window.setTimeout(() => {
      if (titleSpinIntervalRef.current) window.clearInterval(titleSpinIntervalRef.current);
      titleSpinIntervalRef.current = null;
      setTitleIcons(pickTitleIcons());
      setTitleAnimating(false);
      setTitleBlinking(true);
      titleBlinkStopRef.current = window.setTimeout(() => setTitleBlinking(false), 260);
    }, 3400);
  }

  useEffect(() => {
    startTitleSpin();
    return () => clearTitleSpinTimers();
  }, []);

  function setColorTag(value: string) {
    selectedColorTagRef.current = value;
    setSelectedColorTag(value);
  }

  function pickSettingsQuip(next: SettingsDraft): { text: string; face: string } {
    const pool = {
      sweet: [
        { text: "Fresh settings! Everything looks cozy now.", face: "^_^" },
        { text: "Tuned nicely. Your vibe just leveled up.", face: "^_~" }
      ],
      meh: [
        { text: "Settings updated. Minimal drama.", face: "-_-" },
        { text: "Change applied. Proceed.", face: "._." }
      ],
      monster: [
        { text: "Settings mutated. I approve.", face: ">:)" },
        { text: "Config flipped. Looking dangerous.", face: ">:D" }
      ]
    } as const;
    const options = pool[next.pet_mode];
    return options[Math.floor(Math.random() * options.length)];
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
      if (resolved.pet_enabled) {
        const quip = pickSettingsQuip(resolved);
        setPetExpression(quip.face);
        setPetNoticeTone("info");
        setPetNotice(quip.text);
      } else {
        setPetNotice("");
      }
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
        { text: "Checklist upgraded. I even pretended it was hard.", face: "Â¬_Â¬" }
      ];
      return options[Math.floor(Math.random() * options.length)];
    }

    const byKind: Record<DbItem["kind"], { text: string; face: string }[]> = {
      timeline: [
        { text: `Timer locked: ${shortTitle || "that task"}. Try beating the clock this time.`, face: "o_o" },
        { text: `Scheduled: ${shortTitle || "timeline item"}. Time waits for nobody.`, face: "â€¢_â€¢" },
        { text: `Timeline set. ${shortTitle || "It"} is now officially your problem.`, face: "^_~" }
      ],
      workflow: [
        { text: `Workflow queued: ${shortTitle || "new work"}. Pretend this is under control.`, face: "Â¬â€¿Â¬" },
        { text: `Backlog fed with ${shortTitle || "a fresh task"}. Very corporate of you.`, face: "u_u" },
        { text: `Task pipelined: ${shortTitle || "it"}. Look at you being organized.`, face: "^_^" }
      ],
      checklist: [
        { text: `Checklist saved: ${shortTitle || "new list"}. Tiny boxes, big ambition.`, face: "â€¢â€¿â€¢" },
        { text: `List captured. ${shortTitle || "It"} now has accountability.`, face: "^_-" },
        { text: `Checklist ready. One more thing to cross off dramatically.`, face: "o_o" }
      ],
      journal: [
        { text: `Noted: ${shortTitle || "that thought"}. Future-you can decode this later.`, face: "Â¬_Â¬" },
        { text: `Journaled: ${shortTitle || "entry saved"}. Main character energy noted.`, face: "^_^" },
        { text: `Captured your note. Surprisingly coherent, too.`, face: "â€¢_â€¢" }
      ]
    };

    const pool = byKind[kind] || byKind.journal;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  async function submitItem() {
    if (!sourceText.trim() || authRequired) return;
    startTitleSpin();
    const colorTagAtSubmit = selectedColorTagRef.current;
    let releaseBusyInFinally = true;
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
      setBusy(false);
      releaseBusyInFinally = false;
      await loadItems();
    } catch {
      setSubmitMessage("Save failed due to a network or server error.");
      setPetNotice("Something went wrong. Try again.");
      setPetNoticeTone("error");
      setPetExpression("x_x");
    } finally {
      if (releaseBusyInFinally) setBusy(false);
    }
  }

  function runSearch() {
    setCaptureIntent("search");
    setSearchText(sourceText.trim().toLowerCase());
  }

  async function updateItem(id: string, patch: Record<string, unknown>): Promise<boolean> {
    const response = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setSubmitMessage(body.error || "Update failed.");
      return false;
    }
    await loadItems();
    return true;
  }

  async function recastItem(item: DbItem, targetKind: CaptureMode) {
    if (targetKind === "auto" || item.kind === targetKind) return;
    setBusy(true);
    setSubmitMessage("");
    try {
      const source = `${item.title}\n${item.body || ""}`.trim();
      const classifyResponse = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: source,
          modeHint: targetKind,
          petMode: settings.pet_mode,
          petEnabled: settings.pet_enabled,
          clientNow: new Date().toISOString(),
          clientTimezoneOffsetMinutes: new Date().getTimezoneOffset()
        })
      });
      if (!classifyResponse.ok) {
        setSubmitMessage("Recast classification failed.");
        return;
      }
      const payload = await classifyResponse.json();
      const c = payload?.result;
      if (!c) {
        setSubmitMessage("Recast payload missing.");
        return;
      }
      const ok = await updateItem(item.id, {
        kind: c.kind,
        title: c.title,
        body: c.body,
        labels: c.labels,
        dueAt: c.due_at,
        workflowStatus: c.workflow_status,
        timelineMeta: c.timeline_meta,
        journalMeta: c.journal_meta
      });
      if (ok) setSubmitMessage(`Recasted to ${c.kind}.`);
    } finally {
      setBusy(false);
    }
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

  function animateDelete(id: string) {
    if (deletingIds.includes(id)) return;
    setDeletingIds((prev) => [...prev, id]);
    window.setTimeout(async () => {
      await deleteItem(id);
      setDeletingIds((prev) => prev.filter((v) => v !== id));
    }, 560);
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
    if (item.kind === "timeline") {
      const meta = resolveTimelineMeta(item);
      setEditTimelineSubtype(meta.timeline_subtype);
      setEditTimelineLeadMin(String(meta.remind_lead_minutes || 5));
      setEditTimelineFreq(meta.recurrence_rule?.frequency || "weekly");
      setEditTimelineWeekday(String(meta.recurrence_rule?.byWeekday?.[0] ?? 1));
    } else {
      setEditTimelineSubtype("stopwatch");
      setEditTimelineLeadMin("5");
      setEditTimelineFreq("weekly");
      setEditTimelineWeekday("1");
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
      const timelineMeta: TimelineMeta = {
        ...defaultTimelineMeta(editTimelineSubtype),
        timeline_subtype: editTimelineSubtype,
        remind_lead_minutes: Math.max(1, Number(editTimelineLeadMin) || 5)
      };
      if (editTimelineSubtype === "stopwatch") {
        timelineMeta.remind_at = dueAt;
      } else if (editTimelineSubtype === "reminder") {
        timelineMeta.remind_at = dueAt;
      } else if (editTimelineSubtype === "recurring") {
        const rule: RecurrenceRule = {
          frequency: editTimelineFreq,
          interval: 1,
          byWeekday: editTimelineFreq === "weekly" ? [Math.max(0, Math.min(6, Number(editTimelineWeekday) || 1))] : undefined,
          time: dueAt ? `${String(new Date(dueAt).getHours()).padStart(2, "0")}:${String(new Date(dueAt).getMinutes()).padStart(2, "0")}` : "09:00"
        };
        timelineMeta.recurrence_rule = rule;
        timelineMeta.remind_at = nextOccurrenceFromRule(rule).toISOString();
      } else if (editTimelineSubtype === "countup") {
        timelineMeta.countup_started_at = item.timeline_meta?.countup_started_at || new Date().toISOString();
        timelineMeta.countup_stopped_at = item.timeline_meta?.countup_stopped_at || null;
      }
      await updateItem(id, { title: editTitle.trim() || "Untitled", dueAt: editTimelineSubtype === "countup" ? null : dueAt, timelineMeta });
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

    const parsedSourceEntries = parseChecklistItems(source.body || source.title);
    const fallbackSourceText = (source.title || source.body || "").trim();
    const sourceEntries = (parsedSourceEntries.length
      ? parsedSourceEntries
      : (fallbackSourceText ? [{ text: fallbackSourceText, checked: false }] : [])
    ).map((entry) => ({
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

    const mergedOk = await updateItem(target.id, { body: mergedBody, labels: mergedLabels });
    if (!mergedOk) {
      setSubmitMessage("Merge failed while updating the target list.");
      return;
    }
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

  function resolveTimelineMeta(item: DbItem): TimelineMeta {
    if (item.timeline_meta) return item.timeline_meta as TimelineMeta;
    return defaultTimelineMeta("stopwatch");
  }

  function parseDiaryEntries(body: string): { stamp: string; message: string }[] {
    return body
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^\[([^\]]+)\]\s*<(.+)>$/);
        if (match) return { stamp: match[1], message: match[2] };
        return { stamp: "", message: line };
      });
  }

  function resolveJournalMeta(item: DbItem): JournalMeta {
    if (item.journal_meta) return item.journal_meta as JournalMeta;
    return defaultJournalMeta("note");
  }

  function formatElapsed(ms: number): string {
    const mins = Math.max(0, Math.floor(ms / 60000));
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins ? `${hours}h ${remMins}m` : `${hours}h`;
  }

  function timelineState(targetAt: string | null) {
    if (!targetAt) return { done: false, label: "No due time set" };
    if (!hydrated) return { done: false, label: "Calculating..." };
    const dueMs = new Date(targetAt).getTime();
    if (Number.isNaN(dueMs)) return { done: false, label: "Invalid due time" };
    const delta = dueMs - nowMs;
    if (delta <= 0) return { done: true, label: "Timer done" };
    const mins = Math.max(1, Math.floor(delta / 60000));
    if (mins < 60) return { done: false, label: `Due in ${mins} min` };
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return { done: false, label: `Due in ${hours}h ${remMins}m` };
  }

  function timelineProgress(dueAt: string | null, createdAt?: string): number {
    if (!hydrated) return 0;
    if (!dueAt) return 0;
    const dueMs = new Date(dueAt).getTime();
    if (Number.isNaN(dueMs)) return 0;
    const createdMs = createdAt ? new Date(createdAt).getTime() : nowMs - 60 * 60 * 1000;
    const startMs = Number.isNaN(createdMs) ? nowMs - 60 * 60 * 1000 : createdMs;
    const span = Math.max(dueMs - startMs, 1);
    const elapsed = nowMs - startMs;
    return Math.min(100, Math.max(0, (elapsed / span) * 100));
  }

  function timelineProgressStyle(dueAt: string | null, createdAt?: string) {
    const pct = timelineProgress(dueAt, createdAt);
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

  function Icon({ name }: { name: "done" | "undo" | "edit" | "delete" | "save" | "cancel" | "hide" | "add" | "backlog" | "ready" | "progress" | "review" | "search" | "show" | "signout" | "settings" | "petNo" | "petPro" | "petMeh" | "petNuclear" | "timeline" | "workflow" | "journal" | "checklist" | "auto" | "recast" | "color" | "tags" | "labelPet" | "labelFont" | "labelText" | "labelColor" | "labelTheme" | HeaderSpinIcon }) {
    const common = { width: 18, height: 18, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.95, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
    const circleCommon = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
    if (name === "circleBolt") return <svg {...circleCommon}><circle cx="12" cy="12" r="9" /><path d="M13.3 5.8 9.4 12h2.9l-1.1 6.2 4.1-6.6h-3.1z" /></svg>;
    if (name === "circleStar") return <svg {...circleCommon}><circle cx="12" cy="12" r="9" /><path d="m12 6.5 1.7 3.5 3.9.6-2.8 2.7.7 3.9-3.5-1.9-3.5 1.9.7-3.9-2.8-2.7 3.9-.6z" /></svg>;
    if (name === "circleHeart") return <svg {...circleCommon}><circle cx="12" cy="12" r="9" /><path d="M12 17s-4.6-2.9-4.6-5.8a2.8 2.8 0 0 1 4.6-2.2 2.8 2.8 0 0 1 4.6 2.2c0 2.9-4.6 5.8-4.6 5.8z" /></svg>;
    if (name === "circleRadiation") return <svg {...circleCommon}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="1.6" /><path d="M12 10.4V6.2M9.2 13l-3.6 2.1M14.8 13l3.6 2.1M9.2 11l-3.6-2.1M14.8 11l3.6-2.1M12 13.6v4.2" /></svg>;
    if (name === "circleHalfStroke") return <svg {...circleCommon}><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 0 0 18" /></svg>;
    if (name === "circleThreeQuarters") return <svg {...circleCommon}><path d="M12 3a9 9 0 1 1-7.4 3.8" /><path d="M4 8V4h4" /></svg>;
    if (name === "circleCheck") return <svg {...circleCommon}><circle cx="12" cy="12" r="9" /><path d="m8.6 12.2 2.4 2.4 4.5-5.1" /></svg>;
    if (name === "circleX") return <svg {...circleCommon}><circle cx="12" cy="12" r="9" /><path d="m8.7 8.7 6.6 6.6M15.3 8.7l-6.6 6.6" /></svg>;
    if (name === "circleLocationArrow") return <svg {...circleCommon}><circle cx="12" cy="12" r="9" /><path d="m16.5 7.5-4.1 9.3-1.7-3.4-3.4-1.7z" /></svg>;
    if (name === "circleQuarters") return <svg {...circleCommon}><circle cx="12" cy="12" r="9" /><path d="M12 3v9h9" /></svg>;
    if (name === "circleExclamation") return <svg {...circleCommon}><circle cx="12" cy="12" r="9" /><path d="M12 7v7" /><circle cx="12" cy="16.8" r="1" fill="currentColor" stroke="none" /></svg>;
    if (name === "circleQuestion") return <svg {...circleCommon}><circle cx="12" cy="12" r="9" /><path d="M10.1 10.2a2.2 2.2 0 1 1 3.1 2c-1.1.6-1.3 1.1-1.3 2" /><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" /></svg>;
    if (name === "circleDot") return <svg {...circleCommon}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" /></svg>;
    if (name === "circleArrowDownLeft") return <svg {...circleCommon}><circle cx="12" cy="12" r="9" /><path d="m16 8-8 8M8 11.7V16h4.3" /></svg>;
    if (name === "circleArrowRight") return <svg {...circleCommon}><circle cx="12" cy="12" r="9" /><path d="M7 12h10M13.7 8.7 17 12l-3.3 3.3" /></svg>;
    if (name === "circlePlus") return <svg {...circleCommon}><circle cx="12" cy="12" r="9" /><path d="M12 7v10M7 12h10" /></svg>;
    if (name === "circleDivide") return <svg {...circleCommon}><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /><circle cx="12" cy="9" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="15" r="1" fill="currentColor" stroke="none" /></svg>;
    if (name === "circleMinus") return <svg {...circleCommon}><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></svg>;
    if (name === "circleDollar") return <svg {...circleCommon}><circle cx="12" cy="12" r="9" /><path d="M12 6.3v11.4M14.6 8.3c-.7-.4-1.5-.6-2.6-.6-1.8 0-3 .8-3 2 0 1.2 1.1 1.8 3 2.3 1.7.4 2.9 1 2.9 2.2 0 1.2-1.2 2.1-3.2 2.1-1.2 0-2.3-.3-3.2-.9" /></svg>;
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
    if (name === "labelPet") return <svg {...common}><path d="M4.8 7.2 3.8 4.6a1 1 0 1 1 1.9-.7l1 2.4M11.2 7.2l1-2.6a1 1 0 1 0-1.9-.7l-1 2.4" /><circle cx="6.3" cy="8.3" r=".8" /><circle cx="9.7" cy="8.3" r=".8" /><path d="M5.4 11c.8.6 1.6.9 2.6.9s1.8-.3 2.6-.9" /></svg>;
    if (name === "labelFont") return <svg {...common}><path d="M4.2 12.8 7.6 3.2h.8l3.4 9.6" /><path d="M5.5 9.2h5" /></svg>;
    if (name === "labelText") return <svg {...common}><path d="M3 4h10M8 4v8" /></svg>;
    if (name === "labelColor") return <svg {...common}><path d="M5.8 10.8 9.7 6.9a1.2 1.2 0 0 1 1.7 1.7l-3.9 3.9a1.6 1.6 0 0 1-1.2.5h-.8v-.8a1.7 1.7 0 0 1 .3-1.4z" /><circle cx="10.8" cy="7.8" r=".7" /></svg>;
    if (name === "labelTheme") return <svg {...common}><path d="M8 2.6v2.2M8 11.2v2.2M2.6 8h2.2M11.2 8h2.2M4.3 4.3l1.5 1.5M10.2 10.2l1.5 1.5M11.7 4.3l-1.5 1.5M5.8 10.2l-1.5 1.5" /><circle cx="8" cy="8" r="1.5" /></svg>;
    if (name === "add") return <svg {...common}><path d="M8 3.2v9.6M3.2 8h9.6" /></svg>;
    if (name === "search") return <svg {...common}><circle cx="7" cy="7" r="4.3" /><path d="M10.3 10.3 13.5 13.5" /></svg>;
    if (name === "show") return <svg {...common}><path d="M1.5 8s2.4-4 6.5-4 6.5 4 6.5 4-2.4 4-6.5 4-6.5-4-6.5-4z" /><circle cx="8" cy="8" r="1.5" /></svg>;
    if (name === "auto") return <svg {...common}><path d="m4.2 11.7 4.6-6.6" /><path d="m7.7 4.1 4.1 4.1" /><path d="M11.9 3.1v1.3M11.25 3.75h1.3M3.1 8.9v1M2.6 9.4h1" /></svg>;
    if (name === "recast") return <svg {...common}><path d="M4.1 5.6h5.8" /><path d="m8.2 3.8 2 1.8-2 1.8" /><path d="M11.9 10.4H6.1" /><path d="m7.8 8.6-2 1.8 2 1.8" /></svg>;
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

  const isToday = (iso: string | null | undefined) => {
    if (!iso) return false;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return false;
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  };

  const baseVisibleItems = items
    .filter((item) => showHidden || !hiddenItemIds.includes(item.id))
    .filter((item) => captureMode === "auto" ? true : item.kind === captureMode)
    .filter((item) => {
      if (savedView === "all") return true;
      if (savedView === "journal") return item.kind === "journal";
      if (savedView === "today") return isToday(item.due_at || item.created_at);
      if (savedView === "overdue") {
        if (item.kind !== "timeline" || item.checked || !item.due_at) return false;
        const dueMs = new Date(item.due_at).getTime();
        return Number.isFinite(dueMs) && dueMs <= nowMs;
      }
      if (savedView === "deepwork") {
        const labels = (item.labels || []).map((label) => label.toLowerCase());
        return (item.kind === "workflow" && !item.checked) || labels.includes("focus") || labels.includes("deepwork");
      }
      return true;
    })
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
  const canSubmit = !authRequired && !busy && Boolean(sourceText.trim());
  const canClickSubmit = !authRequired && !busy;
  const resolvedPetNotice = settings.pet_enabled ? (showHidden ? "Hide mode" : (petNotice || autoPetNotice)) : "";
  const resolvedPetTone: "info" | "warning" | "error" = settings.pet_enabled
    ? (showHidden ? "info" : (petNotice ? petNoticeTone : (autoPetNotice ? "warning" : "info")))
    : "info";
  const systemNotice = !settings.pet_enabled
    ? (showHidden ? "Hide mode" : (petNotice || autoPetNotice || ""))
    : "";
  const resolvedPetFace = busy
    ? "â€¢_â€¢"
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

  function formatDateTime(iso: string): string {
    const ms = new Date(iso).getTime();
    if (Number.isNaN(ms)) return iso;
    return new Date(iso).toLocaleString();
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
    { key: "bold" as const, label: "B", title: "Bold Dashboard" },
    { key: "sunset" as const, label: "S", title: "Sunset Warm" }
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
        <div
          className="titleClickZone"
          role="button"
          tabIndex={0}
          onClick={startTitleSpin}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              startTitleSpin();
            }
          }}
        >
          <div className={`titleIconStrip${titleAnimating ? " isSpinning" : ""}${titleBlinking ? " isBlinking" : ""}`} aria-hidden="true">
            {titleIcons.map((name, index) => (
              <span key={`${name}-${index}`} className="titleIcon">
                <Icon name={name} />
              </span>
            ))}
          </div>
          <p className="subtitle">Capture, classify, edit, and manage memory items.</p>
        </div>
        <div className="topbarActions">
          <button
            type="button"
            className={`iconAction topbarAction${showSettings ? " active" : ""}`}
            aria-label="Settings"
            data-tip="Settings"
            onClick={() => {
              toggleSettingsDock();
            }}
          >
            <Icon name="settings" />
          </button>
          <button type="button" className="iconAction topbarAction" aria-label="Sign Out" data-tip="Sign Out" onClick={signOut}><Icon name="signout" /></button>
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
              if (captureIntent === "search") {
                runSearch();
                return;
              }
              if (!canSubmit) return;
              void submitItem();
            }}
            placeholder="Add task | Search"
          />
          <div className="modeActions" aria-label="Classification mode">
            <button type="button" className={`iconAction compact${captureMode === "auto" ? " active" : ""}`} aria-label="Auto mode" data-tip="Auto mode" onClick={() => setCaptureMode("auto")}><Icon name="auto" /></button>
            <button type="button" className={`iconAction compact${captureMode === "timeline" ? " active" : ""}`} aria-label="Timeline mode" data-tip="Timeline mode" onClick={() => setCaptureMode("timeline")}><Icon name="timeline" /></button>
            <button type="button" className={`iconAction compact${captureMode === "workflow" ? " active" : ""}`} aria-label="Workflow mode" data-tip="Workflow mode" onClick={() => setCaptureMode("workflow")}><Icon name="workflow" /></button>
            <button type="button" className={`iconAction compact${captureMode === "journal" ? " active" : ""}`} aria-label="Journal mode" data-tip="Journal mode" onClick={() => setCaptureMode("journal")}><Icon name="journal" /></button>
            <button type="button" className={`iconAction compact${captureMode === "checklist" ? " active" : ""}`} aria-label="Checklist mode" data-tip="Checklist mode" onClick={() => setCaptureMode("checklist")}><Icon name="checklist" /></button>
            <div className="colorPickerWrap">
              <button
                type="button"
                className={`iconAction compact${selectedColorTag ? ` colorActive ${selectedColorTag}` : ""}`}
                aria-label="Color tag"
                data-tip="Color tag"
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
                  <button type="button" className="colorDot clear" onClick={() => { setColorTag(""); setShowColorPicker(false); }} data-tip="No color">Ã—</button>
                  {colorTagIds.map((c) => (
                    <button
                      type="button"
                      key={c}
                      className={`colorDot${selectedColorTag === c ? " active" : ""}`}
                      style={{ background: settings.color_palette[c.replace("color-", "") as keyof typeof settings.color_palette] }}
                      onClick={() => { setColorTag(c); setShowColorPicker(false); }}
                      data-tip={c.replace("color-", "")}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <div className="captureActions">
            <button type="button" className={`iconAction${captureIntent === "create" ? " active" : ""}`} aria-label="Add task" data-tip="Add mode (Enter submits)" onClick={() => { setCaptureIntent("create"); void submitItem(); }} disabled={!canClickSubmit}><Icon name="add" /></button>
            <button type="button" className={`iconAction${captureIntent === "search" ? " active" : ""}`} aria-label="Search tasks" data-tip="Search mode (Enter filters)" onClick={() => { setCaptureIntent("search"); runSearch(); }}><Icon name="search" /></button>
            <button type="button" className={`iconAction${showTagWindow ? " active" : ""}`} aria-label="Tag filters" data-tip="Tag filters" onClick={toggleTagWindow}><Icon name="tags" /></button>
            <button type="button" className={`iconAction${showHidden ? " active" : ""}`} aria-label={showHidden ? "Hide hidden tasks" : "Show hidden tasks"} data-tip={showHidden ? "Hide hidden tasks" : "Show hidden tasks"} onClick={() => setShowHidden((prev) => !prev)}><Icon name={showHidden ? "show" : "hide"} /></button>
          </div>
        </div>
        <div className="savedViewsRow" aria-label="Saved views">
          <div className="savedViews">
            <button type="button" className={savedView === "all" ? "active" : ""} onClick={() => setSavedView("all")}>All</button>
            <button type="button" className={savedView === "today" ? "active" : ""} onClick={() => setSavedView("today")}>Today</button>
            <button type="button" className={savedView === "overdue" ? "active" : ""} onClick={() => setSavedView("overdue")}>Overdue</button>
            <button type="button" className={savedView === "deepwork" ? "active" : ""} onClick={() => setSavedView("deepwork")}>Deep Work</button>
            <button type="button" className={savedView === "journal" ? "active" : ""} onClick={() => setSavedView("journal")}>Journal</button>
            {(savedView !== "all" || searchText || selectedColorTag || activeTagFilters.length || captureMode !== "auto") ? (
              <button
                type="button"
                className="clearFilters"
                onClick={() => {
                  setSavedView("all");
                  setSearchText("");
                  setSourceText("");
                  setCaptureMode("auto");
                  setSelectedColorTag("");
                  setActiveTagFilters([]);
                }}
              >
                Reset
              </button>
            ) : null}
          </div>
          <span className="resultCount">{sortedItems.length} result{sortedItems.length === 1 ? "" : "s"}</span>
        </div>
        {showTagWindow && !showSettings ? (
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
      <section className={`settingsDock${showSettings && !showTagWindow ? " isOpen" : ""}`} aria-label="Settings" aria-hidden={!showSettings || showTagWindow}>
          <div className="settingsModal settingsInline">
            <div className="settingsInner">
              <div className="settingsGrid">
                <div className="settingsRow">
                  <span className="settingsLabelIcon" data-tip="Pet mode" aria-label="Pet mode"><Icon name="labelPet" /></span>
                  <div className="settingsIconRail">
                    {(["off", "sweet", "meh", "monster"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                      className={`iconAction compact ${petProfile === mode ? "active" : ""}`}
                      data-tip={mode === "off" ? "no" : mode === "sweet" ? "professional" : mode === "meh" ? "meh" : "nuclear"}
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
                  <span className="settingsLabelIcon" data-tip="Font family" aria-label="Font family"><Icon name="labelFont" /></span>
                  <div className="settingsIconRail">
                    {fontOptions.map((font) => (
                      <button
                        key={font.key}
                        type="button"
                        className={`iconAction compact glyphButton ${settings.font_family === font.key ? "active" : ""}`}
                        data-tip={font.title}
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
                  <span className="settingsLabelIcon" data-tip="Text size" aria-label="Text size"><Icon name="labelText" /></span>
                  <div className="settingsIconRail">
                    {(["s", "m", "l"] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        className={`iconAction compact glyphButton sizeGlyph ${settings.font_size === size ? "active" : ""}`}
                        data-tip={`Text ${size.toUpperCase()}`}
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
                  <span className="settingsLabelIcon" data-tip="Theme" aria-label="Theme"><Icon name="labelTheme" /></span>
                  <div className="settingsIconRail">
                    {themeOptions.map((theme) => (
                      <button
                        key={theme.key}
                        type="button"
                        className={`iconAction compact glyphButton ${settings.theme === theme.key ? "active" : ""}`}
                        data-tip={theme.title}
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
                  <span className="settingsLabelIcon" data-tip="Color palette" aria-label="Color palette"><Icon name="labelColor" /></span>
                  <div className="settingsIconRail">
                    {colorKeys.map((key) => (
                      <label key={key} className="paletteCell" data-tip={key}>
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
      </section>

      <section className="feedShell" aria-label="Saved items">
        <div className="feed">
        <div className="feedCards">
        {sortedItems.length === 0 ? <p className="empty">{initialFeedLoaded ? "No items yet." : "Loading items..."}</p> : null}
        {sortedItems.map((item) => {
          const timelineMeta = item.kind === "timeline" ? resolveTimelineMeta(item) : null;
          const journalMeta = item.kind === "journal" ? resolveJournalMeta(item) : null;
          const timelineTargetAt = (() => {
            if (item.kind !== "timeline" || !timelineMeta) return null;
            if (timelineMeta.timeline_subtype === "stopwatch") return item.due_at;
            if (timelineMeta.timeline_subtype === "reminder") return timelineMeta.remind_at || item.due_at;
            if (timelineMeta.timeline_subtype === "recurring") {
              if (timelineMeta.recurrence_rule) return nextOccurrenceFromRule(timelineMeta.recurrence_rule).toISOString();
              return timelineMeta.remind_at || item.due_at;
            }
            return null;
          })();
          const timeState = item.kind === "timeline" ? timelineState(timelineTargetAt) : null;
          const metaDate = formatMetaDate(item);
          const isTimelineExpired = item.kind === "timeline" && !item.checked && Boolean(timeState?.done);
          const isDone = Boolean(item.checked);
          const isHiddenItem = hiddenItemIds.includes(item.id);
          const colorLabel = (item.labels || []).find((label) => label.startsWith("color-"));
          return (
          <article key={item.id} className={`item item-${item.kind}${isTimelineExpired ? " item-timeline-alert" : ""}${isDone ? " item-done" : ""}${isHiddenItem ? " item-hidden" : ""}${colorLabel ? ` ${colorLabel}` : ""}${deletingIds.includes(item.id) ? " isDeleting" : ""}`}>
            <div className="itemHead">
              <span className="kind">
                <Icon name={item.kind} />
                <span className="kindLabel">{item.title}</span>
                {(typeof item.classification_confidence === "number" || item.classification_reason) ? (
                  <button
                    type="button"
                    className="confidenceInfo kindInfo"
                    data-tip={`confidence ${typeof item.classification_confidence === "number" ? `${Math.round(item.classification_confidence * 100)}%` : "n/a"}${item.classification_reason ? ` | why: ${item.classification_reason}` : ""}`}
                    aria-label="Classification info"
                  >
                    i
                  </button>
                ) : null}
              </span>
              <div className="actions">
                {item.checked ? (
                  <>
                    <button type="button" className="iconAction" aria-label="Undo" data-tip="Undo" onClick={() => item.kind === "workflow" ? toggleWorkflowDone(item, false) : updateItem(item.id, { checked: false })}><Icon name="undo" /></button>
                    {isHiddenItem ? (
                      <button type="button" className="iconAction danger" aria-label="Delete" data-tip="Delete" onClick={() => animateDelete(item.id)}><Icon name="delete" /></button>
                    ) : (
                      <button type="button" className="iconAction" aria-label="Hide" data-tip="Hide" onClick={() => hideItem(item.id)}><Icon name="hide" /></button>
                    )}
                  </>
                ) : (
                  <>
                    {editingId === item.id ? (
                      <>
                        <button type="button" className="iconAction" aria-label="Save" data-tip="Save" onClick={() => saveEdit(item.id)}><Icon name="save" /></button>
                        <button type="button" className="iconAction" aria-label="Cancel" data-tip="Cancel" onClick={() => setEditingId(null)}><Icon name="cancel" /></button>
                      </>
                    ) : (
                      <>
                        <div className="recastMenuWrap">
                          <button type="button" className={`iconAction${recastMenuItemId === item.id ? " active" : ""}`} aria-label="Change type" data-tip="Change type" onClick={() => setRecastMenuItemId((prev) => (prev === item.id ? null : item.id))}><Icon name="recast" /></button>
                          {recastMenuItemId === item.id ? (
                            <div className="recastMenu" role="menu" aria-label="Reclassify item">
                              <button type="button" className="iconAction compact" data-tip="Checklist" onClick={() => { void recastItem(item, "checklist"); setRecastMenuItemId(null); }}><Icon name="checklist" /></button>
                              <button type="button" className="iconAction compact" data-tip="Journal" onClick={() => { void recastItem(item, "journal"); setRecastMenuItemId(null); }}><Icon name="journal" /></button>
                              <button type="button" className="iconAction compact" data-tip="Workflow" onClick={() => { void recastItem(item, "workflow"); setRecastMenuItemId(null); }}><Icon name="workflow" /></button>
                              <button type="button" className="iconAction compact" data-tip="Timeline" onClick={() => { void recastItem(item, "timeline"); setRecastMenuItemId(null); }}><Icon name="timeline" /></button>
                            </div>
                          ) : null}
                        </div>
                        <button type="button" className="iconAction" aria-label="Done" data-tip="Done" onClick={() => item.kind === "workflow" ? toggleWorkflowDone(item, true) : updateItem(item.id, { checked: true })}><Icon name="done" /></button>
                        <button type="button" className="iconAction" aria-label="Edit" data-tip="Edit" onClick={() => startEdit(item)}><Icon name="edit" /></button>
                        <button type="button" className="iconAction danger" aria-label="Delete" data-tip="Delete" onClick={() => animateDelete(item.id)}><Icon name="delete" /></button>
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
                        <button type="button" className="iconAction compact danger" aria-label="Remove item" data-tip="Remove item" onClick={() => setEditChecklistEntries((prev) => prev.filter((_, i) => i !== index))}><Icon name="delete" /></button>
                      </div>
                    ))}
                    <button type="button" className="iconAction compact" aria-label="Add item" data-tip="Add item" onClick={() => setEditChecklistEntries((prev) => [...prev, { text: "", checked: false }])}><Icon name="add" /></button>
                  </div>
                ) : item.kind === "timeline" ? (
                  <div className="typeEditor">
                    <div className="editRow">
                      <label>Subtype</label>
                      <select value={editTimelineSubtype} onChange={(event) => setEditTimelineSubtype(event.target.value as TimelineSubtype)}>
                        <option value="stopwatch">Stopwatch deadline</option>
                        <option value="reminder">One-time reminder</option>
                        <option value="recurring">Recurring reminder</option>
                        <option value="countup">Count-up tracker</option>
                      </select>
                    </div>
                    <div className="editRow">
                      <label>{editTimelineSubtype === "stopwatch" ? "Due time" : "Trigger time"}</label>
                      <input
                        type="datetime-local"
                        value={editTimelineDueAt}
                        onChange={(event) => setEditTimelineDueAt(event.target.value)}
                        disabled={editTimelineSubtype === "countup"}
                      />
                    </div>
                    {editTimelineSubtype !== "countup" ? (
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
                          data-tip="Apply minutes"
                          onClick={() => {
                            const n = Number(editTimelineOffsetMin);
                            if (!Number.isFinite(n) || n <= 0) return;
                            setEditTimelineDueAt(toDatetimeLocal(new Date(Date.now() + n * 60000).toISOString()));
                          }}
                        >
                          <Icon name="save" />
                        </button>
                      </div>
                    ) : null}
                    {(editTimelineSubtype === "reminder" || editTimelineSubtype === "recurring") ? (
                      <div className="editRow">
                        <label>Lead min</label>
                        <input type="number" min={1} value={editTimelineLeadMin} onChange={(event) => setEditTimelineLeadMin(event.target.value)} />
                      </div>
                    ) : null}
                    {editTimelineSubtype === "recurring" ? (
                      <>
                        <div className="editRow">
                          <label>Frequency</label>
                          <select value={editTimelineFreq} onChange={(event) => setEditTimelineFreq(event.target.value as "daily" | "weekly" | "monthly")}>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                        {editTimelineFreq === "weekly" ? (
                          <div className="editRow">
                            <label>Weekday</label>
                            <select value={editTimelineWeekday} onChange={(event) => setEditTimelineWeekday(event.target.value)}>
                              <option value="0">Sun</option>
                              <option value="1">Mon</option>
                              <option value="2">Tue</option>
                              <option value="3">Wed</option>
                              <option value="4">Thu</option>
                              <option value="5">Fri</option>
                              <option value="6">Sat</option>
                            </select>
                          </div>
                        ) : null}
                      </>
                    ) : null}
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
                          <button type="button" className="iconAction compact danger" aria-label="Remove comment" data-tip="Remove comment" onClick={() => setEditWorkflowComments((prev) => prev.filter((_, i) => i !== index))}><Icon name="delete" /></button>
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
                        data-tip="Add comment"
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
                    {timelineMeta?.timeline_subtype === "reminder" && timelineTargetAt ? (
                      <p>Reminds at {formatDateTime(timelineTargetAt)} ({Math.max(1, timelineMeta.remind_lead_minutes || 5)}m lead)</p>
                    ) : null}
                    {timelineMeta?.timeline_subtype === "recurring" ? (
                      <p>
                        Repeats {timelineMeta.recurrence_rule?.frequency || "weekly"}
                        {timelineMeta.recurrence_rule?.byWeekday?.length ? ` on ${timelineMeta.recurrence_rule.byWeekday.map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d] || d).join(", ")}` : ""}
                        {timelineTargetAt ? ` â€¢ next ${formatDateTime(timelineTargetAt)}` : ""}
                      </p>
                    ) : null}
                    {timelineMeta?.timeline_subtype === "countup" ? (
                      <p>
                        Elapsed: {formatElapsed((timelineMeta.countup_stopped_at ? new Date(timelineMeta.countup_stopped_at).getTime() : nowMs) - (timelineMeta.countup_started_at ? new Date(timelineMeta.countup_started_at).getTime() : nowMs))}
                      </p>
                    ) : null}
                  </div>
                ) : item.kind === "journal" && journalMeta?.journal_subtype === "diary" ? (
                  <div className="diaryBlock">
                    {parseDiaryEntries(item.body || "").map((entry, index) => (
                      <div className="diaryEntry" key={`${item.id}-diary-${index}`}>
                        <span className="diaryStamp">{entry.stamp}</span>
                        <p className="diaryMessage">{entry.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  item.body ? <p className={item.kind === "journal" ? "journalBody" : undefined}>{item.body}</p> : null
                )}
                
              </>
            )}

            <div className={`meta metaRow${item.kind === "timeline" ? " timelineMetaRow" : ""}`}>
              {metaDate ? <span className="dateChip">{metaDate}</span> : null}
              {item.kind === "timeline" && timelineMeta ? (
                <span className="tagChip">{timelineSubtypeLabel[timelineMeta.timeline_subtype]}</span>
              ) : null}
              {item.kind === "journal" && journalMeta ? (
                <span className="tagChip">{journalSubtypeLabel[journalMeta.journal_subtype]}</span>
              ) : null}
              {item.kind === "timeline" && !item.checked && timeState?.done ? <span className="overdueTagChip">OVER DUE</span> : null}
              {item.kind === "workflow" && formatTimeSpent(item) ? <span className="dateChip">{formatTimeSpent(item)}</span> : null}
              {(() => {
                const labels = item.labels || [];
                const visibleLabels = mobileCompactMeta ? labels.slice(0, 2) : labels;
                const hiddenLabelCount = mobileCompactMeta ? Math.max(0, labels.length - visibleLabels.length) : 0;
                return (
                  <>
                    {visibleLabels.map((label) => {
                      const isColorLabel = label.startsWith("color-");
                      const colorName = label.replace("color-", "");
                      return (
                        <button
                          type="button"
                          className={`${activeTagFilters.includes(label) ? "tagChip itemLabelChip active" : "tagChip itemLabelChip"}${isColorLabel ? ` colorTag ${label}` : ""}`}
                          key={label}
                          onClick={() => {
                            setActiveTagFilters((prev) => prev.includes(label) ? prev.filter((v) => v !== label) : [...prev, label]);
                            if (!showTagWindow) {
                              setShowSettings(false);
                              setShowTagWindow(true);
                            }
                          }}
                        >
                          {isColorLabel ? <span className="colorSwatch" aria-hidden="true" /> : null}
                          {isColorLabel ? colorName : `#${label}`}
                        </button>
                      );
                    })}
                    {hiddenLabelCount > 0 ? <span className="tagChip tagChipMore">+{hiddenLabelCount}</span> : null}
                  </>
                );
              })()}
              {item.kind === "timeline" && timelineMeta?.timeline_subtype === "stopwatch" && !item.checked && item.due_at && !timeState?.done ? (
                <div className="dueRailInline" aria-label="Due progress">
                  <span className="dueLabel">Time ({timeState?.label?.replace("Due in ", "") || "--"})</span>
                  <div className="dueRailWrap">
                    <div className="dueRail" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(timelineProgress(item.due_at, item.created_at))}>
                      <span className="dueRailFill" style={timelineProgressStyle(item.due_at, item.created_at)} />
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
                      data-tip={step}
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
      <footer className="opsNotices" aria-label="Build and PWA status">
        <span className="versionChip">v{APP_VERSION}</span>
        {versionRefreshHint ? (
          <button
            type="button"
            className="tagChip itemLabelChip active"
            onClick={() => window.location.reload()}
          >
            New version detected · Refresh
          </button>
        ) : null}
        <button type="button" className="tagChip itemLabelChip" onClick={() => void runPwaDiagnostics()}>Run PWA diagnostics</button>
        {pwaDiagnostics ? (
          <span className="diagText">
            manifest:{pwaDiagnostics.manifestOk ? "ok" : "fail"} · icon192:{pwaDiagnostics.icon192Ok ? "ok" : "fail"} · icon512:{pwaDiagnostics.icon512Ok ? "ok" : "fail"} · sw:{pwaDiagnostics.swSupported ? (pwaDiagnostics.swControlled ? "controlled" : "supported") : "unsupported"}
          </span>
        ) : null}
      </footer>
    </main>
  );
}







