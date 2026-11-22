import type { WalletType } from '../types'

interface WalletBrandLogoProps {
  className?: string
  institution: string | null
  name: string
  type: WalletType
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

export function WalletBrandLogo({
  className = 'size-10',
  institution,
  name,
  type,
}: WalletBrandLogoProps) {
  const normInst = normalize(institution)
  const normName = normalize(name)

  // 1. Bank Central Asia (BCA)
  if (normInst.includes('bca') || normName.includes('bca')) {
    return (
      <div
        aria-label="BCA Logo"
        className={`flex items-center justify-center rounded-xl bg-[#0060AF] text-white shadow-sm ring-1 ring-black/5 ${className}`}
      >
        <div className="flex flex-col items-center justify-center">
          <span className="text-xs font-black tracking-wider text-white">
            BCA
          </span>
          <div className="mt-0.5 flex gap-0.5">
            <span className="h-0.5 w-2 rounded-full bg-white/70" />
            <span className="h-0.5 w-1 rounded-full bg-cyan-300" />
          </div>
        </div>
      </div>
    )
  }

  // 2. Bank Mandiri
  if (normInst.includes('mandiri') || normName.includes('mandiri')) {
    return (
      <div
        aria-label="Bank Mandiri Logo"
        className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-[#003D79] text-white shadow-sm ring-1 ring-black/5 ${className}`}
      >
        {/* Mandiri golden liquid ribbon accent */}
        <div
          aria-hidden="true"
          className="absolute -right-2 -top-2 size-6 rounded-full bg-[#FFB300]/90 blur-[1px]"
        />
        <div className="relative flex flex-col items-center leading-none">
          <span className="text-[11px] font-extrabold tracking-tight text-[#FFB300]">
            mandırı
          </span>
          <span className="text-[7px] font-medium tracking-widest text-white/80 uppercase">
            bank
          </span>
        </div>
      </div>
    )
  }

  // 3. BNI (Bank Negara Indonesia 46)
  if (normInst.includes('bni') || normName.includes('bni')) {
    return (
      <div
        aria-label="BNI Logo"
        className={`flex items-center justify-center rounded-xl bg-[#005E6A] text-white shadow-sm ring-1 ring-black/5 ${className}`}
      >
        <div className="flex items-center gap-0.5">
          <span className="text-xs font-black tracking-wider text-white">
            BNI
          </span>
          <span className="rounded bg-[#F15A23] px-1 py-0.5 text-[9px] font-black text-white">
            46
          </span>
        </div>
      </div>
    )
  }

  // 4. BRI (Bank Rakyat Indonesia)
  if (normInst.includes('bri') || normName.includes('bri')) {
    return (
      <div
        aria-label="BRI Logo"
        className={`flex items-center justify-center rounded-xl bg-[#0857C3] font-black text-white shadow-sm ring-1 ring-black/5 ${className}`}
      >
        <div className="flex flex-col items-center">
          <span className="text-xs font-black tracking-wider">BRI</span>
          <div className="mt-0.5 h-0.5 w-4 rounded-full bg-[#71C5EB]" />
        </div>
      </div>
    )
  }

  // 5. Bank Jago
  if (normInst.includes('jago') || normName.includes('jago')) {
    return (
      <div
        aria-label="Bank Jago Logo"
        className={`flex items-center justify-center rounded-xl bg-[#FF6600] font-black text-white shadow-sm ring-1 ring-black/5 ${className}`}
      >
        <span className="text-xs font-extrabold tracking-wide lowercase">
          jago
        </span>
      </div>
    )
  }

  // 6. SeaBank
  if (normInst.includes('seabank') || normName.includes('seabank')) {
    return (
      <div
        aria-label="SeaBank Logo"
        className={`flex items-center justify-center rounded-xl bg-[#FF5722] font-black text-white shadow-sm ring-1 ring-black/5 ${className}`}
      >
        <span className="text-[10px] font-black tracking-tight">SeaBank</span>
      </div>
    )
  }

  // 7. CIMB Niaga
  if (normInst.includes('cimb') || normName.includes('cimb')) {
    return (
      <div
        aria-label="CIMB Niaga Logo"
        className={`flex items-center justify-center rounded-xl bg-[#7D0014] font-black text-white shadow-sm ring-1 ring-black/5 ${className}`}
      >
        <div className="flex items-center gap-1">
          <span className="text-[#ED1C24] font-black">▶</span>
          <span className="text-[10px] font-extrabold tracking-wider">
            CIMB
          </span>
        </div>
      </div>
    )
  }

  // 8. BTN (Bank Tabungan Negara)
  if (normInst.includes('btn') || normName.includes('btn')) {
    return (
      <div
        aria-label="BTN Logo"
        className={`flex items-center justify-center rounded-xl bg-[#002D72] font-black text-white shadow-sm ring-1 ring-black/5 ${className}`}
      >
        <span className="text-xs font-black tracking-wider text-white">
          B<span className="text-[#FDB913]">T</span>N
        </span>
      </div>
    )
  }

  // 9. Bank Syariah Indonesia (BSI)
  if (normInst.includes('bsi') || normInst.includes('syariah indonesia')) {
    return (
      <div
        aria-label="BSI Logo"
        className={`flex items-center justify-center rounded-xl bg-[#00A39D] font-black text-white shadow-sm ring-1 ring-black/5 ${className}`}
      >
        <span className="text-xs font-black tracking-wider">
          BSI<span className="text-[#E5A823]">✦</span>
        </span>
      </div>
    )
  }

  // 10. GoPay
  if (normInst.includes('gopay') || normName.includes('gopay')) {
    return (
      <div
        aria-label="GoPay Logo"
        className={`flex items-center justify-center rounded-xl bg-[#00AED6] font-bold text-white shadow-sm ring-1 ring-black/5 ${className}`}
      >
        <div className="flex items-center">
          <span className="text-xs font-black tracking-tight">go</span>
          <span className="text-xs font-black tracking-tight text-[#9BF500]">
            pay
          </span>
        </div>
      </div>
    )
  }

  // 11. DANA
  if (normInst.includes('dana') || normName.includes('dana')) {
    return (
      <div
        aria-label="DANA Logo"
        className={`flex items-center justify-center rounded-xl bg-[#118EEA] font-black text-white shadow-sm ring-1 ring-black/5 ${className}`}
      >
        <div className="flex items-center gap-0.5">
          <span className="text-[11px] font-extrabold tracking-wider">
            DANA
          </span>
        </div>
      </div>
    )
  }

  // 12. OVO
  if (normInst.includes('ovo') || normName.includes('ovo')) {
    return (
      <div
        aria-label="OVO Logo"
        className={`flex items-center justify-center rounded-xl bg-[#4C3494] font-black text-white shadow-sm ring-1 ring-black/5 ${className}`}
      >
        <span className="text-xs font-black tracking-widest text-[#B497FF]">
          O<span className="text-white">V</span>O
        </span>
      </div>
    )
  }

  // 13. ShopeePay
  if (normInst.includes('shopee') || normName.includes('shopee')) {
    return (
      <div
        aria-label="ShopeePay Logo"
        className={`flex items-center justify-center rounded-xl bg-[#EE4D2D] font-bold text-white shadow-sm ring-1 ring-black/5 ${className}`}
      >
        <span className="text-[10px] font-black tracking-tight">ShopeePay</span>
      </div>
    )
  }

  // 14. LinkAja
  if (normInst.includes('linkaja') || normName.includes('linkaja')) {
    return (
      <div
        aria-label="LinkAja Logo"
        className={`flex items-center justify-center rounded-xl bg-[#ED1C24] font-black text-white shadow-sm ring-1 ring-black/5 ${className}`}
      >
        <span className="text-[10px] font-black tracking-tight">LinkAja!</span>
      </div>
    )
  }

  // 15. Flazz
  if (normInst.includes('flazz') || normName.includes('flazz')) {
    return (
      <div
        aria-label="Flazz Logo"
        className={`flex items-center justify-center rounded-xl bg-gradient-to-r from-[#00529C] to-[#E31E24] font-black text-white shadow-sm ring-1 ring-black/5 ${className}`}
      >
        <span className="text-[10px] font-black italic tracking-wide">
          Flazz
        </span>
      </div>
    )
  }

  // 16. TapCash
  if (normInst.includes('tapcash') || normName.includes('tapcash')) {
    return (
      <div
        aria-label="TapCash Logo"
        className={`flex items-center justify-center rounded-xl bg-[#F15A24] font-bold text-white shadow-sm ring-1 ring-black/5 ${className}`}
      >
        <span className="text-[10px] font-black tracking-tight">TapCash</span>
      </div>
    )
  }

  // 17. BRIZZI
  if (normInst.includes('brizzi') || normName.includes('brizzi')) {
    return (
      <div
        aria-label="BRIZZI Logo"
        className={`flex items-center justify-center rounded-xl bg-[#0857C3] font-bold text-white shadow-sm ring-1 ring-black/5 ${className}`}
      >
        <span className="text-[10px] font-black tracking-tight">BRIZZI</span>
      </div>
    )
  }

  // 18. Mandiri e-Money
  if (normInst.includes('e-money') || normName.includes('e-money')) {
    return (
      <div
        aria-label="Mandiri e-Money Logo"
        className={`flex items-center justify-center rounded-xl bg-[#003D79] font-bold text-[#FFB300] shadow-sm ring-1 ring-black/5 ${className}`}
      >
        <span className="text-[9px] font-black tracking-tight">e-money</span>
      </div>
    )
  }

  // 19. Cash
  if (type === 'cash') {
    return (
      <div
        aria-label="Cash Logo"
        className={`flex items-center justify-center rounded-xl bg-emerald-600 font-bold text-white shadow-sm ring-1 ring-black/5 ${className}`}
      >
        <svg
          aria-hidden="true"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <rect height="12" rx="2" width="20" x="2" y="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      </div>
    )
  }

  // Fallback monogram
  const initials = (institution || name || type)
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  const fallbackBg =
    type === 'bank'
      ? 'bg-slate-800 text-white'
      : type === 'e_wallet'
        ? 'bg-sky-700 text-white'
        : type === 'e_money'
          ? 'bg-indigo-700 text-white'
          : 'bg-teal-700 text-white'

  return (
    <div
      aria-label={`${institution || name} Logo`}
      className={`flex items-center justify-center rounded-xl font-bold uppercase shadow-sm ring-1 ring-black/5 ${fallbackBg} ${className}`}
    >
      <span className="text-xs font-bold tracking-wider">
        {initials || 'WA'}
      </span>
    </div>
  )
}
