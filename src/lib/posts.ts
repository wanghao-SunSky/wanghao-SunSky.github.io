import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

const PUBLIC = new Set(['published', 'corrected', 'deprecated']);

export async function getPublishedPosts(): Promise<Post[]> {
  const all = await getCollection('posts', ({ data }) => PUBLIC.has(data.status) && !!data.publishedAt);
  return all.sort((a, b) => b.data.publishedAt!.valueOf() - a.data.publishedAt!.valueOf());
}

export function formatDate(d: Date): string {
  return new Date(d.valueOf() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

export function readingMinutes(body = ''): number {
  const text = body.replace(/```[\s\S]*?```/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  const han = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const words = (text.replace(/[\u4e00-\u9fff]/g, ' ').match(/[A-Za-z0-9]+/g) || []).length;
  return Math.max(1, Math.round(han / 400 + words / 200));
}

export function postUrl(id: string): string {
  return `/posts/${id}/`;
}
