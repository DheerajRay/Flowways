const DB_NAME = "flowways-db";
const DB_VERSION = 1;
const STORE_NAME = "items";

const state = {
  items: [],
  mode: "dashboard",
  filter: "active",
  query: "",
  db: null
};

const els = {};

document.addEventListener("DOMContentLoaded", boot);

async function boot() {
  cacheElements();
  bindEvents();
  renderNav();
  state.db = await openDb();
  state.items = await readAllItems();
  if (!state.items.length) {
    await seedInitialItems();
    state.items = await readAllItems();
  }
  await registerServiceWorker();
  updateNetworkStatus();
  render();
}

function cacheElements() {
  [
    "modeNav",
    "quickInput",
    "kindSelect",
    "addButton",
    "searchInput",
    "itemsMount",
    "viewEyebrow",
    "viewTitle",
    "todayCount",
    "upcomingCount",
    "overdueCount",
    "completeCount",
    "cityView",
    "fallbackSummary",
    "clearDoneButton",
    "exportButton",
    "importInput",
    "notifyButton",
    "reminderDialog",
    "reminderList",
    "permissionButton",
    "syncStatus"
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function bindEvents() {
  els.addButton.addEventListener("click", addFromComposer);
  els.quickInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addFromComposer();
  });
  els.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    render();
  });
  document.querySelectorAll(".segment").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      document.querySelectorAll(".segment").forEach((segment) => segment.classList.toggle("active", segment === button));
      render();
    });
  });
  els.clearDoneButton.addEventListener("click", clearDone);
  els.exportButton.addEventListener("click", exportData);
  els.importInput.addEventListener("change", importData);
  els.notifyButton.addEventListener("click", openReminders);
  els.permissionButton.addEventListener("click", requestNotificationPermission);
  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
      store.createIndex("kind", "kind");
      store.createIndex("updatedAt", "updatedAt");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function withStore(mode, callback) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const result = callback(store);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
  });
}

function readAllItems() {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function putItem(item) {
  await withStore("readwrite", (store) => store.put(item));
}

async function addFromComposer() {
  const text = els.quickInput.value.trim();
  if (!text) return;
  const item = FlowDomain.createItem(text, els.kindSelect.value, state.items.length + 1);
  await putItem(item);
  state.items.push(item);
  els.quickInput.value = "";
  els.kindSelect.value = "auto";
  state.mode = item.kind;
  renderNav();
  render();
}

async function updateItem(id, patch) {
  const item = state.items.find((candidate) => candidate.id === id);
  if (!item) return;
  Object.assign(item, patch, { updatedAt: new Date().toISOString() });
  await putItem(item);
  render();
}

async function clearDone() {
  const doneItems = state.items.filter((item) => item.checked || item.status === "Done");
  await Promise.all(doneItems.map((item) => updateItem(item.id, { deletedAt: new Date().toISOString() })));
}

async function seedInitialItems() {
  const samples = [
    "Draft launch checklist tomorrow 9am #release",
    "Capture first impressions from the PRD and tune the calm dashboard layout. Keep this note readable and local-first.",
    "Ready: review workflow board interactions #design",
    "Plan reminder center today 5pm #reminders"
  ];
  const overrides = ["checklist", "journal", "workflow", "timeline"];
  const items = samples.map((sample, index) => FlowDomain.createItem(sample, overrides[index], index + 1));
  await Promise.all(items.map(putItem));
}

function renderNav() {
  els.modeNav.innerHTML = "";
  FlowDomain.MODES.forEach((mode) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `nav-button tone-${mode.tone}`;
    button.dataset.mode = mode.id;
    button.textContent = mode.label;
    button.setAttribute("aria-current", state.mode === mode.id ? "page" : "false");
    button.addEventListener("click", () => {
      state.mode = mode.id;
      renderNav();
      render();
    });
    els.modeNav.append(button);
  });
}

function render() {
  const summary = FlowDomain.summarize(state.items);
  els.todayCount.textContent = summary.today;
  els.upcomingCount.textContent = summary.upcoming;
  els.overdueCount.textContent = summary.overdue;
  els.completeCount.textContent = `${summary.completePercent}%`;

  const activeMode = FlowDomain.MODES.find((mode) => mode.id === state.mode);
  els.viewEyebrow.textContent = state.mode === "dashboard" ? "Daily control center" : "List mode";
  els.viewTitle.textContent = activeMode.label;

  const visible = FlowDomain.filterItems(state.items, state.mode, state.query, state.filter);
  els.itemsMount.innerHTML = "";
  if (!visible.length) {
    els.itemsMount.append(document.getElementById("emptyTemplate").content.cloneNode(true));
  } else if (state.mode === "workflow") {
    renderBoard(visible);
  } else if (state.mode === "timeline") {
    renderTimeline(visible);
  } else {
    visible.forEach((item) => els.itemsMount.append(renderItem(item)));
  }
  renderCity(summary);
}

function renderItem(item) {
  const row = document.createElement("article");
  row.className = `item-row item-${item.kind}`;
  row.draggable = true;
  row.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", item.id));
  row.addEventListener("dragover", (event) => event.preventDefault());
  row.addEventListener("drop", async (event) => {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData("text/plain");
    const dragged = state.items.find((candidate) => candidate.id === draggedId);
    if (!dragged || dragged.id === item.id) return;
    const targetPosition = item.position;
    await updateItem(dragged.id, { position: targetPosition - 0.5 });
    normalizePositions();
  });

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = Boolean(item.checked || item.status === "Done");
  checkbox.setAttribute("aria-label", `Complete ${item.title}`);
  checkbox.addEventListener("change", () => updateItem(item.id, { checked: checkbox.checked, status: checkbox.checked ? "Done" : "active" }));

  const body = document.createElement("div");
  body.className = "item-body";

  const title = document.createElement("input");
  title.className = "inline-title";
  title.value = item.title;
  title.setAttribute("aria-label", "Item title");
  title.addEventListener("change", () => updateItem(item.id, { title: title.value.trim() || "Untitled item" }));

  const meta = document.createElement("div");
  meta.className = "item-meta";
  meta.textContent = formatMeta(item);

  body.append(title, meta);
  if (item.body) {
    const copy = document.createElement("p");
    copy.className = "item-copy";
    copy.textContent = item.body;
    body.append(copy);
  }

  const remove = document.createElement("button");
  remove.className = "icon-button";
  remove.type = "button";
  remove.textContent = "×";
  remove.setAttribute("aria-label", `Delete ${item.title}`);
  remove.addEventListener("click", () => updateItem(item.id, { deletedAt: new Date().toISOString() }));

  row.append(checkbox, body, remove);
  return row;
}

function renderBoard(items) {
  const board = document.createElement("div");
  board.className = "board";
  FlowDomain.WORKFLOW_COLUMNS.forEach((column) => {
    const lane = document.createElement("section");
    lane.className = "board-column";
    lane.innerHTML = `<h2>${column}</h2>`;
    lane.addEventListener("dragover", (event) => event.preventDefault());
    lane.addEventListener("drop", async (event) => {
      event.preventDefault();
      const id = event.dataTransfer.getData("text/plain");
      await updateItem(id, { status: column, checked: column === "Done" });
    });
    items.filter((item) => item.status === column).forEach((item) => lane.append(renderItem(item)));
    board.append(lane);
  });
  els.itemsMount.append(board);
}

function renderTimeline(items) {
  const timeline = document.createElement("div");
  timeline.className = "timeline";
  items.forEach((item) => {
    const entry = renderItem(item);
    const date = document.createElement("input");
    date.type = "datetime-local";
    date.className = "date-input";
    date.value = toLocalDateTimeValue(item.dueAt);
    date.setAttribute("aria-label", `Due date for ${item.title}`);
    date.addEventListener("change", () => updateItem(item.id, { dueAt: new Date(date.value).toISOString() }));
    entry.querySelector(".item-body").append(date);
    timeline.append(entry);
  });
  els.itemsMount.append(timeline);
}

async function normalizePositions() {
  const ordered = [...state.items].sort((a, b) => a.position - b.position);
  await Promise.all(ordered.map((item, index) => updateItem(item.id, { position: index + 1 })));
}

function renderCity(summary) {
  els.cityView.innerHTML = "";
  const modes = FlowDomain.MODES.filter((mode) => mode.id !== "dashboard");
  modes.forEach((mode, index) => {
    const node = document.createElement("span");
    const count = state.items.filter((item) => item.kind === mode.id && !item.deletedAt).length;
    node.className = `city-node tone-${mode.tone}`;
    node.style.left = `${18 + index * 21}%`;
    node.style.top = `${42 + (index % 2) * 26}%`;
    node.style.transform = `scale(${Math.max(0.85, Math.min(1.6, 0.8 + count * 0.12))})`;
    els.cityView.append(node);
  });
  els.fallbackSummary.innerHTML = `
    <p><strong>${summary.total}</strong> active local records</p>
    <p>${summary.overdue} overdue, ${summary.upcoming} upcoming, ${summary.done} complete</p>
  `;
}

function formatMeta(item) {
  const parts = [item.kind];
  if (item.status && item.kind === "workflow") parts.push(item.status);
  if (item.dueAt) parts.push(`due ${new Date(item.dueAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`);
  if (item.labels?.length) parts.push(item.labels.map((label) => `#${label}`).join(" "));
  return parts.join(" · ");
}

function toLocalDateTimeValue(value) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

async function exportData() {
  const payload = JSON.stringify({ exportedAt: new Date().toISOString(), items: state.items }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `flowways-export-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importData(event) {
  const [file] = event.target.files;
  if (!file) return;
  const payload = JSON.parse(await file.text());
  const items = Array.isArray(payload.items) ? payload.items : [];
  await Promise.all(items.map(putItem));
  state.items = await readAllItems();
  render();
}

function openReminders() {
  const reminders = FlowDomain.filterItems(state.items, "dashboard", "", "active").filter((item) => item.dueAt);
  els.reminderList.innerHTML = reminders.length
    ? reminders.map((item) => `<p><strong>${escapeHtml(item.title)}</strong><span>${new Date(item.dueAt).toLocaleString()}</span></p>`).join("")
    : "<p>No active dated items.</p>";
  els.reminderDialog.showModal();
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    els.permissionButton.textContent = "Notifications unavailable";
    return;
  }
  const result = await Notification.requestPermission();
  els.permissionButton.textContent = result === "granted" ? "Notifications enabled" : "Notifications not enabled";
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js");
  } catch {
    els.syncStatus.textContent = "Offline shell unavailable";
  }
}

function updateNetworkStatus() {
  els.syncStatus.textContent = navigator.onLine ? "Local only" : "Offline ready";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
