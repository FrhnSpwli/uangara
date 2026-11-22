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
        className={`flex items-center justify-center rounded-xl bg-[#00529C] font-black tracking-tight text-white shadow-sm ${className}`}
      >
        <span className="text-xs font-black tracking-wider">BCA</span>
      </div>
    )
  }

  // 2. Bank Mandiri
  if (normInst.includes('mandiri') || normName.includes('mandiri')) {
    return (
      <div
        aria-label="Bank Mandiri Logo"
        className={`flex items-center justify-center overflow-hidden rounded-xl bg-[#003d79] text-white shadow-sm ${className}`}
      >
        <div className="flex flex-col items-center leading-none">
          <span className="text-[10px] font-bold tracking-tight text-[#FFB700]">
            mandırı
          </span>
        </div>
      </div>
    )
  }

  // 3. BNI
  if (normInst.includes('bni') || normName.includes('bni')) {
    return (
      <div
        aria-label="BNI Logo"
        className={`flex items-center justify-center rounded-xl bg-[#005E6A] font-bold text-[#F15A24] shadow-sm ${className}`}
      >
        <span className="text-xs font-black tracking-wider text-white">
          BNI<span className="text-[#F15A24] font-black">46</span>
        </span>
      </div>
    )
  }

  // 4. BRI
  if (normInst.includes('bri') || normName.includes('bri')) {
    return (
      <div
        aria-label="BRI Logo"
        className={`flex items-center justify-center rounded-xl bg-[#00529C] font-black text-white shadow-sm ${className}`}
      >
        <span className="text-xs font-black tracking-wider">BRI</span>
      </div>
    )
  }

  // 5. Bank Jago
  if (normInst.includes('jago') || normName.includes('jago')) {
    return (
      <div
        aria-label="Bank Jago Logo"
        className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6600] to-[#E65100] font-black text-white shadow-sm ${className}`}
      >
        <span className="text-xs font-extrabold tracking-wide">jago</span>
      </div>
    )
  }

  // 6. SeaBank
  if (normInst.includes('seabank') || normName.includes('seabank')) {
    return (
      <div
        aria-label="SeaBank Logo"
        className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-[#FF5722] to-[#F4511E] font-black text-white shadow-sm ${className}`}
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
        className={`flex items-center justify-center rounded-xl bg-[#7D0014] font-black text-white shadow-sm ${className}`}
      >
        <span className="text-[10px] font-extrabold tracking-wider">CIMB</span>
      </div>
    )
  }

  // 8. BTN
  if (normInst.includes('btn') || normName.includes('btn')) {
    return (
      <div
        aria-label="BTN Logo"
        className={`flex items-center justify-center rounded-xl bg-[#002D72] font-black text-[#FDB913] shadow-sm ${className}`}
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
        className={`flex items-center justify-center rounded-xl bg-[#00A39D] font-black text-white shadow-sm ${className}`}
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
        className={`flex items-center justify-center rounded-xl bg-[#00AED6] font-bold text-white shadow-sm ${className}`}
      >
        <span className="text-xs font-black tracking-tight">
          go<span className="text-[#A4E033]">pay</span>
        </span>
      </div>
    )
  }

  // 11. DANA
  if (normInst.includes('dana') || normName.includes('dana')) {
    return (
      <div
        aria-label="DANA Logo"
        className={`flex items-center justify-center rounded-xl bg-[#118EEA] font-black text-white shadow-sm ${className}`}
      >
        <span className="text-xs font-extrabold tracking-wider">DANA</span>
      </div>
    )
  }

  // 12. OVO
  if (normInst.includes('ovo') || normName.includes('ovo')) {
    return (
      <div
        aria-label="OVO Logo"
        className={`flex items-center justify-center rounded-xl bg-[#4C3494] font-black text-white shadow-sm ${className}`}
      >
        <span className="text-xs font-black tracking-widest text-[#9C7AEB]">
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
        className={`flex items-center justify-center rounded-xl bg-[#EE4D2D] font-bold text-white shadow-sm ${className}`}
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
        className={`flex items-center justify-center rounded-xl bg-[#ED1C24] font-black text-white shadow-sm ${className}`}
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
        className={`flex items-center justify-center rounded-xl bg-gradient-to-r from-[#00529C] to-[#E31E24] font-black text-white shadow-sm ${className}`}
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
        className={`flex items-center justify-center rounded-xl bg-[#F15A24] font-bold text-white shadow-sm ${className}`}
      >
        <span className="text-[10px] font-black tracking-tight">TapCash</span>
      </div>
    )
  }

  // 17. Cash
  if (type === 'cash') {
    return (
      <div
        aria-label="Cash Logo"
        className={`flex items-center justify-center rounded-xl bg-emerald-600 font-bold text-white shadow-sm ${className}`}
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
      className={`flex items-center justify-center rounded-xl font-bold uppercase shadow-sm ${fallbackBg} ${className}`}
    >
      <span className="text-xs font-bold tracking-wider">
        {initials || 'WA'}
      </span>
    </div>
  )
}
