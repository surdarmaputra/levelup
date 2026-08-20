import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { publishedMaterials } from './catalog';

const materialTitles = new Set(publishedMaterials.map((m) => m.title));

/**
 * Each learning material gets its own sidebar.
 *
 * The Starlight config declares one top-level group per material, which would
 * otherwise show every material's tree on every page. Here we drop the groups
 * that do not belong to the material being read, so the sidebar stays a table
 * of contents for the current material instead of the whole site.
 */
export const onRequest = defineRouteMiddleware((context) => {
  const { starlightRoute } = context.locals;
  const { id } = starlightRoute;

  // `id` is the content-collection id, e.g. `java-spring-boot/setup/agent-harness`.
  const currentSlug = id.split('/').filter(Boolean)[0];
  const current = publishedMaterials.find((m) => m.slug === currentSlug);

  starlightRoute.sidebar = starlightRoute.sidebar.filter((entry) => {
    // Keep everything that is not a material group (e.g. the "All materials" link).
    if (entry.type !== 'group' || !materialTitles.has(entry.label)) return true;
    return current !== undefined && entry.label === current.title;
  });
});
