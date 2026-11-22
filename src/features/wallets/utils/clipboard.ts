export function getWalletEmoji(type: string): string {
  switch (type) {
    case 'bank':
      return '🏦'
    case 'e_wallet':
      return '📱'
    case 'e_money':
      return '💳'
    case 'cash':
      return '💵'
    case 'other':
    default:
      return '💼'
  }
}

export function formatSingleWalletCopy(wallet: {
  institution?: string | null
  name: string
  type: string
}): string {
  const emoji = getWalletEmoji(wallet.type)
  const provider = wallet.institution
    ? wallet.institution.trim()
    : wallet.name.trim()
  const accountNo = wallet.name.trim()

  if (
    wallet.institution &&
    wallet.institution.trim().toLowerCase() !== accountNo.toLowerCase()
  ) {
    const label =
      wallet.type === 'bank'
        ? 'No. Rekening'
        : wallet.type === 'e_wallet'
          ? 'No. Akun/HP'
          : wallet.type === 'e_money'
            ? 'No. Kartu'
            : 'No. Akun'
    return `${emoji} ${provider}\n${label}: ${accountNo}`
  }

  return `${emoji} ${provider}`
}

export function formatAllWalletsCopy(
  wallets: readonly {
    institution?: string | null
    name: string
    type: string
  }[],
): string {
  if (wallets.length === 0) return ''

  const lines = wallets.map((w) => formatSingleWalletCopy(w))

  return `✨ Rekening & Dompet Pembayaran ✨\n\n${lines.join('\n\n')}\n\n━━━━━━━━━━━━━━━\nUangara Finance`
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fallback if clipboard API throws or is denied
  }

  try {
    if (typeof document !== 'undefined') {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      textArea.setAttribute('readonly', '')
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      return successful
    }
  } catch {
    // Both attempts failed
  }

  return false
}
