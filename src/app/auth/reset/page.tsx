import { ThemeToggle } from '@/components/ThemeToggle'
import { ResetForm } from './ResetForm'

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-1">Set a new password</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Choose a new password for your Findley Lake account.</p>
        <ResetForm />
      </div>
    </div>
  )
}
