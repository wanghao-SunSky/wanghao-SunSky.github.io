import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { TOPICS } from './data/site';

const topicKeys = Object.keys(TOPICS) as [string, ...string[]];

const posts = defineCollection({
  loader: glob({
    base: './content/posts',
    pattern: '*/index.md',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: z.object({
    title: z.string().min(8).max(60),
    description: z.string().min(40).max(160),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    type: z.enum(['explainer', 'experiment', 'case-study', 'perspective', 'reading-note']),
    status: z.enum(['draft', 'review', 'published', 'corrected', 'deprecated']),
    publishedAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    topics: z.array(z.enum(topicKeys)).min(1),
    tags: z.array(z.string()).default([]),
    series: z.string().nullish(),
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    evidence: z.array(z.string()).default([]),
    evidenceNote: z.string().optional(),
    aiAssisted: z.boolean().default(false),
    featured: z.boolean().default(false),
    canonical: z.string().optional(),
    cover: z.array(z.string()).default([]),
    sources: z
      .array(z.object({ title: z.string(), url: z.string().url(), accessedAt: z.coerce.date().optional() }))
      .default([]),
    code: z.object({ repo: z.string().optional(), path: z.string().optional() }).optional(),
    corrections: z.array(z.object({ date: z.coerce.date(), note: z.string() })).default([]),
  }),
});

export const collections = { posts };
