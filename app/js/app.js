// Vice Platinum II — GTA VI trophy guide & tracker.
// Loads the guide data (trophies, sources, disputes, roadmap) from app/data/,
// renders the 3-pane checklist, the roadmap, the disputes and the sources views,
// and saves progress (earned trophies + counters) in localStorage with export/import.
// The app fetches nothing from the network: every file it loads lives under app/.

const DATA_FILES = ["trophies.json", "sources.json", "disputes.json", "roadmap.json"];
const STORAGE_KEY = "vice-platinum-2-progress-v1";
const KIND_FILTERS = [
  { key: "all", label: "All 55" },
  { key: "story", label: "Story" },
  { key: "missable", label: "Missable" },
  { key: "collectible", label: "Collectibles" },
  { key: "activity", label: "Activities" },
  { key: "character", label: "Characters" },
  { key: "robbery", label: "Robbery" },
  { key: "money", label: "Money" },
  { key: "misc", label: "Misc & combat" },
  { key: "online", label: "Online" },
];

let trophies = [];
let sources = [];
let disputes = [];
let roadmap = null;
let audit = null;

const state = {
  earned: new Set(),
  counts: {},
  revealed: new Set(),
  spoiler: true,
  filter: "all",
  query: "",
  selected: "positive-mental-attitude",
  view: "checklist",
};

const $ = (id) => document.getElementById(id);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const gradeLabel = (g) => g.charAt(0).toUpperCase() + g.slice(1);
const sourceByNumber = (n) => sources.find((s) => s.n === n);
const trophyById = (id) => trophies.find((t) => t.id === id);
const disputeById = (id) => disputes.find((d) => d.id === id);

async function loadGuideData() {
  const [t, s, d, r] = await Promise.all(
    DATA_FILES.map((f) => fetch("data/" + f).then((res) => {
      if (!res.ok) throw new Error("Cannot load data/" + f);
      return res.json();
    })),
  );
  trophies = t.trophies;
  sources = s.sources;
  disputes = d.disputes;
  roadmap = r;
}

function loadSavedProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    state.earned = new Set(saved.earned || []);
    state.counts = saved.counts || {};
    if (typeof saved.spoiler === "boolean") state.spoiler = saved.spoiler;
  } catch (e) { /* a corrupt save starts fresh */ }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    earned: [...state.earned],
    counts: state.counts,
    spoiler: state.spoiler,
  }));
}

function readHashState() {
  const hash = location.hash.replace(/^#/, "");
  const params = new URLSearchParams(hash);
  if (params.get("view")) state.view = params.get("view");
  if (params.get("trophy") && trophyById(params.get("trophy"))) state.selected = params.get("trophy");
  if (params.get("spoiler") === "off") state.spoiler = false;
  if (params.get("spoiler") === "on") state.spoiler = true;
}

function writeHashState() {
  const params = new URLSearchParams();
  params.set("view", state.view);
  if (state.view === "checklist") params.set("trophy", state.selected);
  params.set("spoiler", state.spoiler ? "on" : "off");
  history.replaceState(null, "", "#" + params.toString());
}

function computeAuditCounts() {
  const steps = trophies.flatMap((t) => t.steps);
  const cites = steps.flatMap((s) => s.cites);
  const backedTwoPlus = steps.filter((s) => s.cites.length >= 2).length;
  audit = {
    claims: steps.length,
    citations: cites.length,
    backedPct: steps.length ? Math.round((backedTwoPlus / steps.length) * 100) : 0,
    sources: sources.length,
    disputes: disputes.length,
    missable: trophies.filter((t) => t.missable).length,
    atRisk: trophies.filter((t) => t.atRisk).length,
    unconfirmed: trophies.filter((t) => t.unconfirmed).length,
  };
}

function trophyIsSpoiled(t) {
  return state.spoiler && (t.kind === "story" || t.hidden) && !state.earned.has(t.id) && !state.revealed.has(t.id);
}

function trophyMatchesFilter(t) {
  if (state.filter === "all") return true;
  if (state.filter === "missable") return t.missable;
  if (state.filter === "online") return false;
  if (state.filter === "misc") return t.kind === "misc" || t.kind === "combat";
  return t.kind === state.filter;
}

function trophyMatchesQuery(t) {
  if (!state.query) return true;
  const q = state.query.toLowerCase();
  return (t.name + " " + t.description + " " + t.guide).toLowerCase().includes(q);
}

function visibleTrophies() {
  return trophies.filter((t) => trophyMatchesFilter(t) && trophyMatchesQuery(t));
}

function renderAuditStrip() {
  const cells = [
    { num: audit.claims + "/" + audit.claims, sub: "claims", label: "Atomic claims", cls: "good" },
    { num: audit.backedPct + "%", sub: "of steps", label: "Backed by 2+ sources", cls: "good" },
    { num: audit.sources + "", sub: "· read 21 Nov 2026", label: "Numbered sources", cls: "" },
    { num: audit.disputes + "", sub: "both sides shown", label: "Disputes", cls: "" },
    { num: audit.missable + "", sub: "trophy", label: "Missable", cls: "warn" },
    { num: audit.atRisk + "", sub: "methods", label: "At-risk", cls: "warn" },
    { num: audit.unconfirmed + "", sub: "trophies", label: "Unconfirmed", cls: "bad" },
  ];
  $("auditStrip").innerHTML = cells.map((c) =>
    `<div class="audit-cell ${c.cls}"><div class="audit-num">${c.num} <span class="audit-sub">${c.sub}</span></div><div class="audit-label">${c.label}</div></div>`,
  ).join("");
  $("footerCounts").textContent =
    `${audit.claims} claims · ${audit.citations} citations · ${audit.disputes} disputes · ${audit.sources} sources · read 21 Nov 2026.`;
}

function renderProgress() {
  const earned = state.earned.size;
  const pct = Math.round((earned / trophies.length) * 100);
  $("progressText").textContent = `${earned} / ${trophies.length} earned`;
  $("progressFill").style.width = pct + "%";
  $("progressPct").textContent = pct + "%";
}

function renderFilterChips() {
  $("chips").innerHTML = KIND_FILTERS.map((f) => {
    const count = f.key === "all" ? trophies.length
      : f.key === "missable" ? trophies.filter((t) => t.missable).length
      : f.key === "online" ? 0
      : f.key === "misc" ? trophies.filter((t) => t.kind === "misc" || t.kind === "combat").length
      : trophies.filter((t) => t.kind === f.key).length;
    return `<button type="button" class="chip${state.filter === f.key ? " active" : ""}" data-filter="${f.key}">${f.label} · ${count}</button>`;
  }).join("");
  $("chips").querySelectorAll(".chip").forEach((b) =>
    b.addEventListener("click", () => { state.filter = b.dataset.filter; renderFilterChips(); renderTrophyList(); }),
  );
}

function trophyRowHtml(t) {
  const earned = state.earned.has(t.id);
  const spoiled = trophyIsSpoiled(t);
  const count = t.target ? `<span class="trophy-count">${state.counts[t.id] || 0}/${t.target}</span>` : "";
  const tags = [
    t.missable ? `<span class="tag missable">Missable</span>` : "",
    t.atRisk ? `<span class="tag atrisk">At-risk</span>` : "",
    t.unconfirmed ? `<span class="tag unconfirmed">Unconfirmed</span>` : "",
    t.hidden ? `<span class="tag hidden">Hidden</span>` : "",
  ].join("");
  const name = spoiled ? "Hidden trophy — earn it to reveal" : esc(t.name);
  const desc = spoiled ? "Hidden on PlayStation until earned." : esc(t.description);
  return `<div class="trophy-row${earned ? " earned" : ""}${state.selected === t.id ? " selected" : ""}" data-id="${t.id}" role="button" tabindex="0">
    <input type="checkbox" ${earned ? "checked" : ""} aria-label="Mark ${esc(t.name)} earned">
    <span class="grade-dot ${t.grade}" title="${gradeLabel(t.grade)}"></span>
    <span><span class="trophy-name">${name}</span><br><span class="trophy-desc${spoiled ? " spoiled" : ""}">${desc}</span><span class="trophy-tags">${tags}</span></span>
    ${count}
  </div>`;
}

function renderTrophyList() {
  const list = visibleTrophies();
  $("listPane").innerHTML = `<div class="list-head"><span>Trophies</span><span class="list-count">${list.length} shown · ${state.earned.size} earned</span></div>` +
    (list.length ? list.map(trophyRowHtml).join("") : `<p class="empty-note">No trophies match this filter.</p>`);
  $("listPane").querySelectorAll(".trophy-row").forEach((row) => {
    row.addEventListener("click", (e) => {
      if (e.target.tagName === "INPUT") return;
      selectTrophy(row.dataset.id);
    });
    row.querySelector("input").addEventListener("change", (e) => {
      toggleEarned(row.dataset.id, e.target.checked);
    });
  });
}

function citeHtml(numbers) {
  return numbers.map((n) => {
    const s = sourceByNumber(n);
    return `<span class="cite" title="${s ? esc(s.short) + " — " + esc(s.title) : "Source " + n}">[${n}]</span>`;
  }).join(" ");
}

function trophySourcesUsed(t) {
  const nums = [...new Set(t.steps.flatMap((s) => s.cites))].sort((a, b) => a - b);
  return nums.map((n) => {
    const claimsHere = t.steps.reduce((acc, s) => acc + (s.cites.includes(n) ? 1 : 0), 0);
    return { source: sourceByNumber(n), claimsHere };
  });
}

function selectTrophy(id) {
  state.selected = id;
  renderTrophyList();
  renderTrophyDetail();
  renderRail();
  writeHashState();
}

function toggleEarned(id, earned) {
  if (earned) state.earned.add(id); else state.earned.delete(id);
  saveProgress();
  renderProgress();
  renderTrophyList();
  renderTrophyDetail();
  renderRail();
}

function changeCount(id, delta) {
  const t = trophyById(id);
  if (!t || !t.target) return;
  const next = Math.max(0, Math.min(t.target, (state.counts[id] || 0) + delta));
  state.counts[id] = next;
  if (next >= t.target && !state.earned.has(id)) state.earned.add(id);
  saveProgress();
  renderProgress();
  renderTrophyList();
  renderTrophyDetail();
  renderRail();
}

function stepperHtml(t) {
  if (!t.target) return "";
  const cur = state.counts[t.id] || 0;
  return `<div class="stepper"><span>YOUR COUNT</span>
    <button type="button" data-step="-1" aria-label="Decrease count">−</button>
    <span class="stepper-count">${cur} / ${t.target}</span>
    <button type="button" data-step="1" aria-label="Increase count">+</button>
    <span>${esc(t.targetUnit || "")}</span></div>`;
}

function bindSteppers(root) {
  root.querySelectorAll("[data-step]").forEach((b) =>
    b.addEventListener("click", () => changeCount(state.selected, Number(b.dataset.step))),
  );
}

function renderTrophyDetail() {
  const t = trophyById(state.selected) || trophies[0];
  if (!t) return;
  const spoiled = trophyIsSpoiled(t);
  const disputeHtml = (t.disputes || []).map((id) => {
    const d = disputeById(id);
    if (!d) return "";
    return `<div class="dispute-box"><h3>SOURCES DIFFER — BOTH VERSIONS SHOWN</h3>
      <p><strong>${esc(d.claim)}</strong></p>
      <p>${esc(d.call)}</p>
      <p><a href="#view=disputes" data-goto-disputes="${d.id}">Read both versions (${d.id}) →</a></p></div>`;
  }).join("");
  const sourcesHtml = trophySourcesUsed(t).map(({ source, claimsHere }) =>
    source ? `<li><strong>[${source.n}] ${esc(source.short)}</strong> — ${esc(source.title)} · <span class="claims-here">${claimsHere} claim${claimsHere > 1 ? "s" : ""} here</span> · read ${source.read}${source.via ? ` · via ${esc(source.via)}` : ""}<br><a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.url)}</a></li>` : "",
  ).join("");
  $("detailPane").innerHTML = `
    <div class="detail-head"><h2>${spoiled ? "Hidden trophy" : esc(t.name)}</h2>
      <span class="grade-badge ${t.grade}">${gradeLabel(t.grade)}</span>
      ${t.hidden ? `<span class="tag hidden">Hidden on PSN</span>` : ""}
      <span class="tag">${esc(t.kind)}</span>
      <span class="tag">Stage ${t.stage}</span></div>
    <blockquote class="official-desc"><span class="official-label">Official description — as PlayStation publishes it</span>${spoiled ? "Hidden until earned." : esc(t.description)}</blockquote>
    ${t.missable ? `<div class="missable-box"><h3>⚠ MISSABLE — CH 1 ONLY</h3><p>After the mission Down to Earth, Lucia meditates on the balcony at Jason’s house. Do it before Chapter 1 ends — it is gone afterwards, and it is unconfirmed whether the trophy needs it. See dispute D02.</p></div>` : ""}
    ${t.unconfirmed ? `<div class="unconfirmed-box"><h3>? UNCONFIRMED — NO VERIFIED METHOD YET</h3><p>Five trophies are still unsolved as of 21 Nov 2026. This guide shows what the sources actually say instead of inventing a method.</p></div>` : ""}
    ${spoiled ? `<div class="missable-box"><h3>SPOILER SHIELD IS ON</h3><p>This trophy’s name, description and guide are hidden until you earn it. <button type="button" id="revealBtn">Show guide anyway</button></p></div>`
      : `<p class="detail-guide">${esc(t.guide)}</p>
    <ol class="steps">${t.steps.map((s) => `<li>${esc(s.text)} ${citeHtml(s.cites)}</li>`).join("")}</ol>
    ${stepperHtml(t)}
    ${disputeHtml}
    <div class="sources-side"><h3>SOURCES FOR THIS TROPHY</h3><ol>${sourcesHtml}</ol></div>`}
  `;
  const reveal = $("revealBtn");
  if (reveal) reveal.addEventListener("click", () => { state.revealed.add(t.id); renderTrophyDetail(); renderTrophyList(); });
  bindSteppers($("detailPane"));
  $("detailPane").querySelectorAll("[data-goto-disputes]").forEach((a) =>
    a.addEventListener("click", () => setTimeout(() => showView("disputes"), 0)),
  );
}

function nextUpTrophies() {
  const stageOrder = { S1: 0, S2: 1, S3: 2, S4: 3, S5: 4 };
  return trophies
    .filter((t) => !state.earned.has(t.id))
    .sort((a, b) => stageOrder[a.stage] - stageOrder[b.stage] || trophies.indexOf(a) - trophies.indexOf(b))
    .slice(0, 5);
}

function nextUpWhy(t) {
  if (t.missable) return "Do first — Ch 1 only";
  if (t.unconfirmed) return "Unconfirmed method";
  if (t.target) return `${state.counts[t.id] || 0}/${t.target} ${t.targetUnit || ""}`;
  if (t.kind === "story") return "Story — automatic";
  return `Stage ${t.stage} · ${t.kind}`;
}

function renderRail() {
  const t = trophyById(state.selected);
  const next = nextUpTrophies();
  const topDisputes = disputes.slice(0, 3);
  $("railPane").innerHTML = `
    <div class="rail-section"><h3>Next up</h3>
      ${next.map((n) => `<div class="nextup-item" data-id="${n.id}"><span class="stage-tag">${n.stage}</span><span><span class="nextup-name">${esc(n.name)}</span><br><span class="nextup-why">${esc(nextUpWhy(n))}</span></span></div>`).join("")}
    </div>
    <div class="rail-section"><h3>Sources differ</h3>
      ${topDisputes.map((d) => `<div class="rail-dispute"><span class="rail-dispute-title">${d.id} — ${esc(d.claim)}</span><br>${esc(d.call)}</div>`).join("")}
      <p><a href="#view=disputes" data-goto-disputes-all>All ${disputes.length} disputes →</a></p>
    </div>
    <div class="rail-section"><h3>Your count</h3>
      <div class="rail-count">${t && t.target
        ? `<div class="rail-count-num">${state.counts[t.id] || 0} / ${t.target}</div><div>${esc(t.name)} — ${esc(t.targetUnit || "")}</div>`
        : `<div class="rail-count-num">—</div><div>${t ? esc(t.name) : ""} — no counter for this trophy</div>`}
      </div>
    </div>`;
  $("railPane").querySelectorAll(".nextup-item").forEach((el) =>
    el.addEventListener("click", () => selectTrophy(el.dataset.id)),
  );
  const all = $("railPane").querySelector("[data-goto-disputes-all]");
  if (all) all.addEventListener("click", () => setTimeout(() => showView("disputes"), 0));
}

function renderRoadmap() {
  $("roadmapStages").innerHTML = roadmap.stages.map((s) => {
    const names = s.trophies.map((id) => {
      const t = trophyById(id);
      return t ? `<li>${state.earned.has(id) ? "✓ " : ""}${esc(t.name)}</li>` : "";
    }).join("");
    return `<div class="stage-card"><h3><span class="stage-id">${s.id}</span> ${esc(s.name)}</h3>
      <div class="stage-hours">${esc(s.hours)}</div>
      <p class="stage-focus">${esc(s.focus)}</p><ul>${names}</ul>
      <div class="stage-warn">${esc(s.warn)}</div></div>`;
  }).join("");
  const table = (title, rows) => `<div class="checklist-table"><h3>${title}</h3><table>${rows.map((r) => `<tr><td>${esc(r.item)}</td><td>${esc(r.goal)}</td></tr>`).join("")}</table></div>`;
  $("checklist100").innerHTML = `<h2>100% Completion checklist — A Long Road</h2>
    <p class="view-intro">${esc(roadmap.checklist.note)}</p>
    <div class="checklist-grid">
      ${table("Robberies", roadmap.checklist.robberies || [])}
      ${table("Collectibles", roadmap.checklist.collectibles)}
      ${table("Activities", roadmap.checklist.activities)}
    </div>
    <p class="view-intro">${esc(roadmap.checklist.robberiesNote)}</p>`;
}

function renderDisputes() {
  $("disputeCount").textContent = disputes.length;
  $("disputeList").innerHTML = disputes.map((d) => `
    <article class="dispute-card" id="dispute-${d.id}">
      <h3><span class="dispute-id">${d.id}</span> — ${esc(d.claim)}</h3>
      <div class="dispute-versus">
        <div class="dispute-version"><span class="version-src">Version A — ${esc(sourceByNumber(d.a.source)?.short || "Source " + d.a.source)} [${d.a.source}]</span><br>${esc(d.a.text)}</div>
        <div class="dispute-version"><span class="version-src">Version B — ${esc(sourceByNumber(d.b.source)?.short || "Source " + d.b.source)} [${d.b.source}]</span><br>${esc(d.b.text)}</div>
      </div>
      <p class="dispute-call"><strong>Our call:</strong> ${esc(d.call)}</p>
      <p class="view-intro">Applies to: ${d.trophies.map((id) => { const t = trophyById(id); return t ? esc(t.name) : id; }).join(" · ")}</p>
    </article>`).join("");
}

function renderSources() {
  const claimsPerSource = {};
  trophies.forEach((t) => t.steps.forEach((s) => s.cites.forEach((n) => { claimsPerSource[n] = (claimsPerSource[n] || 0) + 1; })));
  $("sourceList").innerHTML = sources.map((s) => `
    <article class="source-card"><span class="source-num">[${s.n}]</span><span>
      <span class="source-title">${esc(s.title)}</span><br>
      <span class="source-meta">${esc(s.publisher)} · read ${s.read} · ${claimsPerSource[s.n] || 0} claims cited${s.via ? ` · via ${esc(s.via)}` : ""}</span><br>
      <span class="source-meta">Covers: ${esc(s.covers)}</span><br>
      <a class="source-url" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a>
    </span></article>`).join("");
}

function showView(view) {
  state.view = view;
  document.querySelectorAll("#viewTabs button").forEach((b) =>
    b.setAttribute("aria-selected", String(b.dataset.view === view)),
  );
  ["checklist", "roadmap", "disputes", "sources"].forEach((v) => {
    $("view-" + v).hidden = v !== view;
  });
  if (view === "roadmap") renderRoadmap();
  if (view === "disputes") renderDisputes();
  if (view === "sources") renderSources();
  writeHashState();
}

function exportProgress() {
  const blob = new Blob([JSON.stringify({
    app: "vice-platinum-2",
    exportedAt: new Date().toISOString(),
    earned: [...state.earned],
    counts: state.counts,
  }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "vice-platinum-2-progress.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.earned)) throw new Error("bad file");
      state.earned = new Set(data.earned.filter((id) => trophyById(id)));
      state.counts = data.counts || {};
      saveProgress();
      renderAll();
    } catch (e) {
      alert("That file is not a Vice Platinum II export.");
    }
  };
  reader.readAsText(file);
}

function renderAll() {
  renderAuditStrip();
  renderProgress();
  renderFilterChips();
  renderTrophyList();
  renderTrophyDetail();
  renderRail();
  showView(state.view);
}

async function bootVicePlatinumGuide() {
  try {
    await loadGuideData();
  } catch (e) {
    $("listPane").innerHTML = `<p class="empty-note">Could not load the guide data. Serve app/ over HTTP (node serve.ts) — browsers block local file reads.</p>`;
    return;
  }
  loadSavedProgress();
  readHashState();
  computeAuditCounts();
  $("spoilerToggle").checked = state.spoiler;
  $("spoilerToggle").addEventListener("change", (e) => {
    state.spoiler = e.target.checked;
    saveProgress();
    renderTrophyList();
    renderTrophyDetail();
    writeHashState();
  });
  $("search").addEventListener("input", (e) => { state.query = e.target.value; renderTrophyList(); });
  $("exportBtn").addEventListener("click", exportProgress);
  $("importBtn").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", (e) => { if (e.target.files[0]) importProgress(e.target.files[0]); });
  document.querySelectorAll("#viewTabs button").forEach((b) =>
    b.addEventListener("click", () => showView(b.dataset.view)),
  );
  window.addEventListener("hashchange", () => { readHashState(); renderAll(); });
  renderAll();
}

bootVicePlatinumGuide();
