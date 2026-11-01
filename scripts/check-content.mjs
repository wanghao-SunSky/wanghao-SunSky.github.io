// 构建前检查：slug 与目录一致且唯一、标题和描述不重复、公开文章有发布日期和分享图、
// 封面每行不超过 7 个字、正文没有漏渲染的 ** 和本机私有路径。
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'content/posts';
const errors = [];
const seen = { slug: new Map(), title: new Map(), description: new Map() };
const PUBLIC = new Set(['published', 'corrected', 'deprecated']);

const field = (fm, k) => {
  const m = fm.match(new RegExp(`^${k}:\\s*(.*)$`, 'm'));
  return m ? m[1].trim().replace(/^"(.*)"$/, '$1') : '';
};
const width = (s) => [...s.replace(/\s/g, '')].length;

for (const slug of readdirSync(dir)) {
  const f = join(dir, slug, 'index.md');
  if (!existsSync(f)) continue;
  const raw = readFileSync(f, 'utf8');
  const end = raw.indexOf('\n---', 4);
  const fm = raw.slice(4, end);
  const body = raw.slice(end + 4);
  const err = (msg) => errors.push(`${f}: ${msg}`);

  if (field(fm, 'slug') !== slug) err(`slug "${field(fm, 'slug')}" 和目录名不一致`);
  for (const k of ['slug', 'title', 'description']) {
    const v = field(fm, k);
    if (seen[k].has(v)) err(`${k} 和 ${seen[k].get(v)} 重复`);
    seen[k].set(v, f);
  }
  if (!PUBLIC.has(field(fm, 'status'))) continue;
  if (!field(fm, 'publishedAt')) err('公开文章缺少 publishedAt');
  if (!existsSync(join('public/og', `${slug}.png`))) err('缺少分享图，先运行 node scripts/og.mjs');
  const cover = fm.match(/^cover:\s*\[(.*)\]\s*$/m);
  if (cover) for (const line of JSON.parse(`[${cover[1]}]`)) if (width(line) > 7) err(`封面行“${line}”超过 7 个字`);
  const desc = field(fm, 'description');
  if ([...desc].length > 160) err('描述超过 160 字');
  const text = body.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
  if (/\*\*[^*\s][^*]*[）」”】]\*\*[^\s，。；：、）*]/.test(text)) err('加粗以中文右括号或引号结尾，紧接文字时 Markdown 不会渲染，改成把括号移到 ** 外');
  if (/本文由\s*AI\s*辅助|本文(?:使用|借助)\s*AI\s*(?:辅助)?(?:研究|撰写|生成)/i.test(text)) err('正文含 AI 制作尾注，请移到内部记录');
  if (/\/Users\/|~\/\.codex|engineering-notes-workbench/.test(body)) err('正文含本机路径');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('content check passed');
