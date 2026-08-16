'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import Icon from '@/components/site/Icon'

export default function AdminLogin() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
    })

    if (res.ok) {
      router.push('/admin/dashboard')
      router.refresh()
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Sign in failed')
      setBusy(false)
    }
  }

  return (
    <div className="loginPage">
      <div className="loginCard">
        <Link href="/" className="loginCard__brand">
          <Logo theme="light" style={{ height: 40 }} />
        </Link>

        <h1 className="h2">Advisory desk</h1>
        <p className="loginCard__sub">
          Verification pipeline, lead inbox, data room queue and the published transparency figures.
        </p>

        <form onSubmit={onSubmit} className="stack" style={{ gap: 16, marginTop: 26 }}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="username" defaultValue="" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>

          {error && (
            <p style={{ fontSize: '.84rem', color: 'var(--flagged)' }}>
              <Icon name="flag" size={13} /> {error}
            </p>
          )}

          <button className="btn btn-primary btn-block btn-lg" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="loginCard__note">
          Credentials are set through the <code>ADMIN_EMAIL</code> and <code>ADMIN_PASSWORD</code> environment
          variables. Change them before this reaches a public deployment.
        </p>

        <Link href="/" className="link-arrow" style={{ marginTop: 20, display: 'inline-flex' }}>
          ← Back to the site
        </Link>
      </div>
    </div>
  )
}
