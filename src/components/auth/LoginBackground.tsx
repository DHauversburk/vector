import type { ReactNode } from 'react'

interface LoginBackgroundProps {
  children: ReactNode
  isLoaded: (id: string) => boolean
}

export function LoginBackground({ children, isLoaded }: LoginBackgroundProps) {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* ============================================================
                BACKGROUND - Loads first
                ============================================================ */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${isLoaded('background') ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-30 blur-3xl animate-pulse"
            style={{
              background: 'radial-gradient(circle, hsl(217, 91%, 60%) 0%, transparent 70%)',
              animationDuration: '4s',
            }}
          />
          <div
            className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl animate-pulse"
            style={{
              background: 'radial-gradient(circle, hsl(262, 83%, 58%) 0%, transparent 70%)',
              animationDuration: '5s',
              animationDelay: '1s',
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl animate-pulse"
            style={{
              background: 'radial-gradient(circle, hsl(330, 81%, 60%) 0%, transparent 70%)',
              animationDuration: '6s',
              animationDelay: '2s',
            }}
          />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        {/* Top gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1 vector-gradient" />
      </div>

      {children}
    </div>
  )
}
