const STORAGE_KEY = 'levelup:progress:v1';
const SCHEMA_VERSION = 1;

export interface ProgressEntry {
  completed: boolean;
  note: string;
  updatedAt: number;
}

export interface MaterialProgress {
  [stepId: string]: ProgressEntry;
}

export interface ProgressStore {
  version: number;
  materials: {
    [materialSlug: string]: MaterialProgress;
  };
}

export interface ExportData {
  version: number;
  exportedAt: number;
  materials: {
    [materialSlug: string]: MaterialProgress;
  };
}

function createEmptyStore(): ProgressStore {
  return {
    version: SCHEMA_VERSION,
    materials: {},
  };
}

function getStore(): ProgressStore {
  if (typeof window === 'undefined') {
    return createEmptyStore();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createEmptyStore();
    }
    const parsed = JSON.parse(raw) as ProgressStore;
    if (parsed.version !== SCHEMA_VERSION) {
      return migrateStore(parsed);
    }
    return renameMaterials(parsed);
  } catch {
    return createEmptyStore();
  }
}

function saveStore(store: ProgressStore): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent('progress-updated'));
  } catch (e) {
    console.warn('Failed to save progress:', e);
  }
}

function migrateStore(oldStore: ProgressStore): ProgressStore {
  const newStore = createEmptyStore();
  newStore.materials = oldStore.materials || {};
  saveStore(newStore);
  return renameMaterials(newStore);
}

/**
 * Material slugs a reader may have progress saved under, mapped to their current
 * slug. Progress is keyed by slug, so renaming a material would otherwise orphan
 * it. Entries stay here permanently — a reader who last visited before the rename
 * is exactly the person this exists for.
 */
const RENAMED_MATERIALS: Record<string, string> = {
  'java-spring-boot': 'spring-boot-ticketing',
  'php-laravel': 'laravel-booking-saas',
};

/** Move progress saved under an old material slug onto the current one. */
function renameMaterials(store: ProgressStore): ProgressStore {
  let changed = false;

  for (const [oldSlug, newSlug] of Object.entries(RENAMED_MATERIALS)) {
    const old = store.materials[oldSlug];
    if (!old) continue;

    // Anything already saved under the new slug wins — it is the more recent edit.
    store.materials[newSlug] = { ...old, ...(store.materials[newSlug] ?? {}) };
    delete store.materials[oldSlug];
    changed = true;
  }

  if (changed) saveStore(store);
  return store;
}

export function getProgress(materialSlug: string, stepId: string): ProgressEntry | null {
  const store = getStore();
  return store.materials[materialSlug]?.[stepId] ?? null;
}

export function setProgress(
  materialSlug: string,
  stepId: string,
  entry: Partial<ProgressEntry>
): ProgressEntry {
  const store = getStore();
  if (!store.materials[materialSlug]) {
    store.materials[materialSlug] = {};
  }
  const existing = store.materials[materialSlug][stepId] || {
    completed: false,
    note: '',
    updatedAt: 0,
  };
  const updated: ProgressEntry = {
    ...existing,
    ...entry,
    updatedAt: Date.now(),
  };
  store.materials[materialSlug][stepId] = updated;
  saveStore(store);
  return updated;
}

export function toggleCompleted(materialSlug: string, stepId: string): ProgressEntry {
  const current = getProgress(materialSlug, stepId);
  return setProgress(materialSlug, stepId, {
    completed: current ? !current.completed : true,
  });
}

export function setNote(materialSlug: string, stepId: string, note: string): ProgressEntry {
  return setProgress(materialSlug, stepId, { note });
}

export function getMaterialProgress(materialSlug: string): MaterialProgress {
  const store = getStore();
  return store.materials[materialSlug] || {};
}

/** Step ids for a material's tracked page hrefs, e.g. `/x/setup/foo/` → `setup/foo`. */
export function stepIdsFromPages(materialSlug: string, pages: string[]): string[] {
  return pages.map((href) => stepIdFromHref(href, materialSlug));
}

export function getMaterialStats(
  materialSlug: string,
  stepIds: string[]
): { completed: number; total: number; percentage: number } {
  const progress = getMaterialProgress(materialSlug);
  // Count only completions for pages that are actually tracked steps — reference
  // and overview pages may carry a stale entry but must not affect the total.
  const completed = stepIds.filter((id) => progress[id]?.completed).length;
  const total = stepIds.length;
  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export function clearMaterialProgress(materialSlug: string): void {
  const store = getStore();
  delete store.materials[materialSlug];
  saveStore(store);
}

export function exportProgress(): ExportData {
  const store = getStore();
  return {
    version: SCHEMA_VERSION,
    exportedAt: Date.now(),
    materials: store.materials,
  };
}

export interface ImportResult {
  success: boolean;
  message: string;
  merged?: number;
  replaced?: number;
}

export function importProgress(
  data: ExportData,
  mode: 'merge' | 'replace' = 'merge'
): ImportResult {
  if (!data || data.version !== SCHEMA_VERSION) {
    return { success: false, message: 'Invalid export file format' };
  }

  if (!data.materials || typeof data.materials !== 'object') {
    return { success: false, message: 'Missing materials data' };
  }

  const store = getStore();
  let merged = 0;
  let replaced = 0;

  if (mode === 'replace') {
    store.materials = data.materials;
    replaced = Object.keys(data.materials).length;
  } else {
    for (const [materialSlug, progress] of Object.entries(data.materials)) {
      if (!store.materials[materialSlug]) {
        store.materials[materialSlug] = {};
      }
      for (const [stepId, entry] of Object.entries(progress)) {
        const existing = store.materials[materialSlug][stepId];
        if (!existing || entry.updatedAt > existing.updatedAt) {
          store.materials[materialSlug][stepId] = entry;
          merged++;
        }
      }
    }
  }

  saveStore(store);
  return {
    success: true,
    message:
      mode === 'replace'
        ? `Replaced ${replaced} material(s)`
        : `Merged ${merged} entries`,
    merged,
    replaced,
  };
}

export function downloadExport(): void {
  const data = exportProgress();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `levelup-progress-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Strip the material slug and leading path, e.g. `/x/setup/foo/` → `setup/foo`. */
export function stepIdFromHref(href: string, materialSlug: string): string {
  const parts = href.split('/').filter(Boolean);
  const idx = parts.indexOf(materialSlug);
  if (idx === -1) return href;
  return parts.slice(idx + 1).join('/');
}

/** Human label for a step href, e.g. `/x/setup/agent-harness/` → `Agent Harness`. */
export function stepLabelFromHref(href: string, materialSlug: string): string {
  const step = stepIdFromHref(href, materialSlug);
  const last = step.split('/').filter(Boolean).pop() || step;
  return last.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface StepStatus {
  label: string;
  done: boolean;
}

/** Ordered step list with completion state, from the material's page hrefs. */
export function buildStepList(materialSlug: string, pages: string[]): StepStatus[] {
  const progress = getMaterialProgress(materialSlug);
  return pages.map((href) => ({
    label: stepLabelFromHref(href, materialSlug),
    done: progress[stepIdFromHref(href, materialSlug)]?.completed ?? false,
  }));
}

/** Ordered step list with completion state, from a `{ id, label }` manifest. */
export function buildStepListFromUnits(
  materialSlug: string,
  units: { id: string; label: string }[]
): StepStatus[] {
  const progress = getMaterialProgress(materialSlug);
  return units.map((u) => ({
    label: u.label,
    done: progress[u.id]?.completed ?? false,
  }));
}

export interface ProgressCardData {
  materialTitle: string;
  completed: number;
  total: number;
  notes: number;
  steps: StepStatus[];
}

/**
 * Render a shareable progress card to a PNG and trigger a download.
 * Pure Canvas 2D — no external dependency, no network.
 */
export function downloadProgressCard(data: ProgressCardData): void {
  if (typeof document === 'undefined') return;

  const accent = '#7c9fff';
  const dim = '#5b6678';
  const pct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;

  const W = 1200;
  const PAD = 80;
  const HEADER_H = 340;
  const ROW_H = 40;
  const cols = data.steps.length > 8 ? 2 : 1;
  const rowsPerCol = Math.ceil(data.steps.length / cols);
  const listH = rowsPerCol * ROW_H;
  const H = HEADER_H + listH + 96;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0b0e14');
  bg.addColorStop(1, '#141a26');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Wordmark
  ctx.fillStyle = accent;
  ctx.textBaseline = 'alphabetic';
  ctx.font = '700 30px system-ui, -apple-system, sans-serif';
  ctx.fillText('L E V E L U P', PAD, 92);

  // Material title (wrap to 2 lines max)
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 58px system-ui, -apple-system, sans-serif';
  const maxTitleWidth = 620;
  const words = data.materialTitle.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxTitleWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, PAD, 170 + i * 68));

  // Stat highlight
  ctx.fillStyle = accent;
  ctx.font = '700 40px system-ui, -apple-system, sans-serif';
  const statText = `${data.completed} / ${data.total} steps`;
  ctx.fillText(statText, PAD, 300);
  const statWidth = ctx.measureText(statText).width;
  if (data.notes > 0) {
    ctx.fillStyle = dim;
    ctx.font = '400 26px system-ui, -apple-system, sans-serif';
    ctx.fillText(`·  ${data.notes} note${data.notes === 1 ? '' : 's'}`, PAD + statWidth + 24, 300);
  }

  // Progress ring
  const cx = W - PAD - 130;
  const cy = 180;
  const radius = 118;
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.stroke();
  if (pct > 0) {
    const start = -Math.PI / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, start, start + (Math.PI * 2 * pct) / 100);
    ctx.strokeStyle = accent;
    ctx.stroke();
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 68px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${pct}%`, cx, cy);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, HEADER_H - 30);
  ctx.lineTo(W - PAD, HEADER_H - 30);
  ctx.stroke();

  // Step checklist
  const colW = (W - PAD * 2) / cols;
  const labelMax = colW - 46;
  data.steps.forEach((step, i) => {
    const col = Math.floor(i / rowsPerCol);
    const row = i % rowsPerCol;
    const x = PAD + col * colW;
    const y = HEADER_H + row * ROW_H;

    // Marker
    ctx.lineWidth = 2;
    if (step.done) {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(x + 9, y - 6, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0b0e14';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(x + 5, y - 6);
      ctx.lineTo(x + 8, y - 3);
      ctx.lineTo(x + 13.5, y - 10);
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(x + 9, y - 6, 9, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Label (truncate with ellipsis)
    ctx.fillStyle = step.done ? '#dfe6f2' : '#8b97ab';
    ctx.font = `${step.done ? 600 : 400} 24px system-ui, -apple-system, sans-serif`;
    let label = step.label;
    if (ctx.measureText(label).width > labelMax) {
      while (label.length > 1 && ctx.measureText(`${label}…`).width > labelMax) {
        label = label.slice(0, -1);
      }
      label += '…';
    }
    ctx.fillText(label, x + 30, y);
  });

  // Footer
  const date = new Date().toISOString().split('T')[0];
  ctx.fillStyle = dim;
  ctx.font = '400 22px system-ui, -apple-system, sans-serif';
  ctx.fillText(`Progress export · ${date}`, PAD, H - 44);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `levelup-progress-${date}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}

export async function parseImportFile(file: File): Promise<ExportData | null> {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as ExportData;
    return data;
  } catch {
    return null;
  }
}
