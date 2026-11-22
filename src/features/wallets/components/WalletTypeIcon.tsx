import type { WalletType } from '../types'

interface WalletTypeIconProps {
  className?: string
  type: WalletType
}

export function WalletTypeIcon({
  className = 'size-5',
  type,
}: WalletTypeIconProps) {
  switch (type) {
    case 'bank':
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          {/* Bank building */}
          <path d="m2 9 10-6 10 6" />
          <path d="M4 10v9" />
          <path d="M8 10v9" />
          <path d="M12 10v9" />
          <path d="M16 10v9" />
          <path d="M20 10v9" />
          <path d="M2 19h20" />
          <path d="M2 22h20" />
        </svg>
      )
    case 'e_wallet':
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          {/* Smartphone with digital wallet */}
          <rect height="20" rx="3" width="14" x="5" y="2" />
          <path d="M10 6h4" />
          <path d="M12 18h.01" />
          <path d="M9 11h6" />
          <path d="M9 14h4" />
        </svg>
      )
    case 'e_money':
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          {/* Contactless smart card */}
          <rect height="16" rx="2" width="22" x="1" y="4" />
          <path d="M1 10h22" />
          <path d="M6 15h3" />
          <path d="M15 15a2 2 0 0 1 2-2" />
          <path d="M18 15a5 5 0 0 0-5-5" />
        </svg>
      )
    case 'cash':
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          {/* Cash banknotes */}
          <rect height="12" rx="2" width="20" x="2" y="6" />
          <circle cx="12" cy="12" r="2" />
          <path d="M6 12h.01M18 12h.01" />
        </svg>
      )
    case 'other':
    default:
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          {/* Vault / safe box */}
          <rect height="18" rx="2" width="18" x="3" y="3" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 9v6M9 12h6" />
        </svg>
      )
  }
}
