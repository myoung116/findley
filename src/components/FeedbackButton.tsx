'use client'

import { useState, useTransition } from 'react'
import { submitFeedback, type FeedbackCategory } from '@/app/actions/submitFeedback'

const CATEGORIES: { value: FeedbackCategory; label: string }[] = [
  { value: 'suggestion', label: '💡 Suggestion' },
  { value: 'bug',        label: '🐛 Bug report' },
  { value: 'question',   label: '❓ Question' },
  { value: 'other',      label: '💬 Other' },
]

export function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<FeedbackCategory>('suggestion')
  const [message, setMessage] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleOpen() { setOpen(true); setDone(false); setError(null); setMessage('') }
  function handleClose() { setOpen(false) }

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const result = await submitFeedback(category, message)
      if (result.success) setDone(true)
      else setError(result.error ?? 'Failed to submit. Please try again.')
    })
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-5 right-5 z-40 bg-slate-700 dark:bg-slate-600 text-white text-xs font-medium px-3 py-2 rounded-full shadow-lg hover:bg-slate-800 dark:hover:bg-slate-500 transition-colors"
        aria-label="Send feedback"
      >
        Feedback
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4" onClick={handleClose}>
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">Send Feedback</h2>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none">×</button>
            </div>

            {done ? (
              <div className="px-5 py-8 text-center">
                <p className="text-2xl mb-2">✓</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Thanks for the feedback!</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Michael will take a look.</p>
                <button
                  onClick={handleClose}
                  className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="px-5 py-4 space-y-4">
                {/* Category */}
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setCategory(c.value)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        category === c.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Message */}
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                  placeholder="What's on your mind?"
                  className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />

                {error && <p className="text-xs text-red-500">{error}</p>}

                <button
                  onClick={handleSubmit}
                  disabled={isPending || !message.trim()}
                  className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
                >
                  {isPending ? 'Sending…' : 'Send Feedback'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
