import type { SupabaseClient } from '@supabase/supabase-js'

import { getSupabaseClient } from '../../../lib/supabase/client'
import type { Database } from '../../../types/database'
import {
  walletTypes,
  type CreateWalletInput,
  type WalletDetail,
  type WalletListMode,
  type WalletMetadataInput,
  type WalletService,
  type WalletSummary,
  type WalletType,
} from '../types'
import { SafeWalletError } from './wallet-errors'

type WalletBalanceRow = Database['public']['Views']['wallet_balances']['Row']
type WalletOpeningRow =
  Database['public']['Views']['wallet_opening_balances']['Row']

function isWalletType(value: string): value is WalletType {
  return walletTypes.some((type) => type === value)
}

function toWalletSummary(row: WalletBalanceRow): WalletSummary {
  if (!isWalletType(row.type)) {
    throw new SafeWalletError('This wallet contains an unsupported type.')
  }

  return {
    archivedAt: row.archived_at,
    balance: row.balance,
    createdAt: row.created_at,
    id: row.wallet_id,
    institution: row.institution,
    name: row.name,
    type: row.type,
    updatedAt: row.updated_at,
  }
}

function assertSafeMoney(value: number) {
  if (!Number.isSafeInteger(value)) {
    throw new SafeWalletError(
      'The wallet amount must be a whole number in the supported range.',
    )
  }
}

function requestError(operation: string) {
  return new SafeWalletError(
    `Uangara could not ${operation}. Check your connection and try again.`,
  )
}

export function createSupabaseWalletService(
  client: SupabaseClient<Database>,
): WalletService {
  return {
    async listWallets(mode: WalletListMode) {
      let query = client
        .from('wallet_balances')
        .select(
          'wallet_id,user_id,name,type,institution,archived_at,created_at,updated_at,balance',
        )
        .order('created_at', { ascending: false })

      query =
        mode === 'active'
          ? query.is('archived_at', null)
          : query.not('archived_at', 'is', null)

      const { data, error } = await query

      if (error) {
        throw requestError('load your wallets')
      }

      return data.map(toWalletSummary)
    },

    async getWallet(walletId: string) {
      const walletResult = await client
        .from('wallet_balances')
        .select(
          'wallet_id,user_id,name,type,institution,archived_at,created_at,updated_at,balance',
        )
        .eq('wallet_id', walletId)
        .maybeSingle()

      if (walletResult.error) {
        throw requestError('load this wallet')
      }

      if (!walletResult.data) {
        return null
      }

      const openingResult = await client
        .from('wallet_opening_balances')
        .select(
          'wallet_id,user_id,transaction_id,movement_id,opening_balance,occurred_at',
        )
        .eq('wallet_id', walletId)
        .maybeSingle()

      if (openingResult.error || !openingResult.data) {
        throw new SafeWalletError(
          'This wallet does not have a valid opening balance record.',
        )
      }

      const opening: WalletOpeningRow = openingResult.data

      return {
        ...toWalletSummary(walletResult.data),
        openingBalance: opening.opening_balance,
        openingOccurredAt: opening.occurred_at,
      } satisfies WalletDetail
    },

    async createWallet(input: CreateWalletInput) {
      assertSafeMoney(input.openingBalance)

      const { data, error } = await client.rpc('create_wallet', {
        p_institution: input.institution,
        p_name: input.name,
        p_opening_balance: input.openingBalance,
        p_wallet_type: input.type,
      })

      if (error || !data) {
        throw requestError('create the wallet')
      }

      return data
    },

    async updateMetadata(walletId: string, input: WalletMetadataInput) {
      const { data, error } = await client
        .from('wallets')
        .update({
          institution: input.institution,
          name: input.name,
          type: input.type,
        })
        .eq('id', walletId)
        .is('archived_at', null)
        .select('id')
        .maybeSingle()

      if (error) {
        throw requestError('update the wallet details')
      }

      if (!data) {
        throw new SafeWalletError('This wallet is not available for editing.')
      }
    },

    async updateOpeningBalance(walletId: string, openingBalance: number) {
      assertSafeMoney(openingBalance)

      const { error } = await client.rpc('update_wallet_opening_balance', {
        p_opening_balance: openingBalance,
        p_wallet_id: walletId,
      })

      if (error) {
        throw requestError('update the opening balance')
      }
    },

    async archiveWallet(walletId: string) {
      const { error } = await client.rpc('archive_wallet', {
        p_wallet_id: walletId,
      })

      if (error) {
        throw requestError('archive the wallet')
      }
    },

    async restoreWallet(walletId: string) {
      const { error } = await client.rpc('restore_wallet', {
        p_wallet_id: walletId,
      })

      if (error) {
        throw requestError('restore the wallet')
      }
    },
  }
}

let defaultWalletService: WalletService | undefined

export function getDefaultWalletService() {
  defaultWalletService ??= createSupabaseWalletService(getSupabaseClient())
  return defaultWalletService
}
