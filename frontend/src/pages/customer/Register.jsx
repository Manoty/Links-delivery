import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/shared/Toast';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthField from '../../components/auth/AuthField';
import { PhoneIcon, LockIcon, UserIcon, MailIcon, GoogleIcon } from '../../components/auth/AuthIcons';

const ROLES = [
  {
    id: 'customer',
    emoji: '🛒',
    label: 'Customer',
    sub: 'Order food delivery',
  },
  {
    id: 'rider',
    emoji: '🏍️',
    label: 'Rider',
    sub: 'Earn delivering orders',
  },
];

const PASSWORD_CHECKS = [
  { label: 'At least 8 characters',          test: v => v.length >= 8           },
  { label: 'One uppercase letter',            test: v => /[A-Z]/.test(v)         },
  { label: 'One number',                      test: v => /\d/.test(v)            },
];

export default function Register() {
  const [form, setForm] = useState({
    username:     '',
    email:        '',
    phone_number: '',
    password:     '',
    password2:    '',
    role:         'customer',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [step,    setStep]    = useState(1); // 1 = role pick, 2 = details

  const { loginUser } = useAuth();
  const navigate      = useNavigate();
  const toast         = useToast();

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const passStrength = PASSWORD_CHECKS.filter(c => c.test(form.password)).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      return setError('Passwords do not match.');
    }
    setLoading(true);
    setError('');
    try {
      const res = await register(form);
      loginUser(res.data.tokens, res.data.user);
      toast.success('Account created! Welcome to Scott. 🎉');
      navigate(res.data.user.role === 'rider' ? '/rider' : '/home');
    } catch (err) {
      const d = err.response?.data || {};
      const msg = Object.values(d).flat().join(' ');
      setError(msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="register">
      {/* Tab switcher */}
      <div style={{
        display: 'flex', gap: 4,
        background: '#F0EBE3',
        borderRadius: 12, padding: 4,
        marginBottom: 28,
      }}>
        {[
          { label: 'Sign in',        active: false, to: '/login'    },
          { label: 'Create account', active: true,  to: '/register' },
        ].map(tab => (
          <button
            key={tab.label}
            onClick={() => navigate(tab.to)}
            style={{
              flex: 1, padding: '9px 8px',
              borderRadius: 9, border: 'none',
              fontSize: 14, fontWeight: 700,
              cursor: 'pointer',
              background: tab.active ? '#fff' : 'transparent',
              color: tab.active ? '#1A1207' : '#B0A396',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Heading */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        background: 'rgba(232,82,26,0.1)',
        border: '1px solid rgba(232,82,26,0.2)',
        borderRadius: 20, padding: '4px 12px',
        marginBottom: 16,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8521A' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#E8521A', letterSpacing: '0.05em' }}>
          JOIN SCOTT
        </span>
      </div>

      <h1 style={{
        fontSize: 26, fontWeight: 900, color: '#1A1207',
        letterSpacing: '-0.5px', marginBottom: 6,
      }}>
        Create your account
      </h1>
      <p style={{ fontSize: 14, color: '#B0A396', marginBottom: 24, lineHeight: 1.5 }}>
        Already have one?{' '}
        <Link to="/login" style={{ color: '#E8521A', fontWeight: 700, textDecoration: 'none' }}>
          Sign in →
        </Link>
      </p>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {[1, 2].map(s => (
          <div
            key={s}
            style={{
              flex: 1, height: 4, borderRadius: 2,
              background: s <= step ? '#E8521A' : '#F0EBE3',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: '#FCEBEB', border: '1px solid #F7C1C1',
          borderRadius: 10, padding: '10px 14px',
          fontSize: 13, color: '#791F1F',
          marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>⚠️</span> {error}
        </div>
      )}

      {/* ── STEP 1: Role ── */}
      {step === 1 && (
        <>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1207', marginBottom: 12 }}>
            I want to join as a...
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
            {ROLES.map(r => (
              <div
                key={r.id}
                onClick={() => setForm(f => ({ ...f, role: r.id }))}
                style={{
                  border: `2px solid ${form.role === r.id ? '#E8521A' : '#F0EBE3'}`,
                  borderRadius: 14, padding: '18px 14px',
                  cursor: 'pointer', background: form.role === r.id ? '#FFF3EE' : '#fff',
                  textAlign: 'center', transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{r.emoji}</div>
                <div style={{
                  fontSize: 14, fontWeight: 800,
                  color: form.role === r.id ? '#E8521A' : '#1A1207',
                  marginBottom: 3,
                }}>
                  {r.label}
                </div>
                <div style={{ fontSize: 12, color: '#B0A396' }}>{r.sub}</div>
              </div>
            ))}
          </div>

          {/* Role perks */}
          <div style={{
            background: form.role === 'rider' ? '#1A1207' : '#FFF3EE',
            borderRadius: 12, padding: '14px 16px',
            marginBottom: 24,
            transition: 'background 0.3s',
          }}>
            {form.role === 'customer' ? (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#E8521A', marginBottom: 8 }}>
                  As a customer you get:
                </div>
                {['Order from 120+ restaurants', 'Live rider tracking on map', 'M-Pesa payments — no card', 'Reorder favourites in one tap'].map(p => (
                  <div key={p} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 13, color: '#6B5E52', marginBottom: 5,
                  }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#E8521A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4l1.8 2L6.5 2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    {p}
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#E8521A', marginBottom: 8 }}>
                  As a Scott rider you get:
                </div>
                {['Earn KES 150–400 per delivery', 'Set your own hours and zones', 'Weekly M-Pesa payouts', 'Free Scott rider gear'].map(p => (
                  <div key={p} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 5,
                  }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#E8521A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4l1.8 2L6.5 2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    {p}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setStep(2)}
            style={{
              width: '100%', padding: '15px',
              background: '#E8521A', color: '#fff',
              border: 'none', borderRadius: 12,
              fontSize: 16, fontWeight: 800,
              cursor: 'pointer', letterSpacing: '-0.2px',
            }}
          >
            Continue as {form.role === 'customer' ? 'Customer' : 'Rider'} →
          </button>
        </>
      )}

      {/* ── STEP 2: Details ── */}
      {step === 2 && (
        <form onSubmit={handleSubmit}>
          {/* Back button */}
          <button
            type="button"
            onClick={() => setStep(1)}
            style={{
              background: 'none', border: 'none',
              fontSize: 13, color: '#B0A396',
              fontWeight: 600, cursor: 'pointer',
              padding: 0, marginBottom: 18,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Back to role selection
          </button>

          <AuthField
            label="Full name"
            type="text"
            placeholder="Jane Wanjiku"
            value={form.username}
            onChange={set('username')}
            icon={<UserIcon />}
          />

          <AuthField
            label="Email address"
            type="email"
            placeholder="jane@example.com"
            value={form.email}
            onChange={set('email')}
            icon={<MailIcon />}
          />

          <AuthField
            label="Phone number (M-Pesa)"
            type="tel"
            placeholder="0712 345 678"
            value={form.phone_number}
            onChange={set('phone_number')}
            icon={<PhoneIcon />}
          />

          <AuthField
            label="Password"
            type="password"
            placeholder="Create a strong password"
            value={form.password}
            onChange={set('password')}
            icon={<LockIcon />}
          />

          {/* Password strength */}
          {form.password.length > 0 && (
            <div style={{ marginBottom: 16, marginTop: -10 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{
                    flex: 1, height: 3, borderRadius: 2,
                    background: i <= passStrength
                      ? passStrength === 1 ? '#E24B4A'
                        : passStrength === 2 ? '#BA7517'
                        : '#1D9E75'
                      : '#F0EBE3',
                    transition: 'background 0.2s',
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {PASSWORD_CHECKS.map(c => (
                  <div key={c.label} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 11, color: c.test(form.password) ? '#1D9E75' : '#B0A396',
                  }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      {c.test(form.password)
                        ? <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        : <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
                      }
                    </svg>
                    {c.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          <AuthField
            label="Confirm password"
            type="password"
            placeholder="Repeat your password"
            value={form.password2}
            onChange={set('password2')}
            icon={<LockIcon />}
          />

          {/* Password match indicator */}
          {form.password2.length > 0 && (
            <div style={{
              fontSize: 12, marginTop: -10, marginBottom: 16,
              color: form.password === form.password2 ? '#1D9E75' : '#E24B4A',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                {form.password === form.password2
                  ? <path d="M2.5 6l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  : <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                }
              </svg>
              {form.password === form.password2 ? 'Passwords match' : 'Passwords do not match'}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '15px',
              background: loading ? '#F0EBE3' : '#E8521A',
              color: loading ? '#B0A396' : '#fff',
              border: 'none', borderRadius: 12,
              fontSize: 16, fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '-0.2px',
            }}
          >
            {loading
              ? 'Creating your account...'
              : `Create ${form.role === 'rider' ? 'rider' : 'customer'} account →`
            }
          </button>

          <p style={{
            fontSize: 12, color: '#C5B8AD',
            textAlign: 'center', marginTop: 16, lineHeight: 1.6,
          }}>
            By creating an account you agree to Scott's{' '}
            <span style={{ color: '#E8521A', cursor: 'pointer' }}>Terms of Service</span>
            {' '}and{' '}
            <span style={{ color: '#E8521A', cursor: 'pointer' }}>Privacy Policy</span>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}