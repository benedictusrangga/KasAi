import Link from 'next/link'

interface LogoProps {
  href?: string
  size?: 'sm' | 'md' | 'lg'
  dark?: boolean
}

const sizes = {
  sm: { icon: 26, text: 'text-[13px]', gap: 'gap-2' },
  md: { icon: 30, text: 'text-[15px]', gap: 'gap-2.5' },
  lg: { icon: 36, text: 'text-[18px]', gap: 'gap-3' },
}

export function KasAILogo({ href = '/', size = 'md', dark = true }: LogoProps) {
  const s = sizes[size]

  const inner = (
    <span className={`flex items-center ${s.gap}`}>
      {/* Icon mark — abstract "K" monogram with gradient */}
      <span
        className="relative flex shrink-0 items-center justify-center rounded-[10px] overflow-hidden"
        style={{
          width: s.icon,
          height: s.icon,
          background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #3B82F6 100%)',
          boxShadow: dark
            ? '0 0 0 1px rgba(139,92,246,0.3), 0 4px 16px rgba(99,102,241,0.4)'
            : '0 0 0 1px rgba(139,92,246,0.2), 0 2px 8px rgba(99,102,241,0.25)',
        }}
      >
        {/* Subtle inner highlight */}
        <span
          className="absolute inset-0 rounded-[10px]"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%)',
          }}
        />
        {/* Monogram SVG */}
        <svg
          width={Math.round(s.icon * 0.58)}
          height={Math.round(s.icon * 0.58)}
          viewBox="0 0 17 17"
          fill="none"
          className="relative z-10"
        >
          {/* Stylized "K" — vertical bar + two diagonal strokes */}
          <path
            d="M4.5 3v11M4.5 8.5L12 3M4.5 8.5L12 14"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Accent dot — top right sparkle */}
          <circle cx="13.5" cy="3.5" r="1.5" fill="rgba(255,255,255,0.7)" />
        </svg>
      </span>

      {/* Wordmark */}
      <span
        className={`font-bold tracking-[-0.02em] leading-none ${s.text}`}
        style={
          dark
            ? {
                background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.75) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }
            : { color: '#111' }
        }
      >
        KasAI
      </span>
    </span>
  )

  if (!href) return inner

  return (
    <Link href={href} className="inline-flex items-center hover:opacity-85 transition-opacity duration-200">
      {inner}
    </Link>
  )
}
