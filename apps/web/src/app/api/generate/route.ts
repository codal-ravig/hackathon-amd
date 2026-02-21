import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { writeClient } from '@/sanity/lib/writeClient'

// Defer client creation so a missing key returns a clean 500 instead of crashing at boot
function getClient() {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set in environment variables')
  return new Anthropic({ apiKey: key })
}

// Most cost-effective Claude model: $1/1M input · $5/1M output
const MODEL = 'claude-haiku-4-5'

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface CampaignPayload {
  _type: 'campaign'
  title: string
  slug: { _type: 'slug'; current: string }
  headline: string
  price: number
  content: RawBlock[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Inject _key values — Claude cannot generate globally unique IDs
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

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (!body?.topic || typeof body.topic !== 'string') {
    return NextResponse.json({ error: '`topic` string is required' }, { status: 400 })
  }

  const { topic } = body as { topic: string }

  const prompt = `Generate a Sanity CMS campaign document for this product topic: "${topic}"

Return ONLY a JSON object that exactly matches this Sanity schema:

{
  "_type": "campaign",
  "title": "<compelling product name, 2–6 words>",
  "slug": {
    "_type": "slug",
    "current": "<URL-safe slug, lowercase, hyphens only>"
  },
  "headline": "<punchy marketing tagline, 8–15 words, different from title>",
  "price": <realistic USD price as a JSON number, e.g. 49.99>,
  "content": [
    {
      "_type": "block",
      "style": "normal",
      "markDefs": [],
      "children": [{ "_type": "span", "text": "<paragraph text>", "marks": [] }]
    }
  ]
}

Rules:
- Exactly 5 blocks in content (problem → features → benefit → social proof → CTA)
- All 5 blocks together ≈ 300 words
- Each block has exactly one span child
- markDefs and marks must be empty arrays []
- style must be "normal" on every block
- Do NOT include _key fields
- Do NOT include heroImage
- price must be a JSON number, not a string`

  let raw: string
  try {
    const anthropic = getClient()
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: 'You are a JSON generator. Output ONLY valid JSON — no markdown fences, no explanation, no extra text.',
      messages: [{ role: 'user', content: prompt }],
    })

    const block = message.content.find(b => b.type === 'text')
    if (!block || block.type !== 'text') throw new Error('No text in Claude response')

    // Strip any accidental markdown fences Claude might include
    raw = block.text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: 'Claude rate limit reached — try again shortly.' },
        { status: 429 },
      )
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: 'Invalid ANTHROPIC_API_KEY.' },
        { status: 401 },
      )
    }
    const detail = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Claude request failed', detail }, { status: 502 })
  }

  let payload: CampaignPayload
  try {
    payload = JSON.parse(raw) as CampaignPayload
  } catch {
    return NextResponse.json({ error: 'Claude returned invalid JSON', raw }, { status: 502 })
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
      { error: 'Claude response does not match campaign schema', payload },
      { status: 502 },
    )
  }

  const campaign = { _type, title, slug, headline, price, content: injectKeys(content) }

  let created
  try {
    created = await writeClient.create(campaign)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Sanity write failed', detail }, { status: 502 })
  }

  return NextResponse.json(created, { status: 201 })
}
