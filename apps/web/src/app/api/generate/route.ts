import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { writeClient } from '@/sanity/lib/writeClient'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Inject _key values after parsing — Gemini cannot generate globally unique IDs
function injectKeys(content: RawBlock[]): SanityBlock[] {
  return content.map((block, bi) => ({
    ...block,
    _key: `block${bi}${Date.now()}`,
    children: block.children.map((child, ci) => ({
      ...child,
      _key: `span${bi}${ci}${Date.now()}`,
    })),
  }))
}

interface RawSpan {
  _type: 'span'
  text: string
  marks: string[]
}

interface RawBlock {
  _type: 'block'
  style: string
  markDefs: unknown[]
  children: RawSpan[]
}

interface SanitySpan extends RawSpan {
  _key: string
}

interface SanityBlock extends Omit<RawBlock, 'children'> {
  _key: string
  children: SanitySpan[]
}

interface GeminiCampaign {
  _type: 'campaign'
  title: string
  slug: { _type: 'slug'; current: string }
  headline: string
  price: number
  content: RawBlock[]
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (!body?.topic || typeof body.topic !== 'string') {
    return NextResponse.json({ error: '`topic` string is required' }, { status: 400 })
  }

  const { topic } = body as { topic: string }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json' },
  })

  const prompt = `You are a copywriter for an automated storefront. Generate a Sanity CMS campaign document for the following product topic: "${topic}"

Return ONLY a JSON object that exactly matches this Sanity schema structure:

{
  "_type": "campaign",
  "title": "<compelling product name, 2–6 words>",
  "slug": {
    "_type": "slug",
    "current": "<URL-safe slug derived from title, lowercase, hyphens only>"
  },
  "headline": "<punchy marketing tagline, 8–15 words, different from title>",
  "price": <realistic USD price as a JSON number, e.g. 49.99>,
  "content": [
    {
      "_type": "block",
      "style": "normal",
      "markDefs": [],
      "children": [
        {
          "_type": "span",
          "text": "<paragraph text>",
          "marks": []
        }
      ]
    }
  ]
}

Rules for content:
- Generate exactly 5 block objects inside "content"
- Block 1: introduce the problem the product solves
- Block 2: describe the product and its key features
- Block 3: highlight the main benefit or transformation
- Block 4: social proof or use-case scenario
- Block 5: call to action with urgency
- All 5 blocks together must total approximately 300 words
- Each block has exactly one span child with the paragraph text
- "markDefs" must always be an empty array []
- "marks" on each span must always be an empty array []
- "style" on every block must be "normal"
- Do NOT include "_key" fields — they will be added by the server
- Do NOT include "heroImage" — it will be uploaded separately
- price must be a JSON number, NOT a string
- slug.current must be lowercase with only letters, numbers, and hyphens`

  const result = await model.generateContent(prompt)
  const raw = result.response.text()

  let payload: GeminiCampaign
  try {
    payload = JSON.parse(raw) as GeminiCampaign
  } catch {
    return NextResponse.json({ error: 'Gemini returned invalid JSON', raw }, { status: 502 })
  }

  const { _type, title, slug, headline, price, content } = payload

  if (
    _type !== 'campaign' ||
    !title ||
    !slug?.current ||
    !headline ||
    typeof price !== 'number' ||
    !Array.isArray(content) ||
    content.length === 0
  ) {
    return NextResponse.json(
      { error: 'Gemini response does not match campaign schema', payload },
      { status: 502 },
    )
  }

  const campaign = {
    _type,
    title,
    slug,
    headline,
    price,
    content: injectKeys(content),
  }

  let created
  try {
    created = await writeClient.create(campaign)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Sanity write failed', detail: message }, { status: 502 })
  }

  return NextResponse.json(created, { status: 201 })
}
