import { defineQuery } from 'next-sanity'
import Link from 'next/link'
import imageUrlBuilder from '@sanity/image-url'
import { sanityFetch } from '@/sanity/lib/live'
import { client } from '@/sanity/lib/client'
import { CommandCenterForm } from './CommandCenterForm'

// ─── Image builder ────────────────────────────────────────────────────────────

const builder = imageUrlBuilder(client)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function urlFor(source: any) {
  return builder.image(source)
}

// ─── Campaigns query ──────────────────────────────────────────────────────────

const CAMPAIGNS_QUERY = defineQuery(`
  *[_type == "campaign"] | order(_createdAt desc) {
    _id,
    title,
    slug,
    headline,
    price,
    heroImage,
    _createdAt
  }
`)

// ─── CampaignCard ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CampaignCard({ campaign, index }: { campaign: any; index: number }) {
  const thumbUrl = campaign.heroImage
    ? urlFor(campaign.heroImage).width(600).height(380).fit('crop').auto('format').url()
    : null

  const num = String(index + 1).padStart(2, '0')

  return (
    <Link
      href={`/campaign/${campaign.slug.current}`}
      style={{ textDecoration: 'none', display: 'block' }}
      className="campaign-card"
    >
      {/* Image area */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface)' }}>
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt={campaign.heroImage?.alt ?? campaign.title}
            style={{
              width: '100%',
              display: 'block',
              aspectRatio: '16 / 10',
              objectFit: 'cover',
              filter: 'brightness(0.98) contrast(1.02)',
              transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1), filter 0.4s ease',
            }}
            className="campaign-card-img"
          />
        ) : (
          /* Placeholder */
          <div
            style={{
              width: '100%',
              aspectRatio: '16 / 10',
              background: 'var(--surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div aria-hidden="true" style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'linear-gradient(rgba(230,51,41,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(230,51,41,0.05) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }} />
            <span style={{ fontFamily: 'var(--font-display), cursive', fontSize: 72, color: 'rgba(230,51,41,0.12)', letterSpacing: '0.04em', position: 'relative', zIndex: 1 }}>
              {(campaign.title as string).charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Sequence number badge */}
        <div style={{
          position: 'absolute',
          top: 12,
          left: 12,
          fontFamily: 'var(--font-mono), monospace',
          fontSize: 10,
          letterSpacing: '0.18em',
          color: 'var(--text)',
          background: 'var(--surface)',
          padding: '4px 10px',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid var(--border)',
        }}>
          {num}
        </div>

        {/* Price badge */}
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          fontFamily: 'var(--font-display), cursive',
          fontSize: 22,
          letterSpacing: '0.02em',
          color: '#fff',
          background: 'var(--red)',
          padding: '4px 14px',
          lineHeight: 1.4,
          boxShadow: '0 4px 12px rgba(230,51,41,0.3)',
        }}>
          ${(campaign.price as number).toFixed(2)}
        </div>
      </div>

      {/* Text content */}
      <div style={{ padding: '18px 20px 20px', borderTop: '1px solid var(--border)' }}>
        <h3 style={{
          fontFamily: 'var(--font-display), cursive',
          fontSize: 'clamp(20px, 3vw, 26px)',
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          color: 'var(--text)',
          lineHeight: 1.1,
          margin: '0 0 8px',
        }}>
          {campaign.title as string}
        </h3>

        <p style={{
          fontFamily: 'var(--font-mono), monospace',
          fontSize: 12,
          lineHeight: 1.6,
          color: 'var(--muted)',
          fontStyle: 'italic',
          margin: '0 0 16px',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          &ldquo;{campaign.headline as string}&rdquo;
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 6,
          fontFamily: 'var(--font-mono), monospace',
          fontSize: 10,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--red)',
        }}>
          OPEN DOSSIER
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
            <path d="M1 4H11M11 4L8 1M11 4L8 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function Home(): Promise<React.JSX.Element> {
  const { data: campaigns } = await sanityFetch({ query: CAMPAIGNS_QUERY })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const campaignList = (campaigns as any[] | null) ?? []

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>

      <style>{`
        .campaign-card {
          background: var(--surface);
          backdrop-filter: blur(12px) saturate(180%);
          -webkit-backdrop-filter: blur(12px) saturate(180%);
          border: 1px solid var(--border);
          transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
          cursor: pointer;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
        }
        .campaign-card:hover {
          border-color: rgba(230, 51, 41, 0.4);
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
        }
        html[data-theme="dark"] .campaign-card {
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
        }
        html[data-theme="dark"] .campaign-card:hover {
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
        }
        .campaign-card:hover .campaign-card-img {
          transform: scale(1.04);
          filter: brightness(1) contrast(1.04) !important;
        }
      `}</style>

      {/* Fixed grid background */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(230,51,41,0.03) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(230,51,41,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ─── Trend Hunter section ───────────────────────────────────────────── */}
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          margin: '0 auto',
          padding: '80px 24px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <CommandCenterForm />
      </div>

      {/* ─── Active Deployments section ─────────────────────────────────────── */}
      {campaignList.length > 0 && (
        <section
          style={{
            width: '100%',
            position: 'relative',
            zIndex: 1,
            borderTop: '1px solid var(--border)',
            padding: '72px 24px 120px',
          }}
        >
          <div style={{ maxWidth: 1140, margin: '0 auto' }}>

            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 22, height: 1, background: 'var(--red)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, letterSpacing: '0.26em', color: 'var(--red)', textTransform: 'uppercase' }}>
                    INTEL BOARD
                  </span>
                </div>
                <h2 style={{
                  fontFamily: 'var(--font-display), cursive',
                  fontSize: 'clamp(40px, 7vw, 72px)',
                  lineHeight: 0.9,
                  letterSpacing: '0.01em',
                  textTransform: 'uppercase',
                  color: 'var(--text)',
                  margin: 0,
                }}>
                  ACTIVE<br />DEPLOYMENTS
                </h2>
              </div>

              <div style={{
                fontFamily: 'var(--font-display), cursive',
                fontSize: 'clamp(48px, 8vw, 96px)',
                lineHeight: 1,
                letterSpacing: '0.02em',
                color: 'rgba(230,51,41,0.15)',
              }}>
                {String(campaignList.length).padStart(2, '0')}
              </div>
            </div>

            {/* Campaign grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '24px',
            }}>
              {campaignList.map((campaign, i) => (
                <CampaignCard key={campaign._id} campaign={campaign} index={i} />
              ))}
            </div>

            {/* Footer count */}
            <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, letterSpacing: '0.2em', color: 'var(--muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {campaignList.length} MISSION{campaignList.length !== 1 ? 'S' : ''} DEPLOYED
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

          </div>
        </section>
      )}
    </main>
  )
}
