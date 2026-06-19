/**
 * Telegram AI Handler — Enterprise Grade
 *
 * Handles:
 * 1. Natural language → structured action → confirm → execute
 * 2. Edit/undo operasi terakhir dari konteks percakapan
 * 3. Persistent conversation context per chat
 */

import {
  getOrCreateSession,
  getSession,
  setPendingAction,
  getPendingAction,
  clearPendingAction,
  addRecentOperation,
  getLastOperation,
  getRecentOperations,
} from './conversation-store'
import {
  parseUserIntent,
  generateConfirmationMessage,
  generateSuccessMessage,
} from './ai-actions'
import { executeAIAction } from './ai-action-executor'
import { parseEditIntent, executeEdit, executeUndo, formatEditSuccessMessage } from './ai-edit-handler'
import type { AIAction } from './ai-actions'

// ─── Main Handler ─────────────────────────────────────────────────────────────

export async function handleNaturalLanguageTelegram(params: {
  messageText: string
  chatId: number
  userId: string
  businessId: string
  businessName?: string
  accountType?: string
  activeGoals?: Array<{ id: string; title: string }>
}): Promise<string> {

  const sessionKey = `telegram:${params.chatId}`

  // Pastikan session ada
  getOrCreateSession(sessionKey, {
    userId: params.userId,
    businessId: params.businessId,
  })

  const text = params.messageText.trim()

  // ── 1. Cek apakah user sedang menjawab konfirmasi pending ─────────────────
  const confirmKeywords = new Set(['ya', 'yes', 'ok', 'oke', 'y', 'lanjut', 'confirm'])
  const cancelKeywords  = new Set(['tidak', 'no', 'n', 'batal', 'cancel', 'ga', 'gak', 'jangan'])
  const isConfirm = confirmKeywords.has(text.toLowerCase())
  const isCancel  = cancelKeywords.has(text.toLowerCase())

  if (isConfirm || isCancel) {
    const pendingAction = getPendingAction(sessionKey)

    if (pendingAction) {
      clearPendingAction(sessionKey)

      if (isCancel) {
        return '❌ Action dibatalkan.'
      }

      // Execute the confirmed action
      const result = await executeAIAction(pendingAction, {
        userId: params.userId,
        businessId: params.businessId,
      })

      if (!result.success) {
        return `❌ ${result.message}${result.error ? `\n\nDetail: ${result.error}` : ''}`
      }

      // Simpan ke recent operations untuk edit/undo
      const entityType = getEntityType(pendingAction.type)
      if (entityType && result.data?.id) {
        addRecentOperation(sessionKey, {
          actionType: pendingAction.type,
          entityId: result.data.id,
          entityType,
          snapshot: {},
          executedData: { ...pendingAction.params, ...result.data },
          canEdit: true,
          canUndo: true,
          description: buildOperationDescription(pendingAction),
        })
      }

      return generateSuccessMessage(pendingAction, result.data)
    }

    // Tidak ada pending action, abaikan ya/tidak
    return 'Tidak ada action yang perlu dikonfirmasi. Kirim pesan untuk memulai.'
  }

  // ── 2. Cek apakah ini intent edit / undo ──────────────────────────────────
  const lastOp = getLastOperation(sessionKey)
  if (lastOp) {
    const editIntent = await parseEditIntent(text, lastOp)

    if (editIntent.type !== 'none' && editIntent.confidence >= 70) {
      if (editIntent.type === 'undo') {
        if (!lastOp.canUndo) {
          return `❌ Operasi "${lastOp.description}" tidak bisa dibatalkan lagi.`
        }
        const result = await executeUndo(lastOp)
        if (result.success) {
          // Hapus dari recent ops karena sudah di-undo
          const session = getSession(sessionKey)
          if (session) {
            session.recentOperations = session.recentOperations.filter(op => op.id !== lastOp.id)
          }
        }
        return result.message
      }

      if (editIntent.type === 'edit') {
        if (!lastOp.canEdit) {
          return `❌ Operasi "${lastOp.description}" tidak bisa diedit lagi.`
        }

        // Minta konfirmasi sebelum edit
        const oldVal = getOldValue(lastOp, editIntent.field)
        const newVal = formatValue(editIntent.newValue, editIntent.field)

        const confirmMsg = [
          `✏️ Konfirmasi edit:`,
          `📌 Operasi: ${lastOp.description}`,
          oldVal ? `📌 Sebelum: ${oldVal}` : '',
          `✅ Sesudah: ${newVal}`,
          '',
          'Balas "ya" untuk konfirmasi atau "tidak" untuk batal.',
        ].filter(Boolean).join('\n')

        // Simpan edit intent sebagai pending action khusus
        setPendingAction(sessionKey, {
          type: 'edit_operation' as any,
          params: {
            opId: lastOp.id,
            opKey: sessionKey,
            editIntent,
          },
          confidence: editIntent.confidence,
          explanation: editIntent.reason,
        })

        return confirmMsg
      }
    }
  }

  // ── 3. Parse sebagai action baru ──────────────────────────────────────────
  const action = await parseUserIntent(text, {
    businessName: params.businessName,
    accountType: params.accountType,
    activeGoals: params.activeGoals,
  })

  if (action.confidence < 60 || action.type === 'unknown') {
    return buildHelpMessage(action.type === 'unknown' ? action.explanation : '')
  }

  if (action.type === 'query_data') {
    return buildQueryRedirectMessage()
  }

  // Valid action — simpan pending dan minta konfirmasi
  setPendingAction(sessionKey, action)
  return generateConfirmationMessage(action)
}

// ─── Handle confirm untuk edit operation ─────────────────────────────────────
export async function handleEditConfirmation(
  sessionKey: string,
  pendingAction: AIAction
): Promise<string> {
  const { opId, opKey, editIntent } = pendingAction.params
  const session = getSession(sessionKey)
  if (!session) return '❌ Session tidak ditemukan.'

  const op = session.recentOperations.find(o => o.id === opId)
  if (!op) return '❌ Operasi tidak ditemukan. Mungkin sudah terlalu lama.'

  const result = await executeEdit(op, editIntent)

  if (result.success) {
    // Update executedData di recent operations
    if (result.updatedData) {
      op.executedData = { ...op.executedData, ...result.updatedData }
    }
    // Update description
    op.description = rebuildDescription(op, editIntent)
  }

  return formatEditSuccessMessage(op, editIntent, result)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEntityType(actionType: string) {
  const map: Record<string, RecentOperation['entityType']> = {
    create_transaction: 'transaction',
    create_goal: 'goal',
    update_goal: 'goal',
    create_payable: 'payable',
    create_receivable: 'receivable',
    create_inventory_item: 'inventory_item',
    adjust_inventory_stock: 'inventory_log',
  }
  return map[actionType] || null
}

function buildOperationDescription(action: AIAction): string {
  const p = action.params
  const currency = (n: number) => `Rp ${n?.toLocaleString('id-ID') || '0'}`

  switch (action.type) {
    case 'create_transaction':
      return `${p.transactionType === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${currency(p.amount)} - ${p.description}`
    case 'create_goal':
      return `Goal "${p.title}" target ${currency(p.targetAmount)}`
    case 'add_goal_contribution':
      return `Kontribusi ${currency(p.amount)} ke goal`
    case 'create_payable':
      return `Hutang ke ${p.contactName} ${currency(p.amount)}`
    case 'create_receivable':
      return `Piutang dari ${p.contactName} ${currency(p.amount)}`
    case 'create_inventory_item':
      return `Item inventaris "${p.name}"`
    case 'adjust_inventory_stock':
      return `${p.type === 'in' ? 'Stok masuk' : 'Stok keluar'} ${p.quantity} ${p.unit || 'unit'}`
    default:
      return action.type
  }
}

function getOldValue(op: RecentOperation, field?: string): string | null {
  if (!field) return null
  const d = op.executedData
  const currency = (n: string | number) => `Rp ${parseFloat(String(n)).toLocaleString('id-ID')}`

  if (field === 'amount' && d.amount) return currency(d.amount)
  if (field === 'targetAmount' && d.targetAmount) return currency(d.targetAmount)
  if (field === 'description' && d.description) return `"${d.description}"`
  if (field === 'transactionType') return d.transaction_type === 'income' ? 'Pemasukan' : 'Pengeluaran'
  if (field === 'contactName' && d.contactName) return d.contactName
  if (field === 'title' && d.title) return `"${d.title}"`
  return null
}

function formatValue(value: any, field?: string): string {
  if (value === null || value === undefined) return 'N/A'
  if ((field === 'amount' || field === 'targetAmount') && typeof value === 'number') {
    return `Rp ${value.toLocaleString('id-ID')}`
  }
  if (field === 'transactionType') return value === 'income' ? 'Pemasukan' : 'Pengeluaran'
  return String(value)
}

function rebuildDescription(op: RecentOperation, intent: { field?: string; newValue?: any }): string {
  const d = { ...op.executedData }
  if (intent.field === 'amount') d.amount = intent.newValue?.toString()
  if (intent.field === 'description') d.description = intent.newValue
  if (intent.field === 'transactionType') d.transaction_type = intent.newValue
  if (intent.field === 'targetAmount') d.targetAmount = intent.newValue?.toString()

  const currency = (n: string | number) => `Rp ${parseFloat(String(n)).toLocaleString('id-ID')}`

  switch (op.actionType) {
    case 'create_transaction':
      return `${d.transaction_type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${currency(d.amount || 0)} - ${d.description}`
    case 'create_goal':
      return `Goal "${d.title}" target ${currency(d.targetAmount || 0)}`
    default:
      return op.description
  }
}

function buildHelpMessage(extra?: string): string {
  return [
    extra ? `Hmm, ${extra}\n` : '',
    'Saya bisa membantu:',
    '• Catat transaksi: "beli gula 50rb"',
    '• Buat target: "buat target 10jt untuk motor"',
    '• Tambah kontribusi: "tambah 500rb ke target motor"',
    '• Catat hutang: "hutang ke Budi 2jt"',
    '• Koreksi: "eh salah, yang tadi 9.5jt bukan 10jt"',
    '• Batalkan: "undo" atau "batalkan yang tadi"',
    '',
    'Atau gunakan: /status /laporan /pdf /target /budget',
  ].filter(s => s !== undefined).join('\n')
}

function buildQueryRedirectMessage(): string {
  return (
    'Untuk pertanyaan informasi gunakan:\n' +
    '• /status — ringkasan saldo & bisnis\n' +
    '• /laporan — laporan keuangan bulan ini\n' +
    '• /target — progress semua goal\n' +
    '• /budget — status budget bulan ini\n' +
    '\nAtau buka AI Chat di dashboard untuk analisis mendalam.'
  )
}

// Export type untuk digunakan di executor
import type { RecentOperation } from './conversation-store'
