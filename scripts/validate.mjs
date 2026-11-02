import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const config = JSON.parse(read('docs.json'));
const spec = JSON.parse(read('openapi.json'));
const expected = new Set([
  'GET /account', 'POST /reporters/search', 'GET /reporters/{reporter_id}',
  'GET /reporters/{reporter_id}/articles', 'POST /reporters/{reporter_id}/contacts/reveal',
  'POST /outlets/search', 'GET /outlets/{outlet_id}', 'GET /outlets/{outlet_id}/reporters',
  'GET /outlets/{outlet_id}/articles', 'POST /outlets/{outlet_id}/contacts/reveal',
  'GET /metadata/search-filters',
]);
const pages = new Set();
const bindings = new Set();
const verbs = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head']);
const actual = new Set(Object.entries(spec.paths).flatMap(([path, methods]) =>
  Object.keys(methods).filter(method => verbs.has(method)).map(method => `${method.toUpperCase()} ${path}`)));
assert.deepEqual(actual, expected, 'Public operation surface changed; coordinate docs and API release');
function visit(value) {
  if (Array.isArray(value)) return value.forEach(visit);
  if (!value || typeof value !== 'object') return;
  for (const page of value.pages || []) {
    const binding = typeof page === 'string' && /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) \/.+/.test(page);
    if (binding) {
      assert(actual.has(page), `Unknown OpenAPI navigation operation: ${page}`);
      bindings.add(page);
    } else if (typeof page === 'string') {
      assert(existsSync(resolve(root, `${page}.mdx`)), `Missing navigation page: ${page}`);
      pages.add(page);
    } else visit(page);
  }
  for (const [key, child] of Object.entries(value)) if (key !== 'pages') visit(child);
}
visit(config.navigation);
assert.deepEqual(bindings, expected, 'Every public operation must appear in navigation');
assert.equal(spec.servers[0].url, 'https://reporters.io/api/v1');
assert.equal(config.colors.primary, '#FE6320');
assert.equal(config.theme, 'almond');
for (const asset of [config.logo.light, config.logo.dark, config.favicon]) {
  assert(existsSync(resolve(root, asset.slice(1))), `Missing brand asset: ${asset}`);
  assert(read(asset.slice(1)).includes('<svg'), `Expected SVG brand asset: ${asset}`);
}
function walk(directory) {
  return readdirSync(resolve(root, directory), { withFileTypes: true }).flatMap(entry => {
    const path = directory === '.' ? entry.name : `${directory}/${entry.name}`;
    return entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules'
      ? walk(path) : entry.isFile() ? [path] : [];
  });
}
for (const file of walk('.').filter(path => path.endsWith('.mdx'))) {
  const content = read(file);
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---/m)?.[1] || '';
  assert(/^title: .+/m.test(frontmatter) && /^description: .+/m.test(frontmatter), `Missing metadata in ${file}`);
  assert(!/Welcome to Mintlify|YOUR_COMPANY|TODO|to be documented/i.test(content), `Starter content in ${file}`);
  assert(!/\b(?:quota|monthly credits|unlimited requests|requests per minute)\b/i.test(content), `Unapproved usage promise in ${file}`);
  for (const match of content.matchAll(/(?:href="|\]\()\/(?!\/)([^"#)]+)(?:#[^" )]*)?["\)]/g)) {
    const target = match[1];
    assert(existsSync(resolve(root, target)) || existsSync(resolve(root, `${target}.mdx`)), `Broken local link ${target} in ${file}`);
  }
}
function references(value) {
  if (!value || typeof value !== 'object') return;
  if (value.$ref?.startsWith('#/')) {
    let target = spec;
    for (const part of value.$ref.slice(2).split('/')) target = target?.[part.replaceAll('~1', '/').replaceAll('~0', '~')];
    assert(target, `Unresolved OpenAPI reference: ${value.$ref}`);
  }
  Object.values(value).forEach(references);
}
references(spec);
if (process.argv.includes('--live')) {
  const response = await fetch('https://reporters.io/api/v1/openapi.json', { signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, `Live OpenAPI returned ${response.status}`);
  const live = await response.json();
  assert(isDeepStrictEqual(live.paths, spec.paths), 'Live API paths differ from this documentation contract');
  assert(isDeepStrictEqual(live.components, spec.components), 'Live API schemas differ from this documentation contract');
}
console.log(`Validated ${pages.size} authored pages, ${actual.size} OpenAPI operations, internal links, and branded SVG assets.`);
