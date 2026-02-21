import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function paragraphsToBlocks(paragraphs: string[]) {
  return paragraphs.map((text, i) => ({
    _type: 'block' as const,
    _key: `block-${i}-${Date.now()}`,
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span' as const,
        _key: `span-${i}-${Date.now()}`,
        text,
        marks: [],
      },
    ],
  }))
}

interface GeminiPayload {
  title: string
  headline: string
  price: number
  paragraphs: string[]
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (!body?.topic || typeof body.topic !== 'string') {
    return NextResponse.json({ error: '`topic` string is required' }, { status: 400 })
  }

  const { topic } = body as { topic: string }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  })

  const prompt = `You are a copywriter for an automated storefront. Given a product topic, generate campaign content.

Topic: "${topic}"

Return ONLY a JSON object with exactly these fields:
{
  "title": "<compelling product name, 2–6 words>",
  "headline": "<punchy marketing headline, 8–15 words>",
  "price": <realistic USD price as a number, no currency symbol>,
  "paragraphs": [
    "<paragraph 1 — introduce the problem the product solves>",
    "<paragraph 2 — describe the product and its key features>",
    "<paragraph 3 — highlight the main benefit or transformation>",
    "<paragraph 4 — social proof or use-case scenario>",
    "<paragraph 5 — call to action, sense of urgency>"
  ]
}

Requirements:
- paragraphs must collectively be approximately 300 words
- title and headline must be different — title is the product name, headline is a marketing tagline
- price must be a JSON number (e.g. 49.99), not a string
- do NOT include markdown, explanation, or any text outside the JSON`

  const result = await model.generateContent(prompt)
  const raw = result.response.text()

  let payload: GeminiPayload
  try {
    payload = JSON.parse(raw) as GeminiPayload
  } catch {
    return NextResponse.json({ error: 'Gemini returned invalid JSON', raw }, { status: 502 })
  }

  const { title, headline, price, paragraphs } = payload

  if (!title || !headline || typeof price !== 'number' || !Array.isArray(paragraphs)) {
    return NextResponse.json(
      { error: 'Gemini response missing required fields', payload },
      { status: 502 },
    )
  }

  const campaign = {
    _type: 'campaign',
    title,
    slug: { _type: 'slug', current: toSlug(title) },
    headline,
    price,
    content: paragraphsToBlocks(paragraphs),
  }

  return NextResponse.json(campaign)
}
