// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const recursos = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/recursos" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(), // z.coerce.date() parsea texto YYYY-MM-DD sin fallar
    category: z.string(),
    image: z.string().optional(),
    isFeatured: z.boolean().default(false),
    author: z.string().optional(),
    pdfUrl: z.string().optional(), // 👈 ¡ESTA ERA LA LÍNEA QUE FALTABA!
  }),
});

export const collections = { recursos };