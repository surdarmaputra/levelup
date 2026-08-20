#!/usr/bin/env node
/**
 * Internal link checker for the built site.
 *
 * Markdown pages use relative links so the site works under any base path
 * (`/` on a VPS, `/levelup/` on GitHub Pages). Relative links are easy to get
 * wrong by one `../`, and Astro does not validate them, so we resolve every
 * internal `<a href>` in `dist/` against the real output files.
 *
 * The site is built under a base path, so absolute links carry that prefix
 * while `dist/` does not. BASE_PATH must match the value used for the build
 * (see astro.config.mjs).
 *
 * Usage: node scripts/check-links.mjs [dist-dir]
 */
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const dist = resolve(process.argv[2] ?? 'dist');
const base = (process.env.BASE_PATH ?? '/levelup').replace(/\/$/, '');

if (!existsSync(dist)) {
  console.error(`✗ ${relative(process.cwd(), dist)} not found — run \`npm run build\` first.`);
  process.exit(1);
}

/** Every .html file under dist. */
async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(path)));
    else if (entry.name.endsWith('.html')) out.push(path);
  }
  return out;
}

const files = await htmlFiles(dist);
const pages = new Set(files.map((f) => '/' + relative(dist, f).replaceAll('\\', '/')));

/** Map a site pathname to the file that would serve it. */
function servedBy(pathname) {
  let clean = pathname.replace(/[?#].*$/, '');
  // Absolute links include the deploy base path; dist/ is the base path's root.
  if (base && clean.startsWith(base + '/')) clean = clean.slice(base.length);
  else if (base && clean === base) clean = '/';
  if (pages.has(clean)) return true;
  const asIndex = clean.endsWith('/') ? `${clean}index.html` : `${clean}/index.html`;
  if (pages.has(asIndex)) return true;
  return existsSync(join(dist, clean));
}

const href = /<a\b[^>]*\bhref=["']([^"']+)["']/gi;
const failures = [];

for (const file of files) {
  const html = await readFile(file, 'utf8');
  // The page URL this file is served at, e.g. /a/b/index.html -> /a/b/
  const pageUrl = '/' + relative(dist, file).replaceAll('\\', '/').replace(/index\.html$/, '');

  for (const [, link] of html.matchAll(href)) {
    if (/^(https?:|mailto:|tel:|#|data:)/i.test(link)) continue;
    const target = new URL(link, `https://check.local${pageUrl}`);
    // An absolute link without the base path works locally and 404s once the
    // site is served from a subdirectory. Catch it here rather than in prod.
    if (base && link.startsWith('/') && !link.startsWith(base + '/') && link !== base) {
      failures.push({ page: pageUrl, link, resolved: `missing base path "${base}"` });
      continue;
    }
    if (servedBy(target.pathname)) continue;
    failures.push({ page: pageUrl, link, resolved: target.pathname });
  }
}

if (failures.length > 0) {
  console.error(`✗ ${failures.length} broken internal link(s):\n`);
  for (const f of failures) {
    console.error(`  ${f.page}\n    ${f.link}  →  ${f.resolved}`);
  }
  process.exit(1);
}

console.log(`✓ all internal links resolve (${files.length} pages checked)`);
