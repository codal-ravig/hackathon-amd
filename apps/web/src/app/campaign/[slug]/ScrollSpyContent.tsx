'use client'

import { useEffect, useRef, useState } from 'react'
import { PortableText, type PortableTextComponents } from 'next-sanity'

// ─── Portable Text components ─────────────────────────────────────────────────

const ptComponents: PortableTextComponents = {
  block: {
    normal: ({ children, value }) => (
      <p className="pt-block scroll-target" data-id={value._key}>
        {children}
      </p>
    ),
  },
}

export function ScrollSpyContent({ content }: { content: any }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.getAttribute('data-id'))
        }
      })
    }, options)

    const targets = containerRef.current?.querySelectorAll('.scroll-target')
    targets?.forEach((t) => observer.observe(t))

    return () => observer.disconnect()
  }, [content])

  return (
    <div ref={containerRef} className="pt-content">
      <style jsx global>{`
        .pt-block {
          transition: all 0.4s ease;
          opacity: 0.3;
          transform: translateX(0);
        }
        
        /* Highlight the active block */
        .pt-block.is-active {
          opacity: 1 !important;
          color: var(--text) !important;
        }
        
        .pt-block.is-active::before {
          color: var(--red) !important;
          transform: scale(1.2);
          transition: all 0.3s ease;
        }
        
        .pt-block.is-active::after {
          background: var(--red) !important;
          height: 100% !important;
          transition: all 0.5s ease;
        }

        .scroll-target {
          position: relative;
        }
      `}</style>
      
      <PortableText 
        value={content} 
        components={{
          ...ptComponents,
          block: {
            normal: ({ children, value }: any) => {
              const isActive = activeId === value._key
              return (
                <p 
                  className={`pt-block scroll-target ${isActive ? 'is-active' : ''}`} 
                  data-id={value._key}
                >
                  {children}
                </p>
              )
            }
          }
        }} 
      />
    </div>
  )
}
