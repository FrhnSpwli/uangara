import { type FormEvent, useState } from 'react'
import { Link } from 'react-router'

import { useAuth } from '../context/useAuth'
import { getAuthErrorMessage } from '../services/auth-errors'
import { getFormString } from '../utils/form-values'

export function SignUpPage() {
  const { signUp } = useAuth()
  const [confirmationRequired, setConfirmationRequired] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const form = new FormData(event.currentTarget)
    const password = getFormString(form, 'password')
    const passwordConfirmation = getFormString(form, 'passwordConfirmation')

    if (password !== passwordConfirmation) {
      setError('The password confirmation does not match.')
      return
    }

    setPending(true)

    try {
      const result = await signUp({
        email: getFormString(form, 'email').trim(),
        emailRedirectTo: `${window.location.origin}/auth/sign-in?confirmed=true`,
        password,
      })

      setConfirmationRequired(result.confirmationRequired)
      setPending(false)
    } catch (submissionError) {
      setError(getAuthErrorMessage(submissionError))
      setPending(false)
    }
  }

  if (confirmationRequired) {
    return (
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-brand-700 text-sm font-semibold">One more step</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Check your inbox
        </h1>
        <p className="mt-4 leading-7 text-slate-600" role="status">
          Supabase requires email confirmation for this account. Open the
          confirmation link, then return to Uangara to sign in.
        </p>
        <Link
          className="bg-brand-700 hover:bg-brand-800 mt-7 inline-flex rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          to="/auth/sign-in"
        >
          Return to sign in
        </Link>
      </section>
    )
  }

  return (
    <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-brand-700 text-sm font-semibold">
        Create your account
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
        Sign up
      </h1>
      <p className="mt-3 leading-7 text-slate-600">
        Start with a private identity boundary. Financial features arrive in
        later phases.
      </p>

      <form
        className="mt-7 space-y-5"
        onSubmit={(event) => {
          void handleSubmit(event)
        }}
      >
        <div>
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="sign-up-email"
          >
            Email address
          </label>
          <input
            autoComplete="email"
            className="focus:border-brand-600 focus:ring-brand-100 mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-slate-950 outline-none focus:ring-4"
            disabled={pending}
            id="sign-up-email"
            name="email"
            required
            type="email"
          />
        </div>

        <div>
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="sign-up-password"
          >
            Password
          </label>
          <input
            autoComplete="new-password"
            className="focus:border-brand-600 focus:ring-brand-100 mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-slate-950 outline-none focus:ring-4"
            disabled={pending}
            id="sign-up-password"
            minLength={6}
            name="password"
            required
            type="password"
          />
          <p className="mt-2 text-xs text-slate-500">
            Use at least six characters.
          </p>
        </div>

        <div>
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="sign-up-password-confirmation"
          >
            Confirm password
          </label>
          <input
            autoComplete="new-password"
            className="focus:border-brand-600 focus:ring-brand-100 mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-slate-950 outline-none focus:ring-4"
            disabled={pending}
            id="sign-up-password-confirmation"
            minLength={6}
            name="passwordConfirmation"
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
          {pending ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link
          className="text-brand-700 font-semibold hover:underline"
          to="/auth/sign-in"
        >
          Sign in
        </Link>
      </p>
    </section>
  )
}
