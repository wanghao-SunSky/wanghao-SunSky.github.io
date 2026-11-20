import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { decodeHTML } from 'entities';
import { create } from 'fontkitten';

const manifest = JSON.parse(await readFile('src/generated/font-manifest.json', 'utf8'));
assert.deepEqual(manifest.files.map((file) => file.weight), ['400', '500 700']);
const input = new Set(manifest.characters);
const marks = [...'“”…'];
assert.ok(marks.every((char) => input.has(char)), 'Missing Chinese typography marks in subset input');
const required = new Set();
let pages = 0;
for (const entry of await readdir('dist', { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
  pages++;
  const html = await readFile(join(entry.parentPath, entry.name), 'utf8');
  for (const char of decodeHTML(html).match(/[\p{Script=Han}“”…]/gu) ?? []) required.add(char);
  for (const file of manifest.files) {
    const url = file.url + '?v=' + file.hash;
    assert.ok(html.includes('href="' + url + '"'), 'Missing preload in ' + entry.parentPath + ': ' + url);
    assert.ok(html.includes('url("' + url + '")'), 'Missing @font-face in ' + entry.parentPath + ': ' + url);
  }
}
assert.ok(pages && required.size, 'Expected built HTML containing Chinese text');
function check(label, contains) {
  const missing = [...required].filter((char) => !contains(char));
  assert.equal(missing.length, 0, label + ' missing: ' + missing.join(''));
  console.log(label + ': ' + required.size + '/' + required.size + ' (missing 0)');
}
console.log(pages + ' HTML pages; ' + input.size + ' characters in subset input');
check('Subset input', (char) => input.has(char));
for (const { url, hash } of manifest.files) {
  const bytes = await readFile('dist' + url);
  assert.equal(bytes.toString('ascii', 0, 4), 'wOF2');
  assert.equal(createHash('sha256').update(bytes).digest('hex').slice(0, 12), hash);
  const face = create(bytes);
  assert.equal(face.familyName, 'Blog Serif SC');
  assert.ok(marks.every((char) => face.hasGlyphForCodePoint(char.codePointAt(0))), 'Missing Chinese typography marks in ' + url);
  check(url + ' cmap', (char) => face.hasGlyphForCodePoint(char.codePointAt(0)));
}
