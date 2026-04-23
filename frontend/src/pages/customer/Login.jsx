import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [form,    setForm]    = useState({ phone_number: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate      = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(form);
      loginUser(res.data.tokens, res.data.user);

      // Route based on role
      const role = res.data.user.role;
      if (role === 'rider')  navigate('/rider');
      else if (role === 'admin') navigate('/admin');
      else navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>🛵 Scott Delivery</h1>
        <h2 style={styles.title}>Sign In</h2>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Phone Number</label>
          <input
            style={styles.input}
            type="tel"
            placeholder="0712345678"
            value={form.phone_number}
            onChange={e => setForm({ ...form, phone_number: e.target.value })}
            required
          />

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.link}>
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' },
  card:      { background: '#fff', padding: '40px 32px', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: 400 },
  logo:      { textAlign: 'center', fontSize: 28, marginBottom: 4 },
  title:     { textAlign: 'center', fontSize: 20, fontWeight: 600, marginBottom: 24, color: '#374151' },
  error:     { background: '#fee2e2', color: '#dc2626', padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 14 },
  label:     { display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 },
  input:     { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, marginBottom: 16, boxSizing: 'border-box' },
  button:    { width: '100%', padding: '12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  link:      { textAlign: 'center', marginTop: 16, fontSize: 14, color: '#6b7280' },
};