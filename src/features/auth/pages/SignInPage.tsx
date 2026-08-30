import { type FormEvent, useState } from 'react'
import { Link, useSearchParams } from 'react-router'

import { useAuth } from '../context/useAuth'
import { getAuthErrorMessage } from '../services/auth-errors'
import { getFormString } from '../utils/form-values'

export function SignInPage() {
  const { signIn } = useAuth()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const form = new FormData(event.currentTarget)

    try {
      await signIn({
        email: getFormString(form, 'email').trim(),
        password: getFormString(form, 'password'),
      })
    } catch (submissionError) {
      setError(getAuthErrorMessage(submissionError))
      setPending(false)
    }
  }

  return (
    <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-brand-700 text-sm font-semibold">Welcome back</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
        Sign in
      </h1>
      <p className="mt-3 leading-7 text-slate-600">
        Continue to your private Uangara application area.
      </p>

      {searchParams.get('confirmed') === 'true' ? (
        <p
          className="border-brand-100 bg-brand-50 mt-5 rounded-xl border p-4 text-sm text-slate-700"
          role="status"
        >
          Email confirmation completed. You can now sign in.
        </p>
      ) : null}

      <form
        className="mt-7 space-y-5"
        onSubmit={(event) => {
          void handleSubmit(event)
        }}
      >
        <div>
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="sign-in-email"
          >
            Email address
          </label>
          <input
            autoComplete="email"
            className="focus:border-brand-600 focus:ring-brand-100 mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-slate-950 outline-none focus:ring-4"
            disabled={pending}
            id="sign-in-email"
            name="email"
            required
            type="email"
          />
        </div>

        <div>
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="sign-in-password"
          >
            Password
          </label>
          <input
            autoComplete="current-password"
            className="focus:border-brand-600 focus:ring-brand-100 mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-slate-950 outline-none focus:ring-4"
            disabled={pending}
            id="sign-in-password"
            minLength={6}
            name="password"
            required
            type="password"
          />
        </div>

        {error ? (
          <p
            className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <button
          className="bg-brand-700 hover:bg-brand-800 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        New to Uangara?{' '}
        <Link
          className="text-brand-700 font-semibold hover:underline"
          to="/auth/sign-up"
        >
          Create an account
        </Link>
      </p>
    </section>
  )
}
