import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(resolve(root, 'docs.json'), 'utf8'));
const paths = new Set(['/docs']);
function visit(value) {
  if (Array.isArray(value)) return value.forEach(visit);
  if (!value || typeof value !== 'object') return;
  for (const page of value.pages || []) {
    if (typeof page === 'string' && !/^[A-Z]+ /.test(page)) paths.add(`/docs/${page === 'index' ? '' : page}`.replace(/\/$/, ''));
    else if (typeof page !== 'string') visit(page);
  }
  for (const [key, child] of Object.entries(value)) if (key !== 'pages') visit(child);
}
visit(config.navigation);
const queue = [...paths];
let verified = 0;
let generatedReferencePages = 0;
for (let index = 0; index < queue.length; index += 1) {
  const path = queue[index];
  const response = await fetch(`https://reporters.io${path}`, { signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
  const url = new URL(response.url);
  assert.equal(url.origin, 'https://reporters.io');
  assert(url.pathname === '/docs' || url.pathname.startsWith('/docs/'), `${path}: escaped docs base path`);
  const html = await response.text();
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  assert(title?.includes('Reporters'), `${path}: missing branded title`);
  assert(!/not found|404/i.test(title), `${path}: not-found page`);
  for (const match of html.matchAll(/href="((?:https:\/\/reporters\.io)?\/docs\/[^"?#]+)[^" ]*"/g)) {
    const candidate = new URL(match[1].replaceAll('&amp;', '&'), 'https://reporters.io').pathname;
    if (/\.(?:png|svg|json|xml|ico|txt|md|webp|woff2?)$/.test(candidate)) continue;
    if (!paths.has(candidate)) {
      assert(paths.size < 100, 'Unexpectedly large docs crawl');
      paths.add(candidate);
      queue.push(candidate);
      if (candidate.includes('/api-reference/')) generatedReferencePages += 1;
    }
  }
  verified += 1;
  console.log(`200 ${path} — ${title}`);
}
assert(generatedReferencePages >= 11, 'Could not discover all eleven generated API reference pages');
const llmsResponse = await fetch('https://reporters.io/docs/llms.txt', { signal: AbortSignal.timeout(30000) });
assert.equal(llmsResponse.status, 200, 'Missing docs/llms.txt');
const llms = await llmsResponse.text();
assert(llms.includes('reporters.io/docs'), 'Agent index has the wrong public prefix');
console.log(`Verified ${verified} rendered documentation pages and the public agent index.`);
