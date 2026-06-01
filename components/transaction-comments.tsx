'use client'

import { useState, useEffect, useTransition } from 'react'
import { addComment, getTransactionComments, deleteComment } from '@/app/actions/comments'
import { Button } from '@/components/ui/button'

type Comment = {
  id: string
  content: string
  createdAt: Date
  userId: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  } | null
}

interface TransactionCommentsProps {
  businessId: string
  transactionId: string
  transactionDesc: string
  currentUserId: string
  isOwner: boolean
}

export default function TransactionComments({
  businessId,
  transactionId,
  transactionDesc,
  currentUserId,
  isOwner,
}: TransactionCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setIsLoading(true)
    getTransactionComments(businessId, transactionId)
      .then((data) => setComments(data as Comment[]))
      .catch(() => setComments([]))
      .finally(() => setIsLoading(false))
  }, [isOpen, businessId, transactionId])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return
    setError(null)

    startTransition(async () => {
      try {
        await addComment(businessId, newComment.trim(), transactionId)
        setNewComment('')
        // Refresh komentar
        const updated = await getTransactionComments(businessId, transactionId)
        setComments(updated as Comment[])
      } catch (err: any) {
        setError(err.message || 'Gagal mengirim komentar')
      }
    })
  }

  function handleDelete(commentId: string) {
    startTransition(async () => {
      try {
        await deleteComment(businessId, commentId)
        setComments((prev) => prev.filter((c) => c.id !== commentId))
      } catch (err: any) {
        setError(err.message || 'Gagal menghapus komentar')
      }
    })
  }

  const commentCount = comments.length

  return (
    <div className="mt-1">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>💬</span>
        <span>
          {isOpen
            ? 'Tutup komentar'
            : commentCount > 0
            ? `${commentCount} komentar`
            : 'Tambah komentar'}
        </span>
      </button>

      {/* Panel komentar */}
      {isOpen && (
        <div className="mt-3 rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          {/* Daftar komentar */}
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Memuat komentar...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Belum ada komentar. Jadilah yang pertama!
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {comments.map((c) => {
                const displayName = c.user?.name || c.user?.email || 'Pengguna'
                const isAuthor = c.userId === currentUserId
                const canDelete = isAuthor || isOwner
                const initials = displayName.slice(0, 2).toUpperCase()
                const date = new Date(c.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })

                return (
                  <div key={c.id} className="flex gap-2.5 group">
                    {/* Avatar */}
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-foreground">
                          {displayName}
                        </span>
                        <span className="text-xs text-muted-foreground">{date}</span>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(c.id)}
                            disabled={isPending}
                            className="text-xs text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-foreground mt-0.5 break-words">{c.content}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Form tambah komentar */}
          <form onSubmit={handleSubmit} className="flex gap-2 pt-1 border-t border-border">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Tulis komentar..."
              maxLength={1000}
              disabled={isPending}
              className="flex-1 text-sm rounded-lg border border-border bg-background px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !newComment.trim()}
              className="shrink-0"
            >
              {isPending ? '...' : 'Kirim'}
            </Button>
          </form>

          {error && (
            <p className="text-xs text-rose-500">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
