import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { escapeText } from 'entities';
import { parse } from 'yaml';
import { sourceForCover } from './build-fonts.mjs';

const out = 'public/og';
const font = await sourceForCover();
await mkdir(out, { recursive: true });

async function cover(slug, site, lines) {
  // The title block stays vertically centered for both two- and three-line covers.
  const firstBaseline = 352 - (lines.length - 1) * 52;
  const title = lines.map((line, index) =>
    `<text x="96" y="${firstBaseline + index * 104}">${escapeText(line)}</text>`
  ).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xml:lang="zh-CN" width="1200" height="630">
    <rect width="1200" height="630" fill="#fbfaf6"/>
    <g font-family="Source Han Serif SC" font-weight="600">
      <text x="96" y="109" fill="#1a6840" font-size="30">${escapeText(site)}</text>
      <g fill="#363433" font-size="84">${title}</g>
    </g>
  </svg>`;
  const png = new Resvg(svg, { font: { loadSystemFonts: false, fontFiles: [font] } }).render().asPng();
  await writeFile(join(out, slug + '.png'), png);
  console.log('og: ' + slug + '.png');
}

await cover('default', 'SunSky', ['AI Agent', '工程笔记']);
for (const entry of await readdir('content/posts', { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = join('content/posts', entry.name, 'index.md');
  if (!existsSync(file)) continue;
  const raw = await readFile(file, 'utf8');
  const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!frontmatter) throw new Error('Missing frontmatter: ' + file);
  const post = parse(frontmatter[1]);
  if (!['published', 'corrected', 'deprecated'].includes(post.status)) continue;
  if (post.cover?.length) await cover(entry.name, 'SunSky · AI Agent 工程笔记', post.cover);
}
