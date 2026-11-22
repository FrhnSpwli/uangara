import { useContext, useEffect, useMemo, useState } from 'react'

import { useBalancePrivacy } from '../../preferences/context/useBalancePrivacy'
import { formatMoney } from '../../wallets/utils/money'
import { TransactionServiceContext } from '../context/transaction-service-context'
import type { FinancialTransactionSummary } from '../types'
import {
  calculateCategoryBreakdown,
  calculateRecap,
  formatDateToInput,
  getCustomRange,
  getMonthRange,
  getTodayRange,
  getWeekRange,
  type RecapPeriod,
} from '../utils/recap'
import { CategoryDonutChart } from './CategoryDonutChart'

export function FinancialRecapSection() {
  const service = useContext(TransactionServiceContext)
  const { isHidden } = useBalancePrivacy()

  const [period, setPeriod] = useState<RecapPeriod>('today')
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return formatDateToInput(d)
  })
  const [customEnd, setCustomEnd] = useState(() =>
    formatDateToInput(new Date()),
  )

  const [transactions, setTransactions] = useState<
    FinancialTransactionSummary[]
  >([])
  const [chartTab, setChartTab] = useState<'expense' | 'income'>('expense')
  const [loading, setLoading] = useState(Boolean(service))
  const [error, setError] = useState<string | null>(null)

  const dateRange = useMemo(() => {
    switch (period) {
      case 'today':
        return getTodayRange()
      case 'weekly':
        return getWeekRange()
      case 'monthly':
        return getMonthRange()
      case 'custom':
        return getCustomRange(customStart, customEnd)
    }
  }, [period, customStart, customEnd])

  function handlePeriodChange(nextPeriod: RecapPeriod) {
    setLoading(true)
    setError(null)
    setPeriod(nextPeriod)
  }

  function handleCustomStartChange(nextStart: string) {
    setLoading(true)
    setError(null)
    setCustomStart(nextStart)
  }

  function handleCustomEndChange(nextEnd: string) {
    setLoading(true)
    setError(null)
    setCustomEnd(nextEnd)
  }

  useEffect(() => {
    let active = true

    if (!service) {
      return
    }

    void service
      .listTransactionsByDateRange(dateRange.startDate, dateRange.endDate)
      .then((data) => {
        if (active) {
          setTransactions(data)
        }
      })
      .catch(() => {
        if (active) {
          setError('Gagal memuat rekap transaksi. Silakan coba lagi.')
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [service, dateRange])

  const recap = useMemo(() => calculateRecap(transactions), [transactions])
  const breakdown = useMemo(
    () => calculateCategoryBreakdown(transactions, chartTab),
    [transactions, chartTab],
  )

  const periodLabels: Record<RecapPeriod, string> = {
    custom: 'Kustom',
    monthly: 'Bulan Ini',
    today: 'Hari Ini',
    weekly: 'Minggu Ini',
  }

  return (
    <section
      aria-label="Financial recap section"
      className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      {/* Title & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-brand-700 uppercase">
            Ringkasan Penggunaan Dana
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            Rekap Keuangan
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Pilih periode untuk melihat pergerakan pemasukan dan pengeluaran.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div
          aria-label="Pilih Periode Rekap"
          className="inline-flex rounded-xl bg-slate-100 p-1"
          role="group"
        >
          {(['today', 'weekly', 'monthly', 'custom'] as const).map((key) => (
            <button
              aria-pressed={period === key}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                period === key
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
              key={key}
              onClick={() => handlePeriodChange(key)}
              type="button"
            >
              {periodLabels[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Pickers */}
      {period === 'custom' ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-200">
          <div className="flex items-center gap-2">
            <label
              className="text-xs font-semibold text-slate-700"
              htmlFor="recap-start-date"
            >
              Dari:
            </label>
            <input
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 shadow-sm focus:border-brand-600 focus:outline-none"
              id="recap-start-date"
              onChange={(e) => handleCustomStartChange(e.target.value)}
              type="date"
              value={customStart}
            />
          </div>
          <div className="flex items-center gap-2">
            <label
              className="text-xs font-semibold text-slate-700"
              htmlFor="recap-end-date"
            >
              Sampai:
            </label>
            <input
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 shadow-sm focus:border-brand-600 focus:outline-none"
              id="recap-end-date"
              onChange={(e) => handleCustomEndChange(e.target.value)}
              type="date"
              value={customEnd}
            />
          </div>
        </div>
      ) : null}

      {/* Error state */}
      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          {error}
        </div>
      ) : null}

      {/* Metric Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {/* Pemasukan Card */}
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-800">
              Total Pemasukan
            </span>
            <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
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
          <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-700">
            {loading
              ? '…'
              : `+${formatMoney(recap.incomeTotal, { hide: isHidden })}`}
          </p>
          <p className="mt-1 text-xs text-emerald-600">
            {recap.incomeCount} transaksi pemasukan
          </p>
        </div>

        {/* Pengeluaran Card */}
        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-800">
              Total Pengeluaran
            </span>
            <span className="flex size-6 items-center justify-center rounded-full bg-rose-100 text-rose-700">
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
          <p className="mt-2 text-2xl font-bold tracking-tight text-rose-700">
            {loading
              ? '…'
              : `-${formatMoney(recap.expenseTotal, { hide: isHidden })}`}
          </p>
          <p className="mt-1 text-xs text-rose-600">
            {recap.expenseCount} pengeluaran
            {recap.transferCount > 0 ? ' (termasuk biaya transfer)' : ''}
          </p>
        </div>

        {/* Selisih Bersih Card */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">
              Selisih Bersih
            </span>
            <span className="text-xs font-semibold text-slate-600">
              {BigInt(recap.netDifference) >= 0n ? 'Surplus' : 'Defisit'}
            </span>
          </div>
          <p
            className={`mt-2 text-2xl font-bold tracking-tight ${
              BigInt(recap.netDifference) >= 0n
                ? 'text-teal-700'
                : 'text-rose-700'
            }`}
          >
            {loading
              ? '…'
              : `${BigInt(recap.netDifference) >= 0n ? '+' : ''}${formatMoney(
                  recap.netDifference,
                  { hide: isHidden },
                )}`}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Arus kas periode {periodLabels[period].toLowerCase()}
          </p>
        </div>
      </div>

      {/* Category Breakdown & Donut Chart Section */}
      <div className="mt-8 border-t border-slate-100 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Distribusi Kategori
            </h3>
            <p className="text-xs text-slate-500">
              Persentase dan nominal pergerakan dana berdasarkan kategori.
            </p>
          </div>

          <div
            aria-label="Pilih Tipe Kategori"
            className="inline-flex self-start rounded-xl bg-slate-100 p-1 sm:self-auto"
            role="tablist"
          >
            <button
              aria-selected={chartTab === 'expense'}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                chartTab === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
              onClick={() => setChartTab('expense')}
              role="tab"
              type="button"
            >
              Pengeluaran
            </button>
            <button
              aria-selected={chartTab === 'income'}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                chartTab === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
              onClick={() => setChartTab('income')}
              role="tab"
              type="button"
            >
              Pemasukan
            </button>
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <p className="text-xs text-slate-500" role="status">
              Memuat grafik kategori…
            </p>
          ) : (
            <CategoryDonutChart
              items={breakdown.items}
              kind={chartTab}
              totalAmount={breakdown.totalAmount}
              totalCount={breakdown.totalCount}
            />
          )}
        </div>
      </div>
    </section>
  )
}
