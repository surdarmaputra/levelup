// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mdx from '@astrojs/mdx';
import { publishedMaterials } from './src/catalog.ts';

// Deploy target is configurable so the same build works on GitHub Pages
// (served from /<repo>/) and on a VPS (served from /).
//   SITE_URL=https://learn.example.com BASE_PATH=/ npm run build
const site = process.env.SITE_URL ?? 'https://surdarmaputra.github.io';
const base = process.env.BASE_PATH ?? '/levelup';

/** Build one sidebar group per learning material from the catalog. */
const materialSidebar = publishedMaterials.map((material) => ({
  label: material.title,
  items: [
    ...material.links.map((link) => ({ label: link.label, slug: link.slug })),
    ...material.sections.map((section) => ({
      label: section.label,
      items: [{ autogenerate: { directory: `${material.slug}/${section.directory}` } }],
    })),
  ],
}));

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: 'LevelUp',
      description:
        'A catalog of guided, production-minded learning materials for software engineers.',
      tagline: 'Guided paths to production-grade engineering.',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/surdarmaputra/levelup',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/surdarmaputra/levelup/edit/main/',
      },
      lastUpdated: true,
      customCss: ['./src/styles/custom.css'],
      // Scopes the sidebar to the material the reader is currently in.
      routeMiddleware: './src/routeData.ts',
      sidebar: [{ label: 'All materials', link: '/' }, ...materialSidebar],
      pagination: true,
    }),
    // Must come after starlight() so code blocks in .mdx get Expressive Code.
    mdx(),
  ],
});
