import { useMemo, useState } from 'react'

import { CategoryIcon } from '../../categories/components/CategoryIcon'
import { useBalancePrivacy } from '../../preferences/context/useBalancePrivacy'
import { formatMoney } from '../../wallets/utils/money'

export interface CategoryBreakdownItem {
  amount: string
  color: string
  count: number
  icon: string
  id: string
  name: string
  percentage: number
}

interface CategoryDonutChartProps {
  emptyMessage?: string
  items: readonly CategoryBreakdownItem[]
  kind: 'expense' | 'income'
  totalAmount: string
  totalCount: number
}

export function CategoryDonutChart({
  emptyMessage,
  items,
  kind,
  totalAmount,
  totalCount,
}: CategoryDonutChartProps) {
  const { isHidden } = useBalancePrivacy()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const isExpense = kind === 'expense'
  const isZero = BigInt(totalAmount || '0') <= 0n || items.length === 0

  // SVG Donut geometry
  const size = 200
  const center = size / 2
  const strokeWidth = 26
  const radius = center - strokeWidth / 2 - 8
  const circumference = 2 * Math.PI * radius

  // Calculate segments
  const segments = useMemo(() => {
    if (isZero) return []

    let accumulatedOffset = 0
    return items.map((item) => {
      // Ensure percentage between 0 and 100
      const pct = Math.max(0, Math.min(100, item.percentage))
      const dashLength = (pct / 100) * circumference
      const offset = accumulatedOffset
      accumulatedOffset += dashLength

      return {
        ...item,
        dashArray: `${dashLength} ${circumference - dashLength}`,
        dashOffset: -offset,
      }
    })
  }, [items, circumference, isZero])

  const defaultEmptyMsg = isExpense
    ? 'Belum ada pengeluaran pada periode ini.'
    : 'Belum ada pemasukan pada periode ini.'

  return (
    <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-between">
      {/* Chart visualization */}
      <div className="relative flex shrink-0 flex-col items-center">
        <svg
          aria-label={`Donut chart ${isExpense ? 'pengeluaran' : 'pemasukan'}`}
          className="size-48 sm:size-52"
          role="img"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Base track circle */}
          <circle
            cx={center}
            cy={center}
            fill="transparent"
            r={radius}
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          {segments.map((seg) => {
            const isHovered = hoveredId === seg.id
            return (
              <circle
                cx={center}
                cy={center}
                fill="transparent"
                key={seg.id}
                onMouseEnter={() => setHoveredId(seg.id)}
                onMouseLeave={() => setHoveredId(null)}
                r={radius}
                stroke={seg.color}
                strokeDasharray={seg.dashArray}
                strokeDashoffset={seg.dashOffset}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                style={{
                  cursor: 'pointer',
                  transform: `rotate(-90deg ${center}px ${center}px)`,
                  transition: 'stroke-width 0.15s ease',
                }}
              />
            )
          })}
        </svg>

        {/* Center hole summary */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase sm:text-xs">
            {isExpense ? 'Total Pengeluaran' : 'Total Pemasukan'}
          </span>
          <p
            className={`mt-0.5 text-base font-extrabold tracking-tight sm:text-lg ${
              isExpense ? 'text-rose-700' : 'text-emerald-700'
            }`}
          >
            {isExpense ? '-' : '+'}
            {formatMoney(totalAmount, { hide: isHidden })}
          </p>
          <span className="text-[10px] text-slate-500 sm:text-xs">
            {totalCount} Transaksi
          </span>
        </div>
      </div>

      {/* Breakdown list & legend */}
      <div className="w-full flex-1">
        {isZero ? (
          <div className="flex h-full min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
            <p>{emptyMessage || defaultEmptyMsg}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const isHovered = hoveredId === item.id
              return (
                <div
                  className={`rounded-2xl border p-3.5 transition-all ${
                    isHovered
                      ? 'border-slate-300 bg-slate-50 shadow-xs'
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                  key={item.id}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: `${item.color}20`,
                          color: item.color,
                        }}
                      >
                        <CategoryIcon className="size-4" name={item.icon} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 sm:text-sm">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {item.count} transaksi
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className="inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                        style={{
                          backgroundColor: `${item.color}15`,
                          color: item.color,
                        }}
                      >
                        {item.percentage}%
                      </span>
                      <p
                        className={`text-xs font-bold sm:text-sm ${
                          isExpense ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {isExpense ? '-' : '+'}
                        {formatMoney(item.amount, { hide: isHidden })}
                      </p>
                    </div>
                  </div>

                  {/* Visual percentage progress bar */}
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: item.color,
                        width: `${item.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
