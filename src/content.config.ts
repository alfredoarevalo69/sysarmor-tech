// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const recursos = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/recursos" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Tolerante tanto si viene como texto YYYY-MM-DD como objeto Date
    pubDate: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
    category: z.string().default("Infraestructura TI"), // Valor por defecto por si alguno lo omite
    image: z.string().optional(),
    isFeatured: z.boolean().default(false),
    author: z.string().optional(),
    pdfUrl: z.string().optional(),
  }),
});

export const collections = { recursos };