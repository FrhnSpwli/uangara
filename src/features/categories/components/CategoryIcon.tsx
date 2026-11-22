interface CategoryIconProps {
  className?: string
  name: string
}

export function CategoryIcon({
  className = 'size-5',
  name,
}: CategoryIconProps) {
  switch (name) {
    case 'utensils':
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M18 2v6a3 3 0 01-3 3 3 3 0 01-3-3V2M15 2v10M12 12v10M6 2v8a2 2 0 002 2h0a2 2 0 002-2V2M8 12v10" />
        </svg>
      )
    case 'car':
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 10.9 2 11v5c0 .6.4 1 1 1h2m10 0a2 2 0 100-4 2 2 0 000 4zm-8 0a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      )
    case 'shopping-bag':
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
        </svg>
      )
    case 'receipt':
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1zM8 7h8M8 11h8M8 15h5" />
        </svg>
      )
    case 'film':
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <rect height="20" rx="2.18" ry="2.18" width="20" x="2" y="2" />
          <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" />
        </svg>
      )
    case 'heart-pulse':
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
        </svg>
      )
    case 'graduation-cap':
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      )
    case 'briefcase':
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <rect height="14" rx="2" ry="2" width="20" x="2" y="7" />
          <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
        </svg>
      )
    case 'store':
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="m2 7 4.41-4.41A2 2 0 017.83 2h8.34a2 2 0 011.42.59L22 7M4 7v14a1 1 0 001 1h14a1 1 0 001-1V7M9 22v-6h6v6M2 7h20" />
        </svg>
      )
    case 'gift':
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <polyline points="20 12 20 22 4 22 4 12" />
          <rect height="5" width="20" x="2" y="7" />
          <line x1="12" x2="12" y1="22" y2="7" />
          <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
        </svg>
      )
    case 'trending-up':
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      )
    case 'sparkles':
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="m12 3-1.912 5.813a2 2 0 01-1.275 1.275L3 12l5.813 1.912a2 2 0 011.275 1.275L12 21l1.912-5.813a2 2 0 011.275-1.275L21 12l-5.813-1.912a2 2 0 01-1.275-1.275L12 3z" />
        </svg>
      )
    case 'wallet':
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
          <path d="M16 3H4a2 2 0 00-2 2v2h18V5a2 2 0 00-2-2zM16 14h.01" />
        </svg>
      )
    case 'smartphone':
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <rect height="20" rx="2" ry="2" width="14" x="5" y="2" />
          <line x1="12" x2="12.01" y1="18" y2="18" />
        </svg>
      )
    case 'building-columns':
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 2L2 7h20L12 2z" />
        </svg>
      )
    case 'piggy-bank':
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z" />
          <path d="M16 11h.01M11 6.5v1.5" />
        </svg>
      )
    case 'credit-card':
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <rect height="16" rx="2" width="22" x="1" y="4" />
          <line x1="1" x2="23" y1="10" y2="10" />
        </svg>
      )
    case 'users':
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      )
    case 'shapes':
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M8.3 10a.7.7 0 01-.6-.3L4.3 4.3a.7.7 0 01.6-1h6.2a.7.7 0 01.6 1l-2.8 5.4a.7.7 0 01-.6.3zM14 9a5 5 0 1010 0 5 5 0 00-10 0zM3 15h8v8H3z" />
        </svg>
      )
    case 'folder':
    default:
      return (
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        </svg>
      )
  }
}
