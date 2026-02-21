import { notFound } from 'next/navigation'
import { defineQuery, PortableText } from 'next-sanity'
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

const NEXT_CAMPAIGN_QUERY = defineQuery(`
  *[_type == "campaign" && _createdAt < $createdAt] | order(_createdAt desc)[0] {
    title,
    slug
  }
`)

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

  const { data: nextData } = await sanityFetch({
    query: NEXT_CAMPAIGN_QUERY,
    params: { createdAt: campaign._createdAt }
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextMission = nextData as any

  const heroImageUrl = campaign.heroImage
    ? urlFor(campaign.heroImage).width(1920).height(1080).fit('crop').auto('format').url()
    : null

  const deployDate = campaign._createdAt
    ? new Date(campaign._createdAt as string).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : null

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ─── Inline styles ──────────────────────────────────────────────────── */}
      <style>{`
        /* Portable Text content blocks */
        .pt-content p {
          position: relative;
          padding-left: 0;
          margin-bottom: 1.8em;
          font-family: var(--font-mono), monospace;
          font-size: 15px;
          line-height: 1.9;
          color: var(--text);
        }
        .pt-content p:last-child { margin-bottom: 0; }

        /* Acquire button hover */
        .acquire-btn { transition: background 0.15s, transform 0.15s; }
        .acquire-btn:hover { background: #c42820 !important; transform: translateY(-1px); }
        .acquire-btn:active { transform: translateY(0); }
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
            <>
              <div style={{ position: 'absolute', inset: 0, background: 'var(--surface)' }} />
              <div aria-hidden="true" style={{
                position: 'absolute', inset: 0,
                backgroundImage:
                  'linear-gradient(rgba(230,51,41,0.06) 1px, transparent 1px),' +
                  'linear-gradient(90deg, rgba(230,51,41,0.06) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }} />
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
              background: 'repeating-linear-gradient(transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)',
              pointerEvents: 'none',
            }}
          />

          {/* ── Dark overlay so title is always readable ─────────────────── */}
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.55) 100%)',
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
                <path d="M13 5H1M1 5L5 1M1 5L5 9" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, letterSpacing: '0.22em', color: '#fff', textTransform: 'uppercase' }}>
                Trend Hunter
              </span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {deployDate && (
                <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
                  DEPLOYED {deployDate}
                </span>
              )}
              <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, letterSpacing: '0.18em', color: 'var(--red)', textTransform: 'uppercase', border: '1px solid rgba(230,51,41,0.5)', padding: '4px 12px', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}>
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

            {/* Title — always white, sits over the dark overlay */}
            <h1 style={{
              fontFamily: 'var(--font-display), cursive',
              fontSize: 'clamp(56px, 10vw, 128px)',
              lineHeight: 0.86,
              letterSpacing: '0.01em',
              textTransform: 'uppercase',
              color: '#fff',
              margin: '0 0 clamp(20px,3vw,32px)',
              maxWidth: '80%',
              textShadow: '0 2px 20px rgba(0,0,0,0.3)',
            }}>
              {campaign.title as string}
            </h1>

            {/* Headline + Price row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px 40px', maxWidth: 1000 }}>
              <p style={{
                fontFamily: 'var(--font-mono), monospace',
                fontSize: 'clamp(12px, 1.4vw, 15px)',
                lineHeight: 1.65,
                color: 'rgba(255,255,255,0.8)',
                fontStyle: 'italic',
                margin: 0,
                maxWidth: 540,
                textShadow: '0 1px 8px rgba(0,0,0,0.4)',
              }}>
                &ldquo;{campaign.headline as string}&rdquo;
              </p>

              {/* Price badge */}
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: 6 }}>
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
                  boxShadow: '0 8px 24px rgba(230,51,41,0.3)',
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

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 280px',
            gap: '0 64px',
            paddingTop: 72,
            alignItems: 'start',
          }}>

            {/* ── Left: Portable Text body ─────────────────────────────── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
                <div style={{ width: 22, height: 1, background: 'var(--border)', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, letterSpacing: '0.24em', color: 'var(--muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  MISSION BRIEF //
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              {Array.isArray(campaign.content) && campaign.content.length > 0 ? (
                <div className="pt-content">
                  <PortableText value={campaign.content} />
                </div>
              ) : (
                <p style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>
                  No brief filed.
                </p>
              )}
            </div>

            {/* ── Right: Metadata sidebar ──────────────────────────────── */}
            <aside>
              <div style={{ position: 'sticky', top: 32, display: 'flex', flexDirection: 'column', gap: 1, border: '1px solid var(--border)', background: 'var(--border)', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>

                <div style={{ background: 'var(--surface)', padding: '14px 20px', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(8px)' }}>
                  <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, letterSpacing: '0.26em', color: 'var(--muted)', textTransform: 'uppercase' }}>
                    INTEL FILE
                  </span>
                </div>

                {/* Price */}
                <div style={{ background: 'var(--surface)', padding: '20px 20px 18px' }}>
                  <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, letterSpacing: '0.22em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                    Unit Price
                  </div>
                  <div style={{ fontFamily: 'var(--font-display), cursive', fontSize: 42, lineHeight: 1, color: 'var(--red)', letterSpacing: '0.02em' }}>
                    ${(campaign.price as number).toFixed(2)}
                  </div>
                </div>

                {/* Slug */}
                <div style={{ background: 'var(--surface)', padding: '16px 20px' }}>
                  <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, letterSpacing: '0.22em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Route
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: 'var(--text)', wordBreak: 'break-all' }}>
                    /campaign/{(campaign.slug as { current: string }).current}
                  </div>
                </div>

                {/* Deploy date */}
                {deployDate && (
                  <div style={{ background: 'var(--surface)', padding: '16px 20px' }}>
                    <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, letterSpacing: '0.22em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Deployed
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: 'var(--text)' }}>
                      {deployDate}
                    </div>
                  </div>
                )}

                {/* Doc ID */}
                <div style={{ background: 'var(--surface)', padding: '16px 20px' }}>
                  <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, letterSpacing: '0.22em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Doc ID
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: 'var(--muted)', wordBreak: 'break-all', lineHeight: 1.5 }}>
                    {campaign._id as string}
                  </div>
                </div>

                {/* CTA */}
                <div style={{ background: 'var(--surface)', padding: '20px' }}>
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
                      boxShadow: '0 8px 20px rgba(230,51,41,0.2)',
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
                boxShadow: '0 12px 30px rgba(230,51,41,0.25)',
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

        {/* ─── Sticky Next Mission Banner ──────────────────────────────────── */}
        {nextMission && (
          <div style={{
            position: 'sticky',
            bottom: 24,
            zIndex: 100,
            padding: '0 clamp(24px,5vw,72px)',
            pointerEvents: 'none',
          }}>
            <Link
              href={`/campaign/${nextMission.slug.current}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 28px',
                maxWidth: 600,
                margin: '0 auto',
                textDecoration: 'none',
                pointerEvents: 'auto',
                border: '1px solid rgba(230,51,41,0.2)',
                background: 'var(--surface)',
                backdropFilter: 'blur(12px) saturate(180%)',
                WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, letterSpacing: '0.22em', color: 'var(--red)', textTransform: 'uppercase' }}>
                  NEXT MISSION //
                </span>
                <span style={{ fontFamily: 'var(--font-display), cursive', fontSize: 18, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {nextMission.title}
                </span>
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--red)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff',
              }}>
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true" style={{ transform: 'rotate(180deg)' }}>
                  <path d="M13 5H1M1 5L5 1M1 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
