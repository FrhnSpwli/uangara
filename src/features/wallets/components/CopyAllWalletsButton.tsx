import { useState } from 'react'

import type { WalletType } from '../types'
import { copyToClipboard, formatAllWalletsCopy } from '../utils/clipboard'

interface WalletCopyItem {
  institution?: string | null
  name: string
  type: WalletType
}

interface CopyAllWalletsButtonProps {
  className?: string
  wallets: readonly WalletCopyItem[]
}

export function CopyAllWalletsButton({
  className = '',
  wallets,
}: CopyAllWalletsButtonProps) {
  const [copied, setCopied] = useState(false)

  if (wallets.length === 0) return null

  const handleCopy = async () => {
    const text = formatAllWalletsCopy(wallets)
    const success = await copyToClipboard(text)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      aria-label="Salin semua nomor rekening dan provider"
      className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold shadow-xs transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
        copied
          ? 'border-emerald-300 text-emerald-700'
          : 'text-slate-700 hover:text-slate-950'
      } ${className}`}
      onClick={() => void handleCopy()}
      title="Salin semua informasi rekening dompet"
      type="button"
    >
      {copied ? (
        <>
          <svg
            aria-hidden="true"
            className="size-3.5 text-emerald-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              d="m4.5 12.75 6 6 9-13.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-emerald-700">Tersalin!</span>
        </>
      ) : (
        <>
          <svg
            aria-hidden="true"
            className="size-3.5 text-slate-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Salin Semua</span>
        </>
      )}
    </button>
  )
}
