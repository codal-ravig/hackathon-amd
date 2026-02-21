import { createClient } from 'next-sanity'

// Server-only client with write access. Never expose this token to the browser.
export const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2025-01-01',
  useCdn: false, // mutations must bypass the CDN
  token: process.env.SANITY_API_WRITE_TOKEN,
})
