'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './login.module.css'
import Logo from '@/components/Logo'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (res.ok) {
      router.push('/admin/dashboard')
    } else {
      const d = await res.json()
      setError(d.error || 'Invalid credentials')
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <a href="/" className="brand" style={{marginBottom: 32, display: 'flex'}}>
          <Logo theme="light" style={{ height: '56px' }} />
        </a>

        <h1 className={styles.heading}>Sign in</h1>
        <p className={styles.sub}>Access the property management console</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email address</label>
            <input
              type="email" required
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password" required
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{width: '100%', justifyContent: 'center', padding: 12}}>
            {loading ? 'Authenticating…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
