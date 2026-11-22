import { useBalancePrivacy } from '../context/useBalancePrivacy'

interface BalancePrivacyToggleProps {
  className?: string
  showLabel?: boolean
  variant?: 'dark' | 'default' | 'ghost'
}

export function BalancePrivacyToggle({
  className = '',
  showLabel = false,
  variant = 'default',
}: BalancePrivacyToggleProps) {
  const { isHidden, toggleHidden } = useBalancePrivacy()

  const variantStyles = (() => {
    switch (variant) {
      case 'dark':
        return 'border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/30'
      case 'ghost':
        return 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
      case 'default':
      default:
        return 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
    }
  })()

  return (
    <button
      aria-label={isHidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
      aria-pressed={isHidden}
      className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${variantStyles} ${className}`}
      onClick={toggleHidden}
      title={isHidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
      type="button"
    >
      {isHidden ? (
        <svg
          aria-hidden="true"
          className="size-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          className="size-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )}

      {showLabel ? (
        <span>{isHidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}</span>
      ) : null}
    </button>
  )
}
