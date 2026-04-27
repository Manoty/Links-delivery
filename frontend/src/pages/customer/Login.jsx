import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/shared/Toast';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthField from '../../components/auth/AuthField';
import { PhoneIcon, LockIcon, GoogleIcon } from '../../components/auth/AuthIcons';

export default function Login() {
  const [form,    setForm]    = useState({ phone_number: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const { loginUser } = useAuth();
  const navigate      = useNavigate();
  const toast         = useToast();

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res  = await login(form);
      const role = res.data.user.role;
      loginUser(res.data.tokens, res.data.user);
      toast.success(`Welcome back! 👋`);
      if (role === 'rider')      navigate('/rider');
      else if (role === 'admin') navigate('/admin');
      else                       navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || 'Incorrect phone number or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="login">
      {/* Tab switcher */}
      <div style={{
        display: 'flex', gap: 4,
        background: '#F0EBE3',
        borderRadius: 12, padding: 4,
        marginBottom: 28,
      }}>
        {[
          { label: 'Sign in',        active: true,  to: '/login'    },
          { label: 'Create account', active: false, to: '/register' },
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
              transition: 'all 0.15s',
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
          WELCOME BACK
        </span>
      </div>

      <h1 style={{
        fontSize: 28, fontWeight: 900, color: '#1A1207',
        letterSpacing: '-0.5px', marginBottom: 6,
      }}>
        Sign in to Scott.
      </h1>
      <p style={{ fontSize: 14, color: '#B0A396', marginBottom: 28, lineHeight: 1.5 }}>
        No account?{' '}
        <Link to="/register" style={{ color: '#E8521A', fontWeight: 700, textDecoration: 'none' }}>
          Create one free →
        </Link>
      </p>

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

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <AuthField
          label="Phone number"
          type="tel"
          placeholder="0712 345 678"
          value={form.phone_number}
          onChange={set('phone_number')}
          icon={<PhoneIcon />}
        />

        <AuthField
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={form.password}
          onChange={set('password')}
          icon={<LockIcon />}
          hint={
            <Link to="/forgot-password"
              style={{ color: '#E8521A', fontWeight: 600, textDecoration: 'none', fontSize: 12 }}>
              Forgot password?
            </Link>
          }
        />

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
            transition: 'background 0.15s',
            marginTop: 4,
          }}
        >
          {loading ? 'Signing in...' : 'Sign in to Scott →'}
        </button>
      </form>

      {/* Divider */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        margin: '20px 0',
      }}>
        <div style={{ flex: 1, height: 1, background: '#F0EBE3' }} />
        <span style={{ fontSize: 12, color: '#C5B8AD', fontWeight: 500 }}>
          or continue with
        </span>
        <div style={{ flex: 1, height: 1, background: '#F0EBE3' }} />
      </div>

      {/* Google */}
      <button
        type="button"
        style={{
          width: '100%', padding: '12px 14px',
          border: '1.5px solid #F0EBE3',
          borderRadius: 12, background: '#fff',
          fontSize: 14, fontWeight: 700,
          color: '#1A1207', cursor: 'pointer',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 10,
          fontFamily: 'inherit',
        }}
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <p style={{
        fontSize: 12, color: '#C5B8AD',
        textAlign: 'center', marginTop: 20, lineHeight: 1.6,
      }}>
        By signing in you agree to Scott's{' '}
        <span style={{ color: '#E8521A', cursor: 'pointer' }}>Terms of Service</span>
        {' '}and{' '}
        <span style={{ color: '#E8521A', cursor: 'pointer' }}>Privacy Policy</span>
      </p>
    </AuthLayout>
  );
}