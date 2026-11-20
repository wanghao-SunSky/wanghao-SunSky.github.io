import { isUtf8 } from 'node:buffer';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readNames, writeNames } from '@ot-builder/io-bin-name';
import { readSfntOtf, SfntIoTableSink, writeSfntOtf } from '@ot-builder/io-bin-sfnt';
import { decodeHTML } from 'entities';
import subsetFont from 'subset-font';

const faces = [
  {
    style: 'Regular', weight: '400',
    url: 'https://raw.githubusercontent.com/airinghost/clear-han-serif-subset/main/ttf/clearhanserif.original.v1.10.ttf',
    sha256: '9f1441ee49036fb326ffc5e78145ccf6b59fd0b71974e98f3b702042826c44b4',
  },
  {
    style: 'SemiBold', weight: '500 700',
    url: 'https://raw.githubusercontent.com/adobe-fonts/source-han-serif/release/OTF/SimplifiedChinese/SourceHanSerifSC-SemiBold.otf',
    sha256: 'faf16caeaf207e1926e01af8d9f1a8e71b0e9d8f51bf3b5d9a78f9f30e7e3e31',
  },
];
const manifestPath = 'src/generated/font-manifest.json';
const hash = (data) => createHash('sha256').update(data).digest('hex');

async function readIfPresent(path) {
  try {
    return await readFile(path);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return null;
  }
}

async function atomicWrite(path, data) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = path + '.' + randomUUID();
  try {
    await writeFile(temporary, data);
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

async function sourceFont(face) {
  const path = join('.cache/fonts', basename(face.url));
  const cached = await readIfPresent(path);
  if (cached && hash(cached) === face.sha256) return path;
  console.log('Downloading ' + basename(path));
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(face.url, { signal: AbortSignal.timeout(90000) });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (hash(bytes) !== face.sha256) throw new Error('unexpected SHA-256');
      await atomicWrite(path, bytes);
      return path;
    } catch (cause) {
      if (attempt === 3) throw new Error('Could not cache ' + face.url, { cause });
    }
  }
}

export const sourceForCover = () => sourceFont(faces[1]);

async function collectCharacters() {
  const characters = new Set('“”‘’…—·，。、；：？！（）《》【】「」『』〈〉〔〕［］～');
  for (const root of ['src', 'content']) {
    for (const entry of await readdir(root, { recursive: true, withFileTypes: true })) {
      const path = join(entry.parentPath, entry.name);
      if (!entry.isFile() || path === manifestPath) continue;
      const bytes = await readFile(path);
      if (bytes.includes(0) || !isUtf8(bytes)) continue;
      for (const char of decodeHTML(bytes.toString())) {
        if (char.codePointAt(0) > 127) characters.add(char);
      }
    }
  }
  return [...characters].sort().join('');
}

// Use the site's family name inside the distributed font as well as in CSS.
// Keep upstream copyright, designer, trademark and licence records.
function nameSubset(source, style) {
  const sfnt = readSfntOtf(source);
  const names = readNames(sfnt);
  const family = 'Blog Serif SC';
  const fullName = family + ' ' + style;
  const postscript = 'BlogSerifSC-' + style;
  const identity = new Map([[1, family], [2, style], [3, postscript], [4, fullName],
    [6, postscript], [16, family], [17, style]]);
  const otherNames = names.name.records.filter(({ nameID }) =>
    !identity.has(nameID) && ![18, 20, 21, 22, 25].includes(nameID));
  names.name.records = [...otherNames, ...Array.from(identity, ([nameID, value]) =>
    ({ platformID: 3, encodingID: 1, languageID: 0x409, nameID, value }))];
  writeNames(new SfntIoTableSink(sfnt), names);
  return writeSfntOtf(sfnt);
}

async function buildFonts() {
  const characters = await collectCharacters();
  const recipe = hash(await readFile(new URL(import.meta.url)));
  const dependencies = hash(await readFile('package-lock.json'));
  const signature = hash(characters + recipe + dependencies);
  const previousText = (await readIfPresent(manifestPath))?.toString();
  const previous = JSON.parse(previousText ?? 'null');
  const files = [];
  for (const face of faces) {
    const url = '/fonts/blog-serif-sc-' + face.style.toLowerCase() + '.woff2';
    const path = 'public' + url;
    const existing = await readIfPresent(path);
    const prior = previous?.files.find((file) => file.url === url);
    if (previous?.signature === signature && existing && hash(existing).slice(0, 12) === prior?.hash) {
      files.push(prior);
      console.log(face.style + ': cached (' + existing.length + ' bytes)');
      continue;
    }
    const source = await readFile(await sourceFont(face));
    const bytes = await subsetFont(nameSubset(source, face.style), characters, {
      targetFormat: 'woff2', preserveNameIds: [0, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17],
    });
    await atomicWrite(path, bytes);
    files.push({ url, hash: hash(bytes).slice(0, 12), weight: face.weight });
    console.log(face.style + ': built (' + bytes.length + ' bytes)');
  }
  const manifest = JSON.stringify({ signature, characters, files }, null, 2) + '\n';
  if (manifest !== previousText) await atomicWrite(manifestPath, manifest);
  console.log('Subset input: ' + [...characters].length + ' distinct characters');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await buildFonts();
