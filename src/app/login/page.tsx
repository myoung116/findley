import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-semibold text-slate-800 mb-1">Findley Lake</h1>
        <p className="text-sm text-slate-500 mb-6">Sign in to access the house calendar</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
