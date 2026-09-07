/**
 * Build-time manifest of the individually-trackable units in a learning material.
 *
 * The progress tracker treats each **roadmap step** (`## Step N` heading inside a
 * roadmap section page) as its own unit, plus each Setup page. This module is the
 * single source of truth for that list: it parses the step headings straight out
 * of the Markdown so the ids stay in sync with the content with nothing to
 * hand-maintain.
 *
 * `stepId` scheme: `<section-path>/step-<n>`, e.g. `roadmap/foundations/step-0`
 * or `roadmap/domain-depth/step-5b`. It is derived from the step *number*, not
 * the heading wording, so rephrasing a title does not orphan a reader's progress.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { slug as githubSlug } from 'github-slugger';
import { publishedMaterials } from '../catalog';

export interface RoadmapStep {
  /** Material-relative section path, e.g. `roadmap/foundations`. */
  sectionId: string;
  /** Section page title, e.g. `Foundations`. */
  sectionLabel: string;
  /** Step number as written, e.g. `0` or `5b`. */
  num: string;
  /** Heading slug Starlight generates, for matching the on-this-page TOC anchor. */
  slug: string;
  /** Stable progress id, e.g. `roadmap/foundations/step-0`. */
  stepId: string;
  /** Full heading text, e.g. `Step 0 — Development environment, quality gate, agent harness`. */
  title: string;
}

/** One row in the progress tracker: a Setup page or a roadmap step. */
export interface TrackedUnit {
  id: string;
  label: string;
  section: string;
}

// `## Step 0 — …`, `## Step 5b — …`. Capture the whole heading text and the number.
const STEP_HEADING = /^##\s+(Step\s+(\d+[a-z]?)\b[^\n]*)$/gm;

let cache: Map<string, RoadmapStep[]> | null = null;

function sectionOrder(entry: CollectionEntry<'docs'>): number {
  return entry.data.sidebar?.order ?? Number.MAX_SAFE_INTEGER;
}

async function buildAll(): Promise<Map<string, RoadmapStep[]>> {
  if (cache) return cache;
  const docs = await getCollection('docs');
  const map = new Map<string, RoadmapStep[]>();

  for (const material of publishedMaterials) {
    const prefix = `${material.slug}/roadmap/`;
    const sections = docs
      .filter((e) => e.id.startsWith(prefix))
      .sort((a, b) => sectionOrder(a) - sectionOrder(b));

    const steps: RoadmapStep[] = [];
    for (const entry of sections) {
      const sectionId = entry.id.slice(material.slug.length + 1); // `roadmap/foundations`
      const sectionLabel = entry.data.title ?? sectionId;
      const body = entry.body ?? '';
      for (const match of body.matchAll(STEP_HEADING)) {
        const title = match[1].trim().replace(/`/g, '').replace(/\s+/g, ' ');
        const num = match[2];
        steps.push({
          sectionId,
          sectionLabel,
          num,
          slug: githubSlug(title),
          stepId: `${sectionId}/step-${num}`,
          title,
        });
      }
    }
    map.set(material.slug, steps);
  }

  cache = map;
  return map;
}

/** All roadmap steps for a material, in reading order. */
export async function getRoadmapSteps(materialSlug: string): Promise<RoadmapStep[]> {
  return (await buildAll()).get(materialSlug) ?? [];
}

/** The roadmap steps that live on one section page, e.g. `roadmap/foundations`. */
export async function getRoadmapStepsForSection(
  materialSlug: string,
  sectionId: string
): Promise<RoadmapStep[]> {
  return (await getRoadmapSteps(materialSlug)).filter((s) => s.sectionId === sectionId);
}

/**
 * Ordered list of everything that counts toward a material's progress:
 * each Setup page first, then every roadmap step.
 */
export async function getTrackedUnits(materialSlug: string): Promise<TrackedUnit[]> {
  const units: TrackedUnit[] = [];

  const docs = await getCollection('docs');
  const setupPrefix = `${materialSlug}/setup/`;
  const setupPages = docs
    .filter((e) => e.id.startsWith(setupPrefix))
    .sort((a, b) => sectionOrder(a) - sectionOrder(b));
  for (const page of setupPages) {
    const id = page.id.slice(materialSlug.length + 1); // `setup/agent-harness`
    units.push({ id, label: page.data.title ?? id, section: 'Setup' });
  }

  for (const step of await getRoadmapSteps(materialSlug)) {
    units.push({ id: step.stepId, label: step.title, section: step.sectionLabel });
  }

  return units;
}
