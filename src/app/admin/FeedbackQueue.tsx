'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { markFeedbackReviewed } from '@/app/actions/markFeedbackReviewed'

export interface FeedbackRow {
  id: string
  category: 'bug' | 'suggestion' | 'question' | 'other'
  message: string
  status: 'new' | 'reviewed'
  created_at: string
  users: { name: string; family_branch: string } | null
}

const CATEGORY_BADGE: Record<FeedbackRow['category'], string> = {
  bug:        'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  suggestion: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  question:   'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  other:      'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
}

const CATEGORY_LABEL: Record<FeedbackRow['category'], string> = {
  bug: 'Bug', suggestion: 'Suggestion', question: 'Question', other: 'Other',
}

function FeedbackItem({ item }: { item: FeedbackRow }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleReviewed() {
    startTransition(async () => {
      const result = await markFeedbackReviewed(item.id)
      if (result.success) router.refresh()
      else setError(result.error ?? 'Failed')
    })
  }

  return (
    <div className={`px-4 py-3 border-b border-slate-50 dark:border-slate-800 last:border-0 ${item.status === 'new' ? '' : 'opacity-50'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_BADGE[item.category]}`}>
              {CATEGORY_LABEL[item.category]}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{item.users?.name ?? 'Unknown'}</span>
            <span className="text-xs text-slate-300 dark:text-slate-600">{item.users?.family_branch}</span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-200">{item.message}</p>
          <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">
            {format(parseISO(item.created_at), 'MMM d, h:mm a')}
          </p>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
        {item.status === 'new' && (
          <button
            onClick={handleReviewed}
            disabled={isPending}
            className="shrink-0 text-xs border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            {isPending ? '…' : 'Done'}
          </button>
        )}
      </div>
    </div>
  )
}

export function FeedbackQueue({ items }: { items: FeedbackRow[] }) {
  const newItems      = items.filter(i => i.status === 'new')
  const reviewedItems = items.filter(i => i.status === 'reviewed')

  return (
    <section>
      <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-3">
        Feedback
        {newItems.length > 0 && (
          <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
            {newItems.length} new
          </span>
        )}
      </h2>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center text-sm text-slate-400 dark:text-slate-500">
          No feedback yet
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {newItems.map(item => <FeedbackItem key={item.id} item={item} />)}
          {reviewedItems.length > 0 && newItems.length > 0 && (
            <div className="px-4 py-2 border-b border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs text-slate-400 dark:text-slate-500">Reviewed</p>
            </div>
          )}
          {reviewedItems.map(item => <FeedbackItem key={item.id} item={item} />)}
        </div>
      )}
    </section>
  )
}
