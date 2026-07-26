import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { OtpInput } from '../components/OtpInput' // the component from earlier

const colleges = [
  { id: 1, name: "Baker" },
  { id: 2, name: "Will Rice" },
  { id: 3, name: "Hanszen" },
  { id: 4, name: "Wiess" },
  { id: 5, name: "Jones" },
  { id: 6, name: "Brown" },
  { id: 7, name: "Lovett" },
  { id: 8, name: "Sid Richardson" },
  { id: 9, name: "Martel" },
  { id: 10, name: "McMurtry" },
  { id: 11, name: "Duncan" },
  { id: 12, name: "Chao" }
]

export default function LoginScreen() {
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [email, setEmail] = useState('')
  const [handle, setHandle] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [collegeId, setCollegeId] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [otpKey, setOtpKey] = useState(0)

  const signupDisabled = loading || !email || !handle || !displayName || (collegeId === "-1" || collegeId === undefined)
  const loginDisabled = loading || !email

  async function handleSignup() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: {
          display_name: displayName,
          handle: handle.startsWith('@') ? handle : `@${handle}`,
          college_id: collegeId ? Number(collegeId) : null,
        },
      },
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  async function handleLogin() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })
    setLoading(false)
    setSent(true) // always show "check your email" regardless of outcome
    if (error) console.error(error.message) // don't leak whether the account exists
  }

  async function handleVerify(code: string) {
    setVerifying(true)
    setError(null)
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })
    setVerifying(false)
    if (error) {
      setError('Incorrect or expired code. Try again.')
      setOtpKey((k) => k + 1)
    }
    // On success, Supabase sets the session automatically — your
    // top-level auth listener/router should redirect away from LoginScreen.
  }

  async function handleResend() {
    setError(null)
    if (mode === 'signup') await handleSignup()
    else await handleLogin()
  }

  function switchMode(next: 'signup' | 'login') {
    setMode(next)
    setError(null)
    setSent(false)
  }

  if (sent) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 340 }}>
          <h2 style={{ color: '#2D2843', fontSize: 22, marginBottom: 8 }}>Check your email 📬</h2>
          <p style={{ color: '#9999CC', marginBottom: 24 }}>
            Enter the 6-digit code we sent to {email}
          </p>

          <OtpInput key={otpKey} onComplete={handleVerify} error={!!error} disabled={verifying} />

          {error && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 16 }}>{error}</p>}
          {verifying && <p style={{ color: '#9999CC', fontSize: 13, marginTop: 16 }}>Verifying...</p>}

          <button onClick={handleResend} style={{ background: 'transparent', border: 'none', color: '#9999CC', fontSize: 13, marginTop: 24, cursor: 'pointer' }}>
            Didn't get a code? Resend
          </button>

          <button onClick={() => { setSent(false); switchMode('login') }} style={{ ...btnStyle, marginTop: 12 }}>
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, gap: 12 }}>
      <h1 style={{ color: '#2D2843', fontSize: 26, marginBottom: 12 }}>
        {mode === 'signup' ? 'Sign up to Hoot It' : 'Log in to Hoot It'}
      </h1>

      {mode === 'signup' ? (
        <form style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required />
          <input placeholder="Your Name" value={displayName} onChange={e => setDisplayName(e.target.value)} style={inputStyle} required />
          <div style={inputStyle}>
            <span style={{ color: '#2D2843', userSelect: 'none' }}>@</span>
            <input placeholder="Handle" value={handle} onChange={e => setHandle(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#2D2843' }} required />
          </div>
          <select value={collegeId} onChange={e => setCollegeId(e.target.value)} style={inputStyle} required>
            <option value="-1">Select your college</option>
            {colleges.map(college => (
              <option key={college.id} value={college.id}>{college.name}</option>
            ))}
          </select>
          <button
            type="submit"
            onClick={(e) => { e.preventDefault(); handleSignup() }}
            disabled={signupDisabled}
            style={signupDisabled ? { ...btnStyle, background: 'lightgray', cursor: 'not-allowed' } : btnStyle}
          >
            {loading ? 'Sending...' : 'Send code'}
          </button>
        </form>
      ) : (
        <form style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required />
          <button
            type="submit"
            onClick={(e) => { e.preventDefault(); handleLogin() }}
            disabled={loginDisabled}
            style={loginDisabled ? { ...btnStyle, background: 'lightgray', cursor: 'not-allowed' } : btnStyle}
          >
            {loading ? 'Sending...' : 'Send code'}
          </button>
        </form>
      )}

      {error && <p style={{ color: '#EF4444', fontSize: 13 }}>{error}</p>}

      <button
        onClick={() => switchMode(mode === 'signup' ? 'login' : 'signup')}
        style={{ background: 'transparent', border: 'none', color: '#9999CC', fontSize: 13, marginTop: 8, cursor: 'pointer' }}
      >
        {mode === 'signup' ? 'Already have an account?' : "Don't have an account? Sign up"}
      </button>
    </div>
  )
}

const inputStyle = { background: '#FFFFFF', border: '1px solid #E6E4F5', borderRadius: 12, padding: '14px 16px', color: '#2D2843' }
const btnStyle = { padding: 16, background: 'linear-gradient(135deg, #4F7FFA 0%, #8B5CF6 100%)', borderRadius: 14, color: '#fff', fontWeight: 700 }