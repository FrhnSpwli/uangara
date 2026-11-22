import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  copyToClipboard,
  formatAllWalletsCopy,
  formatSingleWalletCopy,
  getWalletEmoji,
} from './clipboard'

describe('clipboard utils', () => {
  describe('getWalletEmoji', () => {
    it('returns appropriate emojis for wallet types', () => {
      expect(getWalletEmoji('bank')).toBe('🏦')
      expect(getWalletEmoji('e_wallet')).toBe('📱')
      expect(getWalletEmoji('e_money')).toBe('💳')
      expect(getWalletEmoji('cash')).toBe('💵')
      expect(getWalletEmoji('other')).toBe('💼')
    })
  })

  describe('formatSingleWalletCopy', () => {
    it('formats a bank wallet with institution and account number', () => {
      const text = formatSingleWalletCopy({
        institution: 'Bank Jago',
        name: '109254920681',
        type: 'bank',
      })
      expect(text).toBe('🏦 Bank Jago\nNo. Rekening: 109254920681')
    })

    it('formats an e-wallet with provider and phone number', () => {
      const text = formatSingleWalletCopy({
        institution: 'ShopeePay',
        name: '081241252656',
        type: 'e_wallet',
      })
      expect(text).toBe('📱 ShopeePay\nNo. Akun/HP: 081241252656')
    })

    it('formats an e-money wallet with card number', () => {
      const text = formatSingleWalletCopy({
        institution: 'Flazz BCA',
        name: '1234567890123456',
        type: 'e_money',
      })
      expect(text).toBe('💳 Flazz BCA\nNo. Kartu: 1234567890123456')
    })

    it('formats a cash wallet when name matches institution', () => {
      const text = formatSingleWalletCopy({
        institution: 'Dompet Kas',
        name: 'Dompet Kas',
        type: 'cash',
      })
      expect(text).toBe('💵 Dompet Kas')
    })
  })

  describe('formatAllWalletsCopy', () => {
    it('formats all wallets into a neat and catchy summary', () => {
      const wallets = [
        {
          institution: 'Bank Jago',
          name: '109254920681',
          type: 'bank',
        },
        {
          institution: 'ShopeePay',
          name: '081241252656',
          type: 'e_wallet',
        },
      ]

      const text = formatAllWalletsCopy(wallets)
      expect(text).toContain('✨ Rekening & Dompet Pembayaran ✨')
      expect(text).toContain('🏦 Bank Jago\nNo. Rekening: 109254920681')
      expect(text).toContain('📱 ShopeePay\nNo. Akun/HP: 081241252656')
      expect(text).toContain('Uangara Finance')
    })

    it('returns empty string for empty array', () => {
      expect(formatAllWalletsCopy([])).toBe('')
    })
  })

  describe('copyToClipboard', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('uses navigator.clipboard when available', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, {
        clipboard: { writeText },
      })

      const success = await copyToClipboard('test string')
      expect(success).toBe(true)
      expect(writeText).toHaveBeenCalledWith('test string')
    })

    it('returns false when text is empty', async () => {
      const success = await copyToClipboard('')
      expect(success).toBe(false)
    })
  })
})
