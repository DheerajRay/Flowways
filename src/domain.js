(function initDomain(global) {
  const MODES = [
    { id: "dashboard", label: "Dashboard", tone: "neutral" },
    { id: "checklist", label: "Checklist", tone: "green" },
    { id: "journal", label: "Journal", tone: "blue" },
    { id: "workflow", label: "Workflow", tone: "amber" },
    { id: "timeline", label: "Timeline", tone: "red" }
  ];

  const WORKFLOW_COLUMNS = ["Backlog", "Ready", "In Progress", "Review", "Done"];

  function createId(prefix = "item") {
    if (global.crypto && typeof global.crypto.randomUUID === "function") {
      return `${prefix}_${global.crypto.randomUUID()}`;
    }
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function normalizeText(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function extractLabels(text) {
    const matches = normalizeText(text).match(/#[a-z0-9_-]+/gi) || [];
    return matches.map((tag) => tag.slice(1).toLowerCase());
  }

  function parseDueAt(text, baseDate = new Date()) {
    const normalized = normalizeText(text).toLowerCase();
    const result = new Date(baseDate);

    if (/\btoday\b/.test(normalized)) {
      result.setHours(17, 0, 0, 0);
    } else if (/\btomorrow\b/.test(normalized)) {
      result.setDate(result.getDate() + 1);
      result.setHours(17, 0, 0, 0);
    } else if (/\bnext week\b/.test(normalized)) {
      result.setDate(result.getDate() + 7);
      result.setHours(9, 0, 0, 0);
    } else {
      const isoDate = normalized.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
      if (!isoDate) return null;
      result.setFullYear(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3]));
      result.setHours(9, 0, 0, 0);
    }

    const time = normalized.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
    if (time) {
      let hour = Number(time[1]);
      const minute = Number(time[2] || 0);
      if (time[3] === "pm" && hour < 12) hour += 12;
      if (time[3] === "am" && hour === 12) hour = 0;
      result.setHours(hour, minute, 0, 0);
    }

    return result.toISOString();
  }

  function stripSyntax(text) {
    return normalizeText(text)
      .replace(/\b(today|tomorrow|next week)\b/gi, "")
      .replace(/\b20\d{2}-\d{2}-\d{2}\b/g, "")
      .replace(/\b\d{1,2}(?::\d{2})?\s*(am|pm)\b/gi, "")
      .replace(/#[a-z0-9_-]+/gi, "")
      .replace(/^[-*]\s+/, "")
      .replace(/^\[\s?\]\s*/, "")
      .trim();
  }

  function classifyInput(text, override = "auto", baseDate = new Date()) {
    const cleanText = normalizeText(text);
    const dueAt = parseDueAt(cleanText, baseDate);
    const hasWorkflowCue = /\b(blocked|backlog|ready|review|handoff|in progress)\b/i.test(cleanText);
    const hasTaskCue = /^(\[\s?\]|-|todo\b|fix\b|draft\b|call\b|email\b|finish\b)/i.test(cleanText);
    const isJournalish = cleanText.length > 120 || /\n|\. .+\./.test(text);

    let kind = "checklist";
    if (override !== "auto") {
      kind = override;
    } else if (dueAt) {
      kind = "timeline";
    } else if (hasWorkflowCue) {
      kind = "workflow";
    } else if (isJournalish) {
      kind = "journal";
    } else if (hasTaskCue) {
      kind = "checklist";
    }

    return {
      kind,
      title: stripSyntax(cleanText) || cleanText || "Untitled item",
      body: kind === "journal" ? cleanText : "",
      labels: extractLabels(cleanText),
      dueAt
    };
  }

  function createItem(text, override, position, baseDate) {
    const classified = classifyInput(text, override, baseDate);
    const createdAt = nowIso();
    return {
      id: createId(),
      kind: classified.kind,
      title: classified.title,
      body: classified.body,
      labels: classified.labels,
      status: classified.kind === "workflow" ? "Backlog" : "active",
      checked: false,
      blockedReason: "",
      startAt: null,
      dueAt: classified.dueAt,
      durationMin: classified.kind === "timeline" ? 30 : null,
      position,
      createdAt,
      updatedAt: createdAt,
      deletedAt: null
    };
  }

  function isSameLocalDay(left, right) {
    if (!left || !right) return false;
    const a = new Date(left);
    const b = new Date(right);
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function summarize(items, baseDate = new Date()) {
    const visible = items.filter((item) => !item.deletedAt);
    const done = visible.filter((item) => item.checked || item.status === "Done");
    const today = visible.filter((item) => item.dueAt && isSameLocalDay(item.dueAt, baseDate) && !done.includes(item));
    const overdue = visible.filter((item) => item.dueAt && new Date(item.dueAt) < baseDate && !done.includes(item));
    const upcoming = visible.filter((item) => item.dueAt && new Date(item.dueAt) > baseDate && !today.includes(item));
    return {
      total: visible.length,
      done: done.length,
      today: today.length,
      overdue: overdue.length,
      upcoming: upcoming.length,
      completePercent: visible.length ? Math.round((done.length / visible.length) * 100) : 0
    };
  }

  function filterItems(items, mode, query = "", completion = "active") {
    const q = normalizeText(query).toLowerCase();
    return items
      .filter((item) => !item.deletedAt)
      .filter((item) => mode === "dashboard" || item.kind === mode)
      .filter((item) => {
        const isDone = item.checked || item.status === "Done";
        if (completion === "done") return isDone;
        if (completion === "active") return !isDone;
        return true;
      })
      .filter((item) => {
        if (!q) return true;
        return [item.title, item.body, item.kind, item.status, ...(item.labels || [])].join(" ").toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (mode === "timeline") return String(a.dueAt || "").localeCompare(String(b.dueAt || ""));
        return a.position - b.position || String(b.updatedAt).localeCompare(String(a.updatedAt));
      });
  }

  global.FlowDomain = {
    MODES,
    WORKFLOW_COLUMNS,
    classifyInput,
    createItem,
    filterItems,
    summarize,
    parseDueAt
  };

  if (typeof module !== "undefined") {
    module.exports = global.FlowDomain;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
