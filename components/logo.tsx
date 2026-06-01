import Link from 'next/link'

interface LogoProps {
  href?: string
  size?: 'sm' | 'md' | 'lg'
  dark?: boolean // dark = white text (for dark backgrounds), light = dark text
}

const sizes = {
  sm: { icon: 28, svg: 15, text: 'text-sm' },
  md: { icon: 32, svg: 17, text: 'text-[15px]' },
  lg: { icon: 38, svg: 20, text: 'text-lg' },
}

export function KasAILogo({ href = '/', size = 'md', dark = true }: LogoProps) {
  const s = sizes[size]

  const inner = (
    <span className="flex items-center gap-2.5">
      {/* Icon mark */}
      <span
        className="relative flex shrink-0 items-center justify-center rounded-xl"
        style={{
          width: s.icon,
          height: s.icon,
          background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 60%, #2563EB 100%)',
          boxShadow: '0 2px 12px rgba(124,58,237,0.35)',
        }}
      >
        <svg width={s.svg} height={s.svg} viewBox="0 0 20 20" fill="none">
          {/* Coin circle */}
          <circle cx="9.5" cy="11.5" r="6" stroke="white" strokeWidth="1.5"/>
          {/* Rupiah symbol inside coin */}
          <path d="M9.5 8.5v6M7.5 10h4M7.5 11.5h4" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
          {/* Sparkle top-right */}
          <path
            d="M15.5 2.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6.6-1.4z"
            fill="white"
            opacity="0.9"
          />
        </svg>
      </span>

      {/* Wordmark */}
      <span className={`font-bold tracking-tight ${s.text} ${dark ? 'text-white' : 'text-gray-900'}`}>
        KasAI
      </span>
    </span>
  )

  if (!href) return inner

  return (
    <Link href={href} className="inline-flex items-center hover:opacity-90 transition-opacity">
      {inner}
    </Link>
  )
}
