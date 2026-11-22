import { type MouseEvent, useState } from 'react'
import { Link } from 'react-router'

import { useBalancePrivacy } from '../../preferences/context/useBalancePrivacy'
import type { WalletSummary } from '../types'
import { copyToClipboard, formatSingleWalletCopy } from '../utils/clipboard'
import { formatMoney } from '../utils/money'
import { getWalletTypeLabel } from '../utils/validation'
import { WalletBrandLogo } from './WalletBrandLogo'
import { WalletTypeIcon } from './WalletTypeIcon'

interface WalletCardProps {
  wallet: WalletSummary
}

function getCardTheme(wallet: WalletSummary): string {
  const norm = ((wallet.institution ?? '') + ' ' + wallet.name).toLowerCase()

  if (norm.includes('bca')) {
    return 'bg-gradient-to-br from-[#002244] via-[#003870] to-[#001830] text-white border-blue-900/40'
  }
  if (norm.includes('mandiri')) {
    return 'bg-gradient-to-br from-[#001E3D] via-[#002E5C] to-[#001429] text-white border-sky-900/40'
  }
  if (norm.includes('bni')) {
    return 'bg-gradient-to-br from-[#002D33] via-[#004750] to-[#001B1E] text-white border-teal-900/40'
  }
  if (norm.includes('bri')) {
    return 'bg-gradient-to-br from-[#00264D] via-[#003B75] to-[#00172E] text-white border-blue-900/40'
  }
  if (norm.includes('jago')) {
    return 'bg-gradient-to-br from-[#331400] via-[#5C2400] to-[#210D00] text-white border-amber-900/40'
  }
  if (norm.includes('seabank')) {
    return 'bg-gradient-to-br from-[#331105] via-[#541E0A] to-[#210B03] text-white border-orange-900/40'
  }
  if (norm.includes('cimb')) {
    return 'bg-gradient-to-br from-[#330008] via-[#4D000C] to-[#210005] text-white border-rose-900/40'
  }
  if (norm.includes('gopay')) {
    return 'bg-gradient-to-br from-[#00242D] via-[#003B4A] to-[#00161C] text-white border-cyan-900/40'
  }
  if (norm.includes('dana')) {
    return 'bg-gradient-to-br from-[#052238] via-[#0A375C] to-[#031524] text-white border-sky-900/40'
  }
  if (norm.includes('ovo')) {
    return 'bg-gradient-to-br from-[#1F103D] via-[#321B63] to-[#140A29] text-white border-purple-900/40'
  }
  if (norm.includes('shopee')) {
    return 'bg-gradient-to-br from-[#381109] via-[#591B0E] to-[#240B06] text-white border-orange-900/40'
  }
  if (wallet.type === 'cash') {
    return 'bg-gradient-to-br from-[#062D1E] via-[#0A4730] to-[#041C13] text-white border-emerald-900/40'
  }

  return 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white border-slate-700/40'
}

function getAccountLabel(type: WalletSummary['type']): string {
  switch (type) {
    case 'bank':
      return 'No. Rekening'
    case 'e_wallet':
      return 'No. Akun / HP'
    case 'e_money':
      return 'No. Kartu'
    case 'cash':
    case 'other':
    default:
      return 'Nama Dompet'
  }
}

export function WalletCard({ wallet }: WalletCardProps) {
  const { isHidden } = useBalancePrivacy()
  const [copied, setCopied] = useState(false)
  const themeClass = getCardTheme(wallet)
  const isBankOrCard = wallet.type === 'bank' || wallet.type === 'e_money'
  const accountLabel = getAccountLabel(wallet.type)

  const handleCopy = async (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const text = formatSingleWalletCopy(wallet)
    const success = await copyToClipboard(text)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Link
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-6 ${themeClass}`}
      to={`/app/wallets/${wallet.id}`}
    >
      {/* Decorative background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full bg-white/5 blur-2xl transition group-hover:bg-white/10"
      />

      {/* Top Header: Brand Logo + Institution & Wallet Type Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <WalletBrandLogo
            institution={wallet.institution}
            name={wallet.name}
            type={wallet.type}
          />
          <div>
            <h2 className="text-base font-bold tracking-tight text-white sm:text-lg">
              {wallet.institution || wallet.name}
            </h2>
            <p className="text-xs text-white/70">
              {getWalletTypeLabel(wallet.type)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {wallet.archivedAt ? (
            <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-semibold text-rose-300 backdrop-blur-sm">
              Archived
            </span>
          ) : null}
          <div
            aria-label={getWalletTypeLabel(wallet.type)}
            className="flex items-center justify-center rounded-lg bg-white/10 p-1.5 text-white/80 backdrop-blur-sm"
          >
            <WalletTypeIcon className="size-4" type={wallet.type} />
          </div>
        </div>
      </div>

      {/* Center: Chip for cards & Account Number */}
      <div className="mt-6 flex items-center justify-between gap-3">
        {isBankOrCard ? (
          <div
            aria-hidden="true"
            className="relative flex h-7 w-9 items-center justify-center rounded-md border border-amber-300/40 bg-gradient-to-tr from-amber-400/80 via-amber-200/90 to-amber-300/80 shadow-inner"
          >
            <div className="h-4 w-6 rounded-sm border border-amber-600/30" />
            <div className="absolute left-1/2 top-0 h-full w-px bg-amber-700/30" />
            <div className="absolute left-0 top-1/2 h-px w-full bg-amber-700/30" />
          </div>
        ) : (
          <div className="h-7" />
        )}

        <div className="text-right">
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/60">
            {accountLabel}
          </span>
          <div className="mt-0.5 flex items-center justify-end gap-1.5">
            <p className="font-mono text-sm font-semibold tracking-wide text-white/95 sm:text-base">
              {wallet.name}
            </p>
            <button
              aria-label={`Salin nomor ${wallet.institution || wallet.name}`}
              className={`inline-flex items-center justify-center rounded-md p-1 transition focus:outline-none focus:ring-2 focus:ring-white/40 ${
                copied
                  ? 'bg-emerald-500/30 text-emerald-300'
                  : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
              }`}
              onClick={(e) => void handleCopy(e)}
              title={copied ? 'Tersalin!' : 'Salin nomor & provider'}
              type="button"
            >
              {copied ? (
                <svg
                  aria-hidden="true"
                  className="size-3.5"
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
              ) : (
                <svg
                  aria-hidden="true"
                  className="size-3.5"
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
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom: Current Balance */}
      <div className="mt-5 border-t border-white/10 pt-4">
        <span className="text-[11px] font-medium uppercase tracking-wider text-white/60">
          Saldo
        </span>
        <p className="mt-0.5 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
          {formatMoney(wallet.balance, { hide: isHidden })}
        </p>
      </div>
    </Link>
  )
}
