import { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router'

import { FinancialRecapSection } from '../../transactions/components/FinancialRecapSection'
import { AccumulatedBalanceCard } from '../../wallets/components/AccumulatedBalanceCard'
import { CopyAllWalletsButton } from '../../wallets/components/CopyAllWalletsButton'
import { WalletCard } from '../../wallets/components/WalletCard'
import { WalletServiceContext } from '../../wallets/context/wallet-service-context'
import type { WalletSummary } from '../../wallets/types'
import { useAuth } from '../context/useAuth'

export function AuthenticatedHomePage() {
  const { session } = useAuth()
  const walletService = useContext(WalletServiceContext)
  const [wallets, setWallets] = useState<WalletSummary[]>([])
  const [loadingWallets, setLoadingWallets] = useState(Boolean(walletService))

  useEffect(() => {
    let active = true

    if (!walletService) {
      return
    }

    void walletService
      .listWallets('active')
      .then((data) => {
        if (active) {
          setWallets(data)
        }
      })
      .catch(() => {
        // Safe degrade
      })
      .finally(() => {
        if (active) {
          setLoadingWallets(false)
        }
      })

    return () => {
      active = false
    }
  }, [walletService])

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-brand-700 text-xs font-semibold tracking-wider uppercase">
            Private application area
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Your money locations start here.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Pantau akumulasi saldo, rekap pemasukan & pengeluaran, serta kelola
            dompet Anda secara aman.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            className="bg-brand-700 hover:bg-brand-800 inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition"
            to="/app/transactions/new"
          >
            + Transaksi
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 shadow-sm transition"
            to="/app/wallets"
          >
            View wallets
          </Link>
        </div>
      </div>

      {/* Hero: Balance Accumulation & MTD Recap Card */}
      <div className="mt-8">
        <AccumulatedBalanceCard />
      </div>

      {/* Interactive Financial Recap Section */}
      <FinancialRecapSection />

      {/* My Wallets Preview Section */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-950">
              Dompet Saya
            </h2>
            <p className="text-xs text-slate-500">
              Kartu rekening bank, e-wallet, dan tempat penyimpanan uang Anda
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!loadingWallets && wallets.length > 0 ? (
              <CopyAllWalletsButton wallets={wallets} />
            ) : null}
            <Link
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
              to="/app/wallets/new"
            >
              + Tambah Dompet
            </Link>
            <Link
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              to="/app/wallets"
            >
              Lihat Semua
            </Link>
          </div>
        </div>

        {loadingWallets ? (
          <div
            className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500"
            role="status"
          >
            Memuat dompet…
          </div>
        ) : null}

        {!loadingWallets && wallets.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <h3 className="font-semibold text-slate-900">Belum ada dompet</h3>
            <p className="mt-1 text-xs text-slate-500">
              Tambahkan rekening bank atau e-wallet pertama Anda.
            </p>
            <Link
              className="bg-brand-700 hover:bg-brand-800 mt-4 inline-flex items-center rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm"
              to="/app/wallets/new"
            >
              Tambah Dompet Sekarang
            </Link>
          </div>
        ) : null}

        {!loadingWallets && wallets.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {wallets.map((wallet) => (
              <WalletCard key={wallet.id} wallet={wallet} />
            ))}
          </div>
        ) : null}
      </div>

      {/* Footnote / Session info */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <Link
            className="hover:text-slate-900 underline"
            to="/app/transactions"
          >
            View transactions
          </Link>
          <span>·</span>
          <Link className="hover:text-slate-900 underline" to="/app/wallets">
            View wallets
          </Link>
        </div>

        {session?.user.email ? (
          <p>
            Signed in as{' '}
            <span className="font-semibold text-slate-800">
              {session.user.email}
            </span>
          </p>
        ) : null}
      </div>
    </section>
  )
}
