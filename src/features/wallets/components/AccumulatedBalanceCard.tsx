import { useContext, useEffect, useState } from 'react'

import { TransactionServiceContext } from '../../transactions/context/transaction-service-context'
import type { FinancialRecapSummary } from '../../transactions/utils/recap'
import {
  calculateAccumulatedBalance,
  calculateRecap,
  getMtdRange,
} from '../../transactions/utils/recap'
import { WalletServiceContext } from '../context/wallet-service-context'
import type { WalletSummary } from '../types'
import { formatMoney } from '../utils/money'

export function AccumulatedBalanceCard() {
  const walletService = useContext(WalletServiceContext)
  const transactionService = useContext(TransactionServiceContext)

  const [wallets, setWallets] = useState<WalletSummary[]>([])
  const [mtdRecap, setMtdRecap] = useState<FinancialRecapSummary | null>(null)
  const [loading, setLoading] = useState(Boolean(walletService))

  useEffect(() => {
    let active = true

    if (!walletService) {
      return
    }

    const mtdRange = getMtdRange()
    const txPromise = transactionService
      ? transactionService.listTransactionsByDateRange(
          mtdRange.startDate,
          mtdRange.endDate,
        )
      : Promise.resolve([])

    void Promise.all([walletService.listWallets('active'), txPromise])
      .then(([walletList, transactions]) => {
        if (!active) {
          return
        }
        setWallets(walletList)
        setMtdRecap(calculateRecap(transactions))
      })
      .catch(() => {
        // Safe degrade without crashing UI
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [walletService, transactionService])

  const totalBalance = calculateAccumulatedBalance(wallets)

  return (
    <div
      aria-label="Accumulated balance and MTD recap"
      className="relative overflow-hidden rounded-3xl border border-teal-900/30 bg-gradient-to-br from-slate-950 via-teal-950/90 to-slate-900 p-6 text-white shadow-xl sm:p-8"
    >
      {/* Decorative ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-teal-500/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-20 size-64 rounded-full bg-emerald-500/10 blur-3xl"
      />

      {/* Top Header: Total Balance */}
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider text-teal-300 uppercase">
              Total Saldo Terkumpul
            </span>
            <span className="rounded-full bg-teal-500/20 px-2.5 py-0.5 text-[11px] font-medium text-teal-200">
              {wallets.length} Dompet Aktif
            </span>
          </div>

          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {loading ? 'Memuat saldo…' : formatMoney(totalBalance)}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Akumulasi dari seluruh dompet aktif Anda
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="my-6 border-t border-white/10" />

      {/* MTD Recap Section */}
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
            Rekap Bulan Berjalan (MTD)
          </p>
          <span className="text-[11px] text-slate-400">
            {new Intl.DateTimeFormat('id-ID', {
              month: 'long',
              year: 'numeric',
            }).format(new Date())}
          </span>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* MTD Income */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/30 p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-300">
                Pemasukan MTD
              </span>
              <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <svg
                  aria-hidden="true"
                  className="size-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </span>
            </div>
            <p className="mt-1.5 text-lg font-bold text-emerald-400">
              {loading ? '…' : `+${formatMoney(mtdRecap?.incomeTotal ?? '0')}`}
            </p>
            <p className="text-[11px] text-emerald-300/70">
              {mtdRecap?.incomeCount ?? 0} transaksi masuk
            </p>
          </div>

          {/* MTD Expense */}
          <div className="rounded-2xl border border-rose-500/20 bg-rose-950/30 p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-rose-300">
                Pengeluaran MTD
              </span>
              <span className="flex size-5 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                <svg
                  aria-hidden="true"
                  className="size-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 5v14M19 12l-7 7-7-7" />
                </svg>
              </span>
            </div>
            <p className="mt-1.5 text-lg font-bold text-rose-400">
              {loading ? '…' : `-${formatMoney(mtdRecap?.expenseTotal ?? '0')}`}
            </p>
            <p className="text-[11px] text-rose-300/70">
              {mtdRecap?.expenseCount ?? 0} transaksi keluar
            </p>
          </div>

          {/* MTD Net */}
          <div className="rounded-2xl border border-teal-500/20 bg-teal-950/30 p-3.5 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-teal-300">
                Selisih Arus Kas MTD
              </span>
              <span className="text-xs text-teal-400">
                {BigInt(mtdRecap?.netDifference ?? '0') >= 0n
                  ? 'Surplus'
                  : 'Defisit'}
              </span>
            </div>
            <p
              className={`mt-1.5 text-lg font-bold ${
                BigInt(mtdRecap?.netDifference ?? '0') >= 0n
                  ? 'text-teal-300'
                  : 'text-rose-400'
              }`}
            >
              {loading
                ? '…'
                : `${BigInt(mtdRecap?.netDifference ?? '0') >= 0n ? '+' : ''}${formatMoney(
                    mtdRecap?.netDifference ?? '0',
                  )}`}
            </p>
            <p className="text-[11px] text-teal-300/70">
              Total surplus / defisit bulan ini
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
