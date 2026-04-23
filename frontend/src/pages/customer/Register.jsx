import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    username: '', email: '', phone_number: '',
    password: '', password2: '', role: 'customer',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate      = useNavigate();

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await register(form);
      loginUser(res.data.tokens, res.data.user);
      navigate(res.data.user.role === 'rider' ? '/rider' : '/orders');
    } catch (err) {
      const data = err.response?.data || {};
      const first = Object.values(data)[0];
      setError(Array.isArray(first) ? first[0] : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>🛵 Scott Delivery</h1>
        <h2 style={styles.title}>Create Account</h2>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {[
            { name: 'username',     label: 'Username',     type: 'text',     placeholder: 'johndoe' },
            { name: 'email',        label: 'Email',         type: 'email',    placeholder: 'john@example.com' },
            { name: 'phone_number', label: 'Phone Number',  type: 'tel',      placeholder: '0712345678' },
            { name: 'password',     label: 'Password',      type: 'password', placeholder: '••••••••' },
            { name: 'password2',    label: 'Confirm Password', type: 'password', placeholder: '••••••••' },
          ].map(f => (
            <div key={f.name}>
              <label style={styles.label}>{f.label}</label>
              <input
                style={styles.input}
                name={f.name} type={f.type}
                placeholder={f.placeholder}
                value={form[f.name]}
                onChange={handleChange}
                required
              />
            </div>
          ))}

          <label style={styles.label}>I am a</label>
          <select
            style={styles.input}
            name="role"
            value={form.role}
            onChange={handleChange}
          >
            <option value="customer">Customer</option>
            <option value="rider">Rider</option>
          </select>

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={styles.link}>
          Have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f9fafb' },
  card:      { background:'#fff', padding:'40px 32px', borderRadius:16, boxShadow:'0 4px 24px rgba(0,0,0,0.08)', width:'100%', maxWidth:420 },
  logo:      { textAlign:'center', fontSize:28, marginBottom:4 },
  title:     { textAlign:'center', fontSize:20, fontWeight:600, marginBottom:24, color:'#374151' },
  error:     { background:'#fee2e2', color:'#dc2626', padding:10, borderRadius:8, marginBottom:16, fontSize:14 },
  label:     { display:'block', fontSize:14, fontWeight:500, color:'#374151', marginBottom:6 },
  input:     { width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:15, marginBottom:16, boxSizing:'border-box' },
  button:    { width:'100%', padding:12, background:'#16a34a', color:'#fff', border:'none', borderRadius:8, fontSize:16, fontWeight:600, cursor:'pointer', marginTop:4 },
  link:      { textAlign:'center', marginTop:16, fontSize:14, color:'#6b7280' },
};