import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '../data/site';
import { getPublishedPosts, postUrl } from '../lib/posts';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site!,
    customData: '<language>zh-CN</language>',
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.publishedAt,
      link: postUrl(p.id),
    })),
  });
}
