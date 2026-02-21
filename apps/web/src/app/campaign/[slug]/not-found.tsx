import Link from 'next/link'

export default function CampaignNotFound() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono), monospace',
        padding: '40px',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(230,51,41,0.03) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(230,51,41,0.03) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          pointerEvents: 'none',
        }}
      />
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div
          style={{
            fontFamily: 'var(--font-display), cursive',
            fontSize: 'clamp(80px, 18vw, 160px)',
            lineHeight: 1,
            color: 'var(--red)',
            letterSpacing: '0.02em',
            marginBottom: 8,
          }}
        >
          404
        </div>
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.26em',
            color: 'var(--muted)',
            textTransform: 'uppercase',
            marginBottom: 40,
          }}
        >
          TARGET NOT FOUND // MISSION ABORTED
        </div>
        <Link
          href="/"
          style={{
            fontFamily: 'var(--font-mono), monospace',
            fontSize: 10,
            letterSpacing: '0.22em',
            color: 'var(--text)',
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(8px)',
            textTransform: 'uppercase',
            textDecoration: 'none',
            border: '1px solid rgba(0,0,0,0.08)',
            padding: '12px 28px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            transition: 'all 0.2s ease',
          }}
        >
          ← Return to Trend Hunter
        </Link>
      </div>
    </main>
  )
}
