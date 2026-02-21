import { notFound } from 'next/navigation'
import { defineQuery, PortableText, type PortableTextComponents } from 'next-sanity'
import Link from 'next/link'
import imageUrlBuilder from '@sanity/image-url'
import { sanityFetch } from '@/sanity/lib/live'
import { client } from '@/sanity/lib/client'

// ─── Image builder ────────────────────────────────────────────────────────────

const builder = imageUrlBuilder(client)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function urlFor(source: any) {
  return builder.image(source)
}

// ─── Query ────────────────────────────────────────────────────────────────────

const CAMPAIGN_QUERY = defineQuery(`
  *[_type == "campaign" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    headline,
    price,
    content,
    heroImage,
    _createdAt
  }
`)

// ─── Portable Text components ─────────────────────────────────────────────────

const ptComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="pt-block">{children}</p>,
  },
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const { data } = await sanityFetch({ query: CAMPAIGN_QUERY, params: { slug } })
  if (!data) return {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = data as any
  return { title: c.title, description: c.headline }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CampaignPage({ params }: PageProps) {
  const { slug } = await params

  const { data } = await sanityFetch({ query: CAMPAIGN_QUERY, params: { slug } })

  if (!data) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const campaign = data as any

  // Hero image — full-bleed, large for quality rendering
  const heroImageUrl = campaign.heroImage
    ? urlFor(campaign.heroImage).width(1920).height(1080).fit('crop').auto('format').url()
    : null
  const heroImageAlt: string = campaign.heroImage?.alt ?? (campaign.title as string)

  // Formatted date
  const deployDate = campaign._createdAt
    ? new Date(campaign._createdAt as string).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : null

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ─── Inline styles ──────────────────────────────────────────────────── */}
      <style>{`
        /* Numbered Portable Text blocks */
        .pt-content {
          counter-reset: para;
        }
        .pt-content .pt-block {
          counter-increment: para;
          position: relative;
          padding-left: 64px;
          margin-bottom: 3em;
          font-family: var(--font-mono), monospace;
          font-size: 15px;
          line-height: 2;
          color: rgba(234, 234, 240, 0.8);
        }
        .pt-content .pt-block:last-of-type {
          margin-bottom: 0;
        }
        /* Number label */
        .pt-content .pt-block::before {
          content: counter(para, decimal-leading-zero);
          position: absolute;
          left: 0;
          top: 6px;
          font-family: var(--font-mono), monospace;
          font-size: 10px;
          letter-spacing: 0.16em;
          color: var(--muted);
        }
        /* Vertical rule */
        .pt-content .pt-block::after {
          content: '';
          position: absolute;
          left: 32px;
          top: 0;
          bottom: 0;
          width: 1px;
          background: var(--border);
          transition: background 0.3s;
        }
        .pt-content .pt-block:first-of-type {
          color: var(--text);
        }
        .pt-content .pt-block:first-of-type::after {
          background: rgba(230, 51, 41, 0.55);
        }
        .pt-content .pt-block:first-of-type::before {
          color: var(--red);
        }

        /* Acquire button hover */
        .acquire-btn {
          transition: background 0.15s, transform 0.15s;
        }
        .acquire-btn:hover {
          background: #c42820 !important;
          transform: translateY(-1px);
        }
        .acquire-btn:active {
          transform: translateY(0);
        }
      `}</style>

      {/* ─── Grid background ────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(230,51,41,0.035) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(230,51,41,0.035) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ═══════════════════════════════════════════════════════════════════
            HERO — full-bleed image with overlaid title
        ════════════════════════════════════════════════════════════════════ */}
        <section
          style={{
            position: 'relative',
            height: 'clamp(520px, 82vh, 860px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >

          {/* ── Hero image or fallback ──────────────────────────────────── */}
          {heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroImageUrl}
              alt=""
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                filter: 'brightness(0.72) contrast(1.08) saturate(0.75)',
              }}
            />
          ) : (
            /* No image — use textured placeholder */
            <>
              <div style={{ position: 'absolute', inset: 0, background: 'var(--surface)' }} />
              <div aria-hidden="true" style={{
                position: 'absolute', inset: 0,
                backgroundImage:
                  'linear-gradient(rgba(230,51,41,0.06) 1px, transparent 1px),' +
                  'linear-gradient(90deg, rgba(230,51,41,0.06) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }} />
              {/* Giant ghost letter */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                fontFamily: 'var(--font-display), cursive',
                fontSize: 'clamp(200px, 35vw, 400px)',
                lineHeight: 1,
                color: 'rgba(230,51,41,0.05)',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                letterSpacing: '0.04em',
              }}>
                {(campaign.title as string).charAt(0).toUpperCase()}
              </div>
            </>
          )}

          {/* ── Scan-line texture ───────────────────────────────────────── */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0,
              background: 'repeating-linear-gradient(transparent, transparent 2px, rgba(6,6,14,0.18) 2px, rgba(6,6,14,0.18) 4px)',
              pointerEvents: 'none',
            }}
          />

          {/* ── Top vignette (nav legibility) ───────────────────────────── */}
          <div aria-hidden="true" style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
            background: 'linear-gradient(rgba(6,6,14,0.75) 0%, transparent 100%)',
            pointerEvents: 'none',
          }} />

          {/* ── Bottom gradient (title legibility) ──────────────────────── */}
          <div aria-hidden="true" style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '75%',
            background: 'linear-gradient(transparent 0%, rgba(6,6,14,0.7) 35%, rgba(6,6,14,0.95) 65%, var(--bg) 100%)',
            pointerEvents: 'none',
          }} />

          {/* ── Nav bar — absolute over hero ────────────────────────────── */}
          <nav style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            padding: '20px 48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
          }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
                <path d="M13 5H1M1 5L5 1M1 5L5 9" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, letterSpacing: '0.22em', color: 'rgba(234,234,240,0.65)', textTransform: 'uppercase' }}>
                Command Center
              </span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {deployDate && (
                <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, letterSpacing: '0.16em', color: 'rgba(234,234,240,0.4)', textTransform: 'uppercase' }}>
                  DEPLOYED {deployDate}
                </span>
              )}
              <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, letterSpacing: '0.18em', color: 'rgba(230,51,41,0.8)', textTransform: 'uppercase', border: '1px solid rgba(230,51,41,0.35)', padding: '4px 12px' }}>
                CLASSIFIED
              </span>
            </div>
          </nav>

          {/* ── Hero text content ────────────────────────────────────────── */}
          <div style={{ position: 'relative', zIndex: 10, padding: 'clamp(32px,5vw,56px) clamp(24px,5vw,72px)' }}>
            {/* Eyebrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 28, height: 1, background: 'var(--red)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, letterSpacing: '0.28em', color: 'var(--red)', textTransform: 'uppercase' }}>
                CAMPAIGN DOSSIER
              </span>
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: 'var(--font-display), cursive',
              fontSize: 'clamp(56px, 10vw, 128px)',
              lineHeight: 0.86,
              letterSpacing: '0.01em',
              textTransform: 'uppercase',
              color: '#fff',
              margin: '0 0 clamp(20px,3vw,32px)',
              textShadow: '0 4px 32px rgba(0,0,0,0.6)',
              maxWidth: '80%',
            }}>
              {campaign.title as string}
            </h1>

            {/* Headline + Price row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px 40px', maxWidth: 1000 }}>
              <p style={{
                fontFamily: 'var(--font-mono), monospace',
                fontSize: 'clamp(12px, 1.4vw, 15px)',
                lineHeight: 1.65,
                color: 'rgba(234,234,240,0.55)',
                fontStyle: 'italic',
                margin: 0,
                maxWidth: 540,
              }}>
                &ldquo;{campaign.headline as string}&rdquo;
              </p>

              {/* Price badge */}
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, letterSpacing: '0.3em', color: 'rgba(234,234,240,0.4)', textTransform: 'uppercase', marginBottom: 6 }}>
                  UNIT PRICE
                </div>
                <div style={{
                  fontFamily: 'var(--font-display), cursive',
                  fontSize: 'clamp(36px, 5.5vw, 64px)',
                  lineHeight: 1,
                  color: '#fff',
                  letterSpacing: '0.02em',
                  background: 'var(--red)',
                  padding: '10px 24px',
                  display: 'inline-block',
                  boxShadow: '0 4px 24px rgba(230,51,41,0.4)',
                }}>
                  ${(campaign.price as number).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            BODY — content + sidebar
        ════════════════════════════════════════════════════════════════════ */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(24px,5vw,72px)' }}>

          {/* ── Content + Metadata two-column grid ──────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 280px',
            gap: '0 64px',
            paddingTop: 72,
            alignItems: 'start',
          }}>

            {/* ── Left: Portable Text body ─────────────────────────────── */}
            <div>
              {/* Section label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
                <div style={{ width: 22, height: 1, background: 'var(--border)', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, letterSpacing: '0.24em', color: 'var(--muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  MISSION BRIEF //
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              {Array.isArray(campaign.content) && campaign.content.length > 0 ? (
                <div className="pt-content">
                  <PortableText value={campaign.content} components={ptComponents} />
                </div>
              ) : (
                <p style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>
                  No brief filed.
                </p>
              )}
            </div>

            {/* ── Right: Metadata sidebar ──────────────────────────────── */}
            <aside style={{ paddingTop: 0 }}>

              <div style={{ position: 'sticky', top: 32, display: 'flex', flexDirection: 'column', gap: 1, border: '1px solid var(--border)', background: 'var(--border)' }}>

                {/* Section label */}
                <div style={{ background: 'var(--surface)', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, letterSpacing: '0.26em', color: 'var(--muted)', textTransform: 'uppercase' }}>
                    INTEL FILE
                  </span>
                </div>

                {/* Price */}
                <div style={{ background: 'var(--bg)', padding: '20px 20px 18px' }}>
                  <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, letterSpacing: '0.22em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                    Unit Price
                  </div>
                  <div style={{ fontFamily: 'var(--font-display), cursive', fontSize: 42, lineHeight: 1, color: 'var(--red)', letterSpacing: '0.02em' }}>
                    ${(campaign.price as number).toFixed(2)}
                  </div>
                </div>

                {/* Slug */}
                <div style={{ background: 'var(--bg)', padding: '16px 20px' }}>
                  <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, letterSpacing: '0.22em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Route
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: 'var(--text)', wordBreak: 'break-all' }}>
                    /campaign/{(campaign.slug as { current: string }).current}
                  </div>
                </div>

                {/* Deploy date */}
                {deployDate && (
                  <div style={{ background: 'var(--bg)', padding: '16px 20px' }}>
                    <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, letterSpacing: '0.22em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Deployed
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: 'var(--text)' }}>
                      {deployDate}
                    </div>
                  </div>
                )}

                {/* Doc ID */}
                <div style={{ background: 'var(--bg)', padding: '16px 20px' }}>
                  <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, letterSpacing: '0.22em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Doc ID
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: 'rgba(234,234,240,0.5)', wordBreak: 'break-all', lineHeight: 1.5 }}>
                    {campaign._id as string}
                  </div>
                </div>

                {/* CTA */}
                <div style={{ background: 'var(--bg)', padding: '20px' }}>
                  <button
                    type="button"
                    className="acquire-btn"
                    style={{
                      width: '100%',
                      fontFamily: 'var(--font-display), cursive',
                      fontSize: 20,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      background: 'var(--red)',
                      color: '#fff',
                      border: 'none',
                      padding: '16px 20px',
                      cursor: 'pointer',
                      lineHeight: 1,
                    }}
                  >
                    ACQUIRE TARGET
                  </button>
                  <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, letterSpacing: '0.16em', color: 'var(--muted)', textTransform: 'uppercase', textAlign: 'center', marginTop: 10 }}>
                    ${(campaign.price as number).toFixed(2)} · FREE SHIPPING
                  </div>
                </div>

              </div>
            </aside>
          </div>

          {/* ── Full-width CTA banner ────────────────────────────────────── */}
          <div style={{
            marginTop: 96,
            marginBottom: 0,
            borderTop: '1px solid var(--border)',
            paddingTop: 56,
            paddingBottom: 96,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 24,
          }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, letterSpacing: '0.3em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>
                READY TO DEPLOY
              </div>
              <div style={{ fontFamily: 'var(--font-display), cursive', fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text)', lineHeight: 1 }}>
                {campaign.title as string}
              </div>
            </div>

            <button
              type="button"
              className="acquire-btn"
              style={{
                fontFamily: 'var(--font-display), cursive',
                fontSize: 24,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                background: 'var(--red)',
                color: '#fff',
                border: 'none',
                padding: '22px 52px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              ACQUIRE TARGET — ${(campaign.price as number).toFixed(2)}
            </button>
          </div>

        </div>

        {/* ─── Footer ──────────────────────────────────────────────────────── */}
        <footer style={{
          borderTop: '1px solid var(--border)',
          padding: '20px clamp(24px,5vw,72px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}>
          <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, letterSpacing: '0.14em', color: 'var(--muted)', textTransform: 'uppercase' }}>
            {(campaign.slug as { current: string }).current} // CLASSIFIED
          </span>
          <Link href="/" style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, letterSpacing: '0.14em', color: 'var(--muted)', textTransform: 'uppercase', textDecoration: 'none' }}>
            ← ALL CAMPAIGNS
          </Link>
        </footer>

      </div>
    </main>
  )
}
