import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

export const collections = {
  docs: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
    schema: z.object({
      title: z.string(),
      description: z.string(),
      slug: z.string(),
      version: z.string().default('0.8.6'),
      verifiedAt: z.string().default('2026-10-29'),
      source: z.object({ repository: z.string(), path: z.string(), commit: z.string(), public: z.boolean() }).optional(),
      imported: z.boolean().default(false),
    }),
  }),
};
