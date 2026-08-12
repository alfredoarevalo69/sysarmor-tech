// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const recursos = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/recursos" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    category: z.string(),
    image: z.string().optional(),
    isFeatured: z.boolean().default(false),
  }),
});

export const collections = { recursos };