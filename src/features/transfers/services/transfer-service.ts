import type { SupabaseClient } from '@supabase/supabase-js'

import { getSupabaseClient } from '../../../lib/supabase/client'
import type { Database } from '../../../types/database'
import type { WalletType } from '../../wallets/types'
import type { TransferDetail, TransferInput, TransferService } from '../types'
import { SafeTransferError } from './transfer-errors'

type TransferRow = Database['public']['Views']['transaction_feed']['Row']

function assertSafeTransferMoney(amount: number, fee: number) {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new SafeTransferError(
      'The transfer amount must be a positive whole number in the supported range.',
    )
  }

  if (!Number.isSafeInteger(fee) || fee < 0) {
    throw new SafeTransferError(
      'The transfer fee must be a non-negative whole number in the supported range.',
    )
  }
}

function requestError(operation: string) {
  return new SafeTransferError(
    `Uangara could not ${operation}. Check your connection and try again.`,
  )
}

function rpcInput(input: TransferInput) {
  assertSafeTransferMoney(input.amount, input.fee)

  return {
    p_amount: input.amount,
    p_category_id: input.categoryId ?? null,
    p_description: input.description,
    p_destination_wallet_id: input.destinationWalletId,
    p_fee: input.fee,
    p_notes: input.notes,
    p_occurred_at: input.occurredAt,
    p_source_wallet_id: input.sourceWalletId,
  }
}

function toTransferDetail(row: TransferRow): TransferDetail {
  if (
    row.kind !== 'transfer' ||
    !row.description ||
    !row.source_wallet_id ||
    !row.source_wallet_name ||
    !row.destination_wallet_id ||
    !row.destination_wallet_name
  ) {
    throw new SafeTransferError(
      'This transfer contains an unsupported ledger shape.',
    )
  }

  return {
    amount: row.amount,
    categoryColor: row.category_color,
    categoryIcon: row.category_icon,
    categoryId: row.category_id,
    categoryName: row.category_name,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
    description: row.description,
    destinationWalletArchivedAt: row.destination_wallet_archived_at,
    destinationWalletId: row.destination_wallet_id,
    destinationWalletInstitution: row.destination_wallet_institution,
    destinationWalletName: row.destination_wallet_name,
    destinationWalletType: row.destination_wallet_type as WalletType,
    feeAmount: row.fee_amount,
    id: row.transaction_id,
    notes: row.notes,
    occurredAt: row.occurred_at,
    sourceWalletArchivedAt: row.source_wallet_archived_at,
    sourceWalletId: row.source_wallet_id,
    sourceWalletInstitution: row.source_wallet_institution,
    sourceWalletName: row.source_wallet_name,
    sourceWalletType: row.source_wallet_type as WalletType,
    updatedAt: row.updated_at,
  }
}

const transferSelect =
  'transaction_id,user_id,kind,wallet_id,wallet_name,wallet_institution,wallet_type,wallet_archived_at,source_wallet_id,source_wallet_name,source_wallet_institution,source_wallet_type,source_wallet_archived_at,destination_wallet_id,destination_wallet_name,destination_wallet_institution,destination_wallet_type,destination_wallet_archived_at,category_id,category_name,category_icon,category_color,description,notes,amount,fee_amount,occurred_at,deleted_at,created_at,updated_at'

export function createSupabaseTransferService(
  client: SupabaseClient<Database>,
): TransferService {
  return {
    async createTransfer(input, idempotencyKey) {
      const { data, error } = await client.rpc('create_transfer', {
        ...rpcInput(input),
        p_idempotency_key: idempotencyKey,
      })

      if (error || !data) {
        throw requestError('create the transfer')
      }

      return data
    },

    async getTransfer(transferId) {
      const { data, error } = await client
        .from('transaction_feed')
        .select(transferSelect)
        .eq('transaction_id', transferId)
        .eq('kind', 'transfer')
        .maybeSingle()

      if (error) {
        throw requestError('load this transfer')
      }

      return data ? toTransferDetail(data) : null
    },

    async updateTransfer(transferId, input) {
      const { error } = await client.rpc('update_transfer', {
        ...rpcInput(input),
        p_transaction_id: transferId,
      })

      if (error) {
        throw requestError('update the transfer')
      }
    },

    async softDeleteTransfer(transferId) {
      const { error } = await client.rpc('soft_delete_transfer', {
        p_transaction_id: transferId,
      })

      if (error) {
        throw requestError('delete the transfer')
      }
    },

    async restoreTransfer(transferId) {
      const { error } = await client.rpc('restore_transfer', {
        p_transaction_id: transferId,
      })

      if (error) {
        throw requestError('restore the transfer')
      }
    },
  }
}

let defaultTransferService: TransferService | undefined

export function getDefaultTransferService() {
  defaultTransferService ??= createSupabaseTransferService(getSupabaseClient())
  return defaultTransferService
}
