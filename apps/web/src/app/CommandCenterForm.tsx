'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type StepState = 'idle' | 'active' | 'done' | 'error'

interface StepItem {
  label: string
  state: StepState
}

interface CampaignResult {
  _id: string
  title: string
  slug: { current: string }
  headline: string
  price: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

const makeSteps = (): StepItem[] => [
  { label: 'Scoping Trend',        state: 'idle' },
  { label: 'Claude Brainstorming', state: 'idle' },
  { label: 'Publishing to Sanity', state: 'idle' },
]

// ─── StepBadge ────────────────────────────────────────────────────────────────

function StepBadge({ state }: { state: StepState }) {
  const wrap: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontFamily: 'var(--font-mono), monospace',
    fontSize: 10,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  }

  if (state === 'idle') {
    return (
      <div style={{ ...wrap, color: 'var(--muted)' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', border: '1px solid currentColor', opacity: 0.4 }} />
        STANDBY
      </div>
    )
  }
  if (state === 'active') {
    return (
      <div style={{ ...wrap, color: 'var(--red)' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', animation: 'pulse-dot 0.9s ease-in-out infinite' }} />
        PROCESSING
      </div>
    )
  }
  if (state === 'done') {
    return (
      <div style={{ ...wrap, color: 'var(--green)' }}>
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
          <path d="M1 4L3.8 7L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        COMPLETE
      </div>
    )
  }
  return (
    <div style={{ ...wrap, color: 'var(--red)' }}>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
        <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      FAILED
    </div>
  )
}

// ─── StepRow ──────────────────────────────────────────────────────────────────

function StepRow({ index, step }: { index: number; step: StepItem }) {
  const num = String(index + 1).padStart(2, '0')
  const labelColor =
    step.state === 'error' ? 'var(--red)'   :
    step.state === 'idle'  ? 'var(--muted)' :
    'var(--text)'
  const numColor =
    step.state === 'done'  ? 'var(--green)' :
    step.state === 'error' ? 'var(--red)'   :
    'var(--muted)'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '15px 0',
        borderBottom: '1px solid var(--border)',
        opacity: step.state === 'idle' ? 0.35 : 1,
        transition: 'opacity 0.4s ease',
        animation: `slide-in 0.4s cubic-bezier(0.16,1,0.3,1) ${index * 0.08}s both`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, letterSpacing: '0.12em', color: numColor, transition: 'color 0.3s ease' }}>
          {num}
        </span>
        <span style={{ color: 'var(--border)', fontFamily: 'var(--font-mono), monospace', fontSize: 11 }}>/</span>
        <span style={{ fontFamily: 'var(--font-display), cursive', fontSize: 20, letterSpacing: '0.04em', textTransform: 'uppercase', color: labelColor, transition: 'color 0.3s ease' }}>
          {step.label}
        </span>
      </div>
      <StepBadge state={step.state} />
    </div>
  )
}

// ─── ResultCard ───────────────────────────────────────────────────────────────

function ResultCard({ result }: { result: CampaignResult }) {
  const studioUrl = `http://localhost:3333/structure/campaign;${result._id}`
  const metaLabel: React.CSSProperties = {
    fontFamily: 'var(--font-mono), monospace',
    fontSize: 9,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: 'var(--muted)',
    marginBottom: 4,
  }
  const divider = <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

  return (
    <div
      className="glass"
      style={{
        background: 'rgba(22, 163, 74, 0.04)',
        border: '1px solid rgba(22, 163, 74, 0.2)',
        padding: '28px 30px',
        animation: 'fade-up 0.45s cubic-bezier(0.16,1,0.3,1) forwards',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
            <path d="M1 5L4.5 8.5L11 1.5" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, letterSpacing: '0.2em', color: 'var(--green)', textTransform: 'uppercase' }}>
            MISSION COMPLETE — CAMPAIGN DEPLOYED
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href={studioUrl} target="_blank" rel="noreferrer"
            style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', border: '1px solid var(--border)', padding: '6px 14px', textDecoration: 'none' }}>
            STUDIO ↗
          </a>
          <Link href={`/campaign/${result.slug.current}`}
            style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text)', border: '1px solid rgba(230,51,41,0.5)', padding: '6px 14px', textDecoration: 'none', background: 'rgba(230,51,41,0.08)' }}>
            VIEW CAMPAIGN →
          </Link>
        </div>
      </div>

      {/* Title */}
      <div style={{ fontFamily: 'var(--font-display), cursive', fontSize: 'clamp(28px, 5vw, 44px)', textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--text)', lineHeight: 1, marginBottom: 10 }}>
        {result.title}
      </div>
      {/* Headline */}
      <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.55, marginBottom: 28 }}>
        &ldquo;{result.headline}&rdquo;
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
        <div>
          <div style={metaLabel}>PRICE</div>
          <div style={{ fontFamily: 'var(--font-display), cursive', fontSize: 30, color: 'var(--red)', letterSpacing: '0.02em' }}>
            ${result.price.toFixed(2)}
          </div>
        </div>
        {divider}
        <div>
          <div style={metaLabel}>SLUG</div>
          <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: 'var(--text)' }}>
            /{result.slug.current}
          </div>
        </div>
        {divider}
        <div style={{ minWidth: 0 }}>
          <div style={metaLabel}>SANITY ID</div>
          <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
            {result._id}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── CommandCenterForm ────────────────────────────────────────────────────────

export function CommandCenterForm(): React.JSX.Element {
  const [topic,      setTopic]      = useState('')
  const [isRunning,  setIsRunning]  = useState(false)
  const [steps,      setSteps]      = useState<StepItem[]>(makeSteps())
  const [result,     setResult]     = useState<CampaignResult | null>(null)
  const [error,      setError]      = useState<string | null>(null)
  const [hasStarted, setHasStarted] = useState(false)

  const patchStep = (i: number, state: StepState) =>
    setSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, state } : s)))

  const handleSubmit = async () => {
    if (!topic.trim() || isRunning) return
    setIsRunning(true)
    setResult(null)
    setError(null)
    setHasStarted(true)
    setSteps(makeSteps())

    patchStep(0, 'active')
    await sleep(700)
    patchStep(0, 'done')
    patchStep(1, 'active')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim() }),
      })
      patchStep(1, 'done')
      patchStep(2, 'active')

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? 'Generation failed')
      }

      const data = (await res.json()) as CampaignResult
      await sleep(500)
      patchStep(2, 'done')
      setResult(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      setSteps(prev => prev.map(s => s.state === 'active' ? { ...s, state: 'error' } : s))
    } finally {
      setIsRunning(false)
    }
  }

  const btnBorder = isRunning
    ? 'rgba(230,51,41,0.3)'
    : !topic.trim()
    ? 'var(--border)'
    : 'var(--red)'

  return (
    <>
      {/* Eyebrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <div style={{ width: 22, height: 1, background: 'var(--red)', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, letterSpacing: '0.26em', color: 'var(--red)', textTransform: 'uppercase' }}>
          AUTOMATED STOREFRONT / OPS v1.0
        </span>
      </div>

      {/* Hero headline */}
      <h1 style={{ fontFamily: 'var(--font-display), cursive', fontSize: 'clamp(68px, 13vw, 124px)', lineHeight: 0.88, letterSpacing: '0.01em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 20, userSelect: 'none' }}>
        TREND<br />HUNTER
      </h1>

      <p style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 52 }}>
        Trend input → Claude copy → Sanity publish. One shot.
      </p>

      <div style={{ height: 1, background: 'var(--border)', marginBottom: 40 }} />

      {/* Input group */}
      <div style={{ marginBottom: 40 }}>
        <label htmlFor="topic" style={{ display: 'block', fontFamily: 'var(--font-mono), monospace', fontSize: 10, letterSpacing: '0.24em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>
          TARGET TREND //
        </label>
        <div style={{ display: 'flex' }}>
          <input
            id="topic"
            className="cmd-input glass-dark"
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="What trend are we attacking today?"
            style={{
              background: 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: '#000',
              fontWeight: 500,
            }}
            disabled={isRunning}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!topic.trim() || isRunning}
            style={{
              background: isRunning ? 'rgba(230,51,41,0.6)' : !topic.trim() ? '#E0E0E0' : 'var(--red)',
              border: 'none',
              color: '#fff',
              fontFamily: 'var(--font-display), cursive',
              fontSize: 20,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '14px 32px',
              cursor: !topic.trim() || isRunning ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              borderRadius: 0,
              boxShadow: !topic.trim() || isRunning ? 'none' : '0 8px 20px rgba(230,51,41,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 140,
            }}
          >
            {isRunning ? 'RUNNING...' : 'DEPLOY'}
          </button>
        </div>
      </div>

      {/* Mission log */}
      {hasStarted && (
        <div style={{ marginBottom: result ?? error ? 36 : 0 }}>
          <span style={{ display: 'block', fontFamily: 'var(--font-mono), monospace', fontSize: 10, letterSpacing: '0.24em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
            MISSION LOG //
          </span>
          {steps.map((step, i) => (
            <StepRow key={step.label} index={i} step={step} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div role="alert" style={{ background: 'rgba(230,51,41,0.07)', border: '1px solid rgba(230,51,41,0.35)', padding: '14px 18px', fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: 'var(--red)', letterSpacing: '0.04em', animation: 'fade-up 0.3s ease forwards', marginBottom: 20 }}>
          ✕ MISSION FAILED — {error}
        </div>
      )}

      {/* Result */}
      {result && <ResultCard result={result} />}
    </>
  )
}
