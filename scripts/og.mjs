// 本地运行：node scripts/og.mjs
// 读取每篇已发布文章的 cover 字段，用本机 Chrome 截成 1200×630 PNG，写到 public/og/。
// 规则见 docs/title-cover-intro.md 和 docs/site-design.md。
import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const postsDir = 'content/posts';
const outDir = 'public/og';
mkdirSync(outDir, { recursive: true });

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const page = (lines, site) => `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>
html,body{margin:0;width:1200px;height:630px;background:#fff;color:#1f2328;overflow:hidden;font-family:-apple-system,"PingFang SC","Noto Sans SC",sans-serif}
.c{padding:80px 96px;height:630px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between}
.s{font-size:28px;color:#59636e;font-weight:500}.t{font-size:84px;line-height:1.25;font-weight:700}
</style></head><body><div class="c"><div class="s">${esc(site)}</div><div class="t">${lines.map(esc).join('<br>')}</div><div></div></div></body></html>`;

function shot(html, file) {
  const tmp = join(tmpdir(), `og-${Date.now()}.html`);
  writeFileSync(tmp, html);
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1200,630', `--screenshot=${file}`, `file://${tmp}`], { stdio: 'ignore' });
}

const site = 'SunSky · AI Agent 工程笔记';
shot(page(['AI Agent', '工程笔记'], 'SunSky'), join(outDir, 'default.png'));
for (const slug of readdirSync(postsDir)) {
  const f = join(postsDir, slug, 'index.md');
  if (!existsSync(f)) continue;
  const fm = readFileSync(f, 'utf8').split('\n---')[0];
  const m = fm.match(/^cover:\s*\[(.*)\]\s*$/m);
  if (!m) { console.warn(`skip ${slug}: no cover`); continue; }
  const lines = JSON.parse(`[${m[1]}]`);
  shot(page(lines, site), join(outDir, `${slug}.png`));
  console.log(`og: ${slug}.png`);
}
