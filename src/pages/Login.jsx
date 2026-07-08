import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Eye, EyeClosed } from '@phosphor-icons/react'
import api from '../lib/api'
import Button from '../components/Button'
import '../styles/pages/Login.css'

export default function Login({ onLogin }) {
  const [view, setView] = useState('login') // 'login' or 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [submittingForgot, setSubmittingForgot] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email?.trim() || !password) return
    setSubmitting(true)
    try {
      const { data } = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password
      })

      // Store JWT and user in localStorage
      localStorage.setItem('proact_token', data.token)
      localStorage.setItem('proact_user', JSON.stringify(data.user))

      // Log successful login (fire and forget)
      api.post('/activity-logs', {
        action: 'Logged in',
        details: 'User authenticated successfully'
      }).catch(() => {})

      onLogin?.(data.user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    setForgotError('')
    setForgotSuccess('')
    if (!forgotEmail?.trim()) return
    setSubmittingForgot(true)
    try {
      const { data } = await api.post('/auth/forgot-password', {
        email: forgotEmail.trim().toLowerCase()
      })
      setForgotSuccess(data.message || 'A temporary password has been successfully sent to your email.')
      setForgotEmail('')
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to request password reset. Please try again.'
      setForgotError(msg)
    } finally {
      setSubmittingForgot(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <img src="/proactLogo1RDRRMC.png" alt="PROACT LOGO" className="login-logo-img" />
          <p>{view === 'login' ? 'Sign in to your account' : 'Reset your password'}</p>
        </div>

        {view === 'login' ? (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group password-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <label htmlFor="password" style={{ margin: 0 }}>Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setView('forgot')
                    setError('')
                    setForgotError('')
                    setForgotSuccess('')
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6366f1',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}
            <Button type="submit" className="login-btn" isLoading={submitting}>
              Sign In
            </Button>
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  const guestUser = {
                    id: 'guest',
                    role: 'Guest',
                    account_type: 'Guest',
                    first_name: 'Guest',
                    last_name: 'User',
                    name: 'Guest User',
                  };
                  onLogin?.(guestUser);
                  navigate('/dashboard', { replace: true });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6366f1',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  width: '100%',
                  transition: 'background-color 0.2s',
                  backgroundColor: 'rgba(99, 102, 241, 0.05)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.05)'}
              >
                Continue as Guest / View System
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleForgotSubmit} className="login-form">
            <div style={{ marginBottom: '1.25rem', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>
              Enter your email address below, and we will email you a temporary password to log in and reset your credentials.
            </div>
            <div className="form-group">
              <label htmlFor="forgot-email">Email Address</label>
              <input
                id="forgot-email"
                type="email"
                placeholder="you@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
            </div>
            {forgotError && (
              <div className="login-error" role="alert">
                {forgotError}
              </div>
            )}
            {forgotSuccess && (
              <div style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '10px 12px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 600 }} role="alert">
                {forgotSuccess}
              </div>
            )}
            <Button type="submit" className="login-btn" isLoading={submittingForgot}>
              Send Temporary Password
            </Button>
            <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setView('login')
                  setForgotError('')
                  setForgotSuccess('')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6366f1',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
      <div className="login-footer">
        Developed by <span className="highlight-name">DOST Ilocos Region</span>
      </div>
    </div>
  )
}