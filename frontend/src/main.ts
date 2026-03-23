import "./styles.css";
import {
  defaultLayout,
  newId,
  type BlockType,
  type GridBlock,
  type LayoutDoc,
  type StripBlock,
} from "./types";
import {
  fetchLayout,
  getApiBase,
  getToken,
  saveLayout,
  setConnection,
} from "./api";
import { collectEntityIds } from "./collect-entities";
import type { HassEntityState } from "./ha-entity";
import { LiveStatesManager } from "./live-states";

type ZoneTarget = "header" | "body" | "footer";

let layout: LayoutDoc = defaultLayout();
let selected: { zone: ZoneTarget; id: string } | null = null;
let editMode = true;
let dragType: BlockType | null = null;
let settingsOpen = false;
let liveEnabled = false;
let liveMgr: LiveStatesManager | null = null;
let lastLiveKey = "";
let renderScheduled = 0;

const app = document.querySelector<HTMLDivElement>("#app")!;

function scheduleRender(): void {
  if (renderScheduled) cancelAnimationFrame(renderScheduled);
  renderScheduled = requestAnimationFrame(() => {
    renderScheduled = 0;
    render();
  });
}

function ensureLiveConnection(): void {
  if (editMode || !liveEnabled) {
    liveMgr?.stop();
    liveMgr = null;
    lastLiveKey = "";
    return;
  }
  const ids = collectEntityIds(layout);
  const key = ids.join("\n");
  if (ids.length === 0) {
    liveMgr?.stop();
    liveMgr = null;
    lastLiveKey = "";
    return;
  }
  if (liveMgr && key === lastLiveKey) return;
  liveMgr?.stop();
  liveMgr = new LiveStatesManager();
  lastLiveKey = key;
  void liveMgr.start(ids, () => scheduleRender()).catch((e) => {
    console.warn(e);
    setStatus(`Живой: ${e instanceof Error ? e.message : String(e)}`, true);
  });
}

function formatEntityBlockHtml(
  b: StripBlock | GridBlock,
  st: HassEntityState | undefined,
): string {
  const eid = b.entityId!.trim();
  const title =
    b.title?.trim() ||
    (st?.attributes?.friendly_name != null
      ? String(st.attributes.friendly_name)
      : eid);
  if (!st) {
    return `<div class="entity-live"><div class="entity-live-title">${escapeHtml(title)}</div><div class="entity-live-val entity-live-missing">нет данных</div></div>`;
  }
  const unit = st.attributes.unit_of_measurement;
  const val =
    `${st.state}` +
    (unit != null && String(unit) !== "" ? ` ${String(unit)}` : "");
  return `<div class="entity-live"><div class="entity-live-title">${escapeHtml(String(title))}</div><div class="entity-live-val">${escapeHtml(val)}</div></div>`;
}

function blockInnerHtml(b: StripBlock | GridBlock): string {
  if (!liveEnabled || editMode || b.type !== "entity" || !b.entityId?.trim()) {
    return escapeHtml(blockLabel(b));
  }
  const st = liveMgr?.getState(b.entityId.trim());
  return formatEntityBlockHtml(b, st);
}

function stripBlocks(doc: LayoutDoc, zone: "header" | "footer"): StripBlock[] {
  const raw = zone === "header" ? doc.header.blocks : doc.footer.blocks;
  return raw.map((b, i) => ({
    ...b,
    order: typeof (b as StripBlock).order === "number" ? (b as StripBlock).order : i,
  }));
}

function normalize(doc: LayoutDoc): LayoutDoc {
  const h = stripBlocks(doc, "header").sort((a, b) => a.order - b.order);
  const f = stripBlocks(doc, "footer").sort((a, b) => a.order - b.order);
  return {
    ...doc,
    header: { ...doc.header, blocks: h },
    footer: { ...doc.footer, blocks: f },
  };
}

function maxGridRow(doc: LayoutDoc): number {
  let m = 4;
  for (const b of doc.body.blocks) {
    m = Math.max(m, b.row + b.rowSpan - 1);
  }
  return m;
}

function render(): void {
  const selId = selected?.id ?? null;
  const selZone = selected?.zone ?? null;

  app.innerHTML = `
    <header class="toolbar">
      <button type="button" class="primary" id="btn-save">Сохранить в HA</button>
      <button type="button" id="btn-load">Загрузить</button>
      <button type="button" id="btn-toggle">${editMode ? "Просмотр" : "Правка"}</button>
      <label class="toolbar-live ${editMode ? "hidden" : ""}">
        <input type="checkbox" id="chk-live" ${liveEnabled ? "checked" : ""} />
        Живой
      </label>
      <button type="button" id="btn-export">Экспорт JSON</button>
      <label class="file-btn">Импорт JSON<input type="file" id="inp-import" accept="application/json" /></label>
      <button type="button" id="btn-settings">Подключение…</button>
      <span class="status" id="status"></span>
    </header>
    <div class="layout-main">
      <aside class="palette ${editMode ? "" : "hidden"}">
        <h3>Блоки</h3>
        <button type="button" class="palette-item" draggable="true" data-type="text">Текст</button>
        <button type="button" class="palette-item" draggable="true" data-type="markdown">Markdown</button>
        <button type="button" class="palette-item" draggable="true" data-type="entity">Сущность HA</button>
        <button type="button" class="palette-item" draggable="true" data-type="spacer">Отступ</button>
        <p style="font-size:0.75rem;color:var(--muted);margin:1rem 0 0">
          Перетащите блок в шапку, сетку или подвал.
        </p>
      </aside>
      <main class="canvas-wrap">
        <div class="canvas" id="canvas" style="--accent:${layout.theme.accent}">
          ${renderZoneHeaderFooter("header", layout.header.enabled, layout.header.heightPx, layout.header.blocks, selZone === "header", selId)}
          ${renderBody(layout, selZone === "body", selId)}
          ${renderZoneHeaderFooter("footer", layout.footer.enabled, layout.footer.heightPx, layout.footer.blocks, selZone === "footer", selId)}
        </div>
      </main>
      <aside class="inspector ${editMode ? "" : "hidden"}">
        <h3>Свойства</h3>
        <div id="inspector-body">${renderInspector()}</div>
      </aside>
    </div>
    ${settingsOpen ? renderSettingsModal() : ""}
  `;

  bindToolbar();
  bindPalette();
  bindCanvas();
  bindInspector();
  bindSettingsModal();
  queueMicrotask(() => ensureLiveConnection());
}

function renderZoneHeaderFooter(
  zone: "header" | "footer",
  enabled: boolean,
  heightPx: number,
  blocks: StripBlock[],
  zoneSelected: boolean,
  selId: string | null,
): string {
  if (!enabled) {
    return `<section class="zone" data-zone="${zone}" style="min-height:32px;background:#0c0e12">
      <span class="zone-label">${zone === "header" ? "Шапка (выкл.)" : "Подвал (выкл.)"}</span>
    </section>`;
  }
  const drop = editMode ? "drop-target" : "";
  return `<section class="zone" data-zone="${zone}" style="min-height:${heightPx}px">
    <span class="zone-label">${zone === "header" ? "Шапка" : "Подвал"}</span>
    <div class="zone-strip ${drop}" data-drop="${zone}" style="min-height:${Math.max(heightPx - 8, 40)}px">
      ${blocks
        .slice()
        .sort((a, b) => a.order - b.order)
        .map(
          (b) =>
            `<div class="strip-block ${selId === b.id && zoneSelected ? "selected" : ""}" data-zone="${zone}" data-id="${b.id}" title="${escapeAttr(b.title ?? b.type)}">${blockInnerHtml(b)}</div>`,
        )
        .join("")}
    </div>
  </section>`;
}

function renderBody(doc: LayoutDoc, zoneSelected: boolean, selId: string | null): string {
  const rows = maxGridRow(doc);
  const rh = doc.body.rowHeightPx;
  const cols = doc.body.columns;
  const gap = doc.body.gapPx;
  return `<section class="zone" data-zone="body">
    <span class="zone-label">Тело (сетка ${cols}×${rows})</span>
    <div
      class="body-grid ${editMode ? "drop-target" : ""}"
      data-drop="body"
      style="--cols:${cols};--rh:${rh}px;gap:${gap}px;grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},${rh}px);"
    >
      ${doc.body.blocks
        .map(
          (b) =>
            `<div class="grid-block ${selId === b.id && zoneSelected ? "selected" : ""}"
              data-zone="body" data-id="${b.id}"
              style="grid-column:${b.col} / span ${b.colSpan};grid-row:${b.row} / span ${b.rowSpan}"
            >${blockInnerHtml(b)}</div>`,
        )
        .join("")}
    </div>
  </section>`;
}

function blockLabel(b: StripBlock | GridBlock): string {
  if (b.title?.trim()) return b.title.trim();
  if (b.type === "entity" && "entityId" in b && b.entityId) return b.entityId;
  if ((b.type === "text" || b.type === "markdown") && "content" in b && b.content)
    return b.content.slice(0, 48) + (b.content.length > 48 ? "…" : "");
  if (b.type === "spacer") return "Отступ";
  return b.type;
}

function renderInspector(): string {
  if (!selected) {
    return `<p style="color:var(--muted);font-size:0.85rem">Выберите блок на макете.</p>
      <div class="field"><label>Акцент темы</label>
        <input type="text" id="th-accent" value="${escapeAttr(layout.theme.accent)}" />
      </div>
      <div class="field"><label>Колонки сетки</label>
        <input type="number" id="th-cols" min="4" max="24" value="${layout.body.columns}" />
      </div>
      <div class="field"><label>Высота строки (px)</label>
        <input type="number" id="th-rh" min="32" max="200" value="${layout.body.rowHeightPx}" />
      </div>
      <div class="field"><label>Отступ сетки (px)</label>
        <input type="number" id="th-gap" min="0" max="48" value="${layout.body.gapPx}" />
      </div>
      <div class="field"><label><input type="checkbox" id="th-head" ${layout.header.enabled ? "checked" : ""} /> Шапка</label></div>
      <div class="field"><label>Высота шапки (px)</label>
        <input type="number" id="th-hh" min="32" max="200" value="${layout.header.heightPx}" />
      </div>
      <div class="field"><label><input type="checkbox" id="th-foot" ${layout.footer.enabled ? "checked" : ""} /> Подвал</label></div>
      <div class="field"><label>Высота подвала (px)</label>
        <input type="number" id="th-fh" min="32" max="200" value="${layout.footer.heightPx}" />
      </div>`;
  }

  const block = findBlock(selected.zone, selected.id);
  if (!block) return "<p>Блок не найден</p>";

  const base = `
    <div class="field"><label>Заголовок</label>
      <input type="text" id="in-title" value="${escapeAttr(block.title ?? "")}" />
    </div>
    <p style="font-size:0.75rem;color:var(--muted)">Тип: ${block.type}</p>
  `;

  if (selected.zone === "body" && "col" in block) {
    const gb = block as GridBlock;
    return (
      base +
      `
      <div class="field"><label>Колонка (1–${layout.body.columns})</label>
        <input type="number" id="in-col" min="1" max="${layout.body.columns}" value="${gb.col}" />
      </div>
      <div class="field"><label>Строка</label>
        <input type="number" id="in-row" min="1" max="99" value="${gb.row}" />
      </div>
      <div class="field"><label>Ширина (span)</label>
        <input type="number" id="in-cs" min="1" max="${layout.body.columns}" value="${gb.colSpan}" />
      </div>
      <div class="field"><label>Высота (span)</label>
        <input type="number" id="in-rs" min="1" max="50" value="${gb.rowSpan}" />
      </div>
      ${gb.type === "entity" ? entityFields(gb) : ""}
      ${gb.type === "text" || gb.type === "markdown" ? contentField(gb) : ""}
      <button type="button" id="btn-del" style="margin-top:0.5rem;width:100%;border-color:var(--danger)">Удалить блок</button>
    `
    );
  }

  const sb = block as StripBlock;
  return (
    base +
    `
    <div class="field"><label>Порядок</label>
      <input type="number" id="in-order" min="0" max="999" value="${sb.order}" />
    </div>
    ${sb.type === "entity" ? entityFieldsStrip(sb) : ""}
    ${sb.type === "text" || sb.type === "markdown" ? contentFieldStrip(sb) : ""}
    <button type="button" id="btn-del" style="margin-top:0.5rem;width:100%;border-color:var(--danger)">Удалить блок</button>
  `
  );
}

function entityFields(gb: GridBlock): string {
  return `<div class="field"><label>entity_id</label>
    <input type="text" id="in-entity" placeholder="sensor.temperature" value="${escapeAttr(gb.entityId ?? "")}" />
  </div>`;
}

function entityFieldsStrip(sb: StripBlock): string {
  return `<div class="field"><label>entity_id</label>
    <input type="text" id="in-entity" placeholder="sensor.temperature" value="${escapeAttr(sb.entityId ?? "")}" />
  </div>`;
}

function contentField(gb: GridBlock): string {
  return `<div class="field"><label>Текст</label>
    <textarea id="in-content">${escapeHtml(gb.content ?? "")}</textarea>
  </div>`;
}

function contentFieldStrip(sb: StripBlock): string {
  return `<div class="field"><label>Текст</label>
    <textarea id="in-content">${escapeHtml(sb.content ?? "")}</textarea>
  </div>`;
}

function findBlock(zone: ZoneTarget, id: string): StripBlock | GridBlock | undefined {
  if (zone === "body") return layout.body.blocks.find((b) => b.id === id);
  const list = zone === "header" ? layout.header.blocks : layout.footer.blocks;
  return list.find((b) => b.id === id);
}

function bindToolbar(): void {
  document.getElementById("btn-save")?.addEventListener("click", async () => {
    setStatus("Сохранение…");
    try {
      await saveLayout(normalize(layout));
      setStatus("Сохранено");
    } catch (e) {
      setStatus(`Ошибка: ${e instanceof Error ? e.message : String(e)}`, true);
    }
  });
  document.getElementById("btn-load")?.addEventListener("click", async () => {
    setStatus("Загрузка…");
    try {
      layout = normalize(await fetchLayout());
      selected = null;
      setStatus("Загружено");
      render();
    } catch (e) {
      setStatus(`Ошибка: ${e instanceof Error ? e.message : String(e)}`, true);
    }
  });
  document.getElementById("btn-toggle")?.addEventListener("click", () => {
    editMode = !editMode;
    if (editMode) liveEnabled = false;
    render();
  });
  document.getElementById("chk-live")?.addEventListener("change", (e) => {
    liveEnabled = (e.target as HTMLInputElement).checked;
    render();
  });
  document.getElementById("btn-export")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(normalize(layout), null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "dashboard-layout.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById("inp-import")?.addEventListener("change", (ev) => {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const doc = JSON.parse(String(r.result)) as LayoutDoc;
        layout = normalize(doc);
        selected = null;
        setStatus("Импорт OK");
        render();
      } catch {
        setStatus("Неверный JSON", true);
      }
    };
    r.readAsText(f);
    (ev.target as HTMLInputElement).value = "";
  });
  document.getElementById("btn-settings")?.addEventListener("click", () => {
    settingsOpen = true;
    render();
  });
}

function bindPalette(): void {
  document.querySelectorAll<HTMLButtonElement>(".palette-item").forEach((btn) => {
    btn.addEventListener("dragstart", () => {
      dragType = (btn.dataset.type as BlockType) ?? null;
    });
    btn.addEventListener("dragend", () => {
      dragType = null;
    });
  });
}

function bindCanvas(): void {
  document.querySelectorAll<HTMLDivElement>(".strip-block, .grid-block").forEach((el) => {
    el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const zone = el.dataset.zone as ZoneTarget;
      const id = el.dataset.id;
      if (!id || !zone) return;
      selected = { zone, id };
      render();
    });
  });

  document.querySelectorAll<HTMLDivElement>("[data-drop]").forEach((zoneEl) => {
    zoneEl.addEventListener("dragover", (ev) => {
      if (!editMode || !dragType) return;
      ev.preventDefault();
    });
    zoneEl.addEventListener("drop", (ev) => {
      ev.preventDefault();
      if (!editMode || !dragType) return;
      const z = zoneEl.dataset.drop as ZoneTarget;
      addBlock(z, dragType);
      dragType = null;
      render();
    });
  });

  document.querySelector(".canvas-wrap")?.addEventListener("click", (ev) => {
    if (ev.target === ev.currentTarget) {
      selected = null;
      render();
    }
  });
}

function addBlock(zone: ZoneTarget, type: BlockType): void {
  if (zone === "body") {
    const col = 1;
    const row = 1;
    const b: GridBlock = {
      id: newId(),
      type,
      col,
      row,
      colSpan: Math.min(4, layout.body.columns),
      rowSpan: 1,
      title: defaultTitle(type),
      content: type === "text" || type === "markdown" ? "Текст" : undefined,
      entityId: type === "entity" ? "sun.sun" : undefined,
    };
    layout.body.blocks.push(b);
    selected = { zone: "body", id: b.id };
    return;
  }
  const list = zone === "header" ? layout.header.blocks : layout.footer.blocks;
  const maxOrder = list.reduce((m, x) => Math.max(m, x.order ?? 0), -1);
  const b: StripBlock = {
    id: newId(),
    type,
    order: maxOrder + 1,
    title: defaultTitle(type),
    content: type === "text" || type === "markdown" ? "Текст" : undefined,
    entityId: type === "entity" ? "sun.sun" : undefined,
  };
  list.push(b);
  selected = { zone, id: b.id };
}

function defaultTitle(type: BlockType): string {
  switch (type) {
    case "text":
      return "Текст";
    case "markdown":
      return "Markdown";
    case "entity":
      return "Сущность";
    default:
      return "Отступ";
  }
}

function bindInspector(): void {
  if (!selected) {
    document.getElementById("th-accent")?.addEventListener("change", (e) => {
      layout.theme.accent = (e.target as HTMLInputElement).value;
      render();
    });
    document.getElementById("th-cols")?.addEventListener("change", (e) => {
      layout.body.columns = clampNum((e.target as HTMLInputElement).valueAsNumber, 4, 24);
      render();
    });
    document.getElementById("th-rh")?.addEventListener("change", (e) => {
      layout.body.rowHeightPx = clampNum((e.target as HTMLInputElement).valueAsNumber, 32, 200);
      render();
    });
    document.getElementById("th-gap")?.addEventListener("change", (e) => {
      layout.body.gapPx = clampNum((e.target as HTMLInputElement).valueAsNumber, 0, 48);
      render();
    });
    document.getElementById("th-head")?.addEventListener("change", (e) => {
      layout.header.enabled = (e.target as HTMLInputElement).checked;
      render();
    });
    document.getElementById("th-hh")?.addEventListener("change", (e) => {
      layout.header.heightPx = clampNum((e.target as HTMLInputElement).valueAsNumber, 32, 200);
      render();
    });
    document.getElementById("th-foot")?.addEventListener("change", (e) => {
      layout.footer.enabled = (e.target as HTMLInputElement).checked;
      render();
    });
    document.getElementById("th-fh")?.addEventListener("change", (e) => {
      layout.footer.heightPx = clampNum((e.target as HTMLInputElement).valueAsNumber, 32, 200);
      render();
    });
    return;
  }

  const block = findBlock(selected.zone, selected.id);
  if (!block) return;

  document.getElementById("in-title")?.addEventListener("change", (e) => {
    block.title = (e.target as HTMLInputElement).value || undefined;
    render();
  });

  if (selected.zone === "body" && "col" in block) {
    const gb = block as GridBlock;
    document.getElementById("in-col")?.addEventListener("change", (e) => {
      gb.col = clampNum((e.target as HTMLInputElement).valueAsNumber, 1, layout.body.columns);
      render();
    });
    document.getElementById("in-row")?.addEventListener("change", (e) => {
      gb.row = clampNum((e.target as HTMLInputElement).valueAsNumber, 1, 99);
      render();
    });
    document.getElementById("in-cs")?.addEventListener("change", (e) => {
      gb.colSpan = clampNum((e.target as HTMLInputElement).valueAsNumber, 1, layout.body.columns);
      render();
    });
    document.getElementById("in-rs")?.addEventListener("change", (e) => {
      gb.rowSpan = clampNum((e.target as HTMLInputElement).valueAsNumber, 1, 50);
      render();
    });
    document.getElementById("in-entity")?.addEventListener("change", (e) => {
      gb.entityId = (e.target as HTMLInputElement).value || undefined;
      render();
    });
    document.getElementById("in-content")?.addEventListener("change", (e) => {
      gb.content = (e.target as HTMLTextAreaElement).value || undefined;
      render();
    });
  } else {
    const sb = block as StripBlock;
    document.getElementById("in-order")?.addEventListener("change", (e) => {
      sb.order = clampNum((e.target as HTMLInputElement).valueAsNumber, 0, 999);
      render();
    });
    document.getElementById("in-entity")?.addEventListener("change", (e) => {
      sb.entityId = (e.target as HTMLInputElement).value || undefined;
      render();
    });
    document.getElementById("in-content")?.addEventListener("change", (e) => {
      sb.content = (e.target as HTMLTextAreaElement).value || undefined;
      render();
    });
  }

  document.getElementById("btn-del")?.addEventListener("click", () => {
    if (!selected) return;
    if (selected.zone === "body") {
      layout.body.blocks = layout.body.blocks.filter((b) => b.id !== selected!.id);
    } else if (selected.zone === "header") {
      layout.header.blocks = layout.header.blocks.filter((b) => b.id !== selected!.id);
    } else {
      layout.footer.blocks = layout.footer.blocks.filter((b) => b.id !== selected!.id);
    }
    selected = null;
    render();
  });
}

function clampNum(n: number, lo: number, hi: number): number {
  if (Number.isNaN(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

function setStatus(text: string, err = false): void {
  const el = document.getElementById("status");
  if (el) {
    el.textContent = text;
    el.style.color = err ? "var(--danger)" : "var(--muted)";
  }
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replaceAll("\n", " ");
}

function renderSettingsModal(): string {
  return `<div class="modal-backdrop" id="modal-bg">
    <div class="modal" id="modal">
      <h2>Подключение к Home Assistant</h2>
      <p style="font-size:0.8rem;color:var(--muted);margin:0 0 0.75rem">
        Если открываете с того же адреса, что и HA (например <code>/dashboard_builder_web/</code>),
        оставьте базовый URL пустым — запросы пойдут с cookie сессии.
        Для отдельного хоста укажите URL (без слэша в конце) и долгоживущий токен.
      </p>
      <div class="field"><label>Базовый URL (опционально)</label>
        <input type="url" id="set-base" placeholder="https://homeassistant.local:8123" value="${escapeAttr(getApiBase())}" />
      </div>
      <div class="field"><label>Токен (опционально)</label>
        <input type="password" id="set-token" autocomplete="off" value="${escapeAttr(getToken())}" />
      </div>
      <div class="modal-actions">
        <button type="button" id="set-cancel">Отмена</button>
        <button type="button" class="primary" id="set-save">Сохранить</button>
      </div>
    </div>
  </div>`;
}

function bindSettingsModal(): void {
  document.getElementById("modal-bg")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("modal-bg")) {
      settingsOpen = false;
      render();
    }
  });
  document.getElementById("set-cancel")?.addEventListener("click", () => {
    settingsOpen = false;
    render();
  });
  document.getElementById("set-save")?.addEventListener("click", () => {
    const base = (document.getElementById("set-base") as HTMLInputElement).value;
    const token = (document.getElementById("set-token") as HTMLInputElement).value;
    setConnection(base, token);
    lastLiveKey = "";
    settingsOpen = false;
    render();
  });
}

layout = normalize(defaultLayout());
render();
