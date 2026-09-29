import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/api';
import { Field } from '../components/ui';

const HOME = { seeker: '/app/tracker', employer: '/app/employer', admin: '/app/admin' };

function AuthForm({ mode }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'seeker' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setBusy(true);
    try {
      const user = await (mode === 'login' ? login(form) : register(form));
      navigate(location.state?.from?.pathname || HOME[user.role], { replace: true });
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <form onSubmit={submit} className="card space-y-4 p-6">
        <h1 className="text-2xl font-bold">{mode === 'login' ? 'Log in to Hirewell' : 'Create your account'}</h1>
        {mode === 'register' && <Field label="Full name"><input required className="input" value={form.name} onChange={set('name')} /></Field>}
        <Field label="Email"><input required type="email" className="input" value={form.email} onChange={set('email')} /></Field>
        <Field label="Password"><input required type="password" className="input" value={form.password} onChange={set('password')} /></Field>
        {mode === 'register' && (
          <Field label="I am">
            <select className="input" value={form.role} onChange={set('role')}><option value="seeker">Looking for a job</option><option value="employer">Hiring for a company</option></select>
          </Field>
        )}
        <button className="btn w-full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button>
        <p className="text-center text-sm">{mode === 'login' ? <>New here? <Link className="font-semibold text-teal" to="/register">Create an account</Link></> : <>Already registered? <Link className="font-semibold text-teal" to="/login">Log in</Link></>}</p>
      </form>
    </div>
  );
}

export const Login = () => <AuthForm mode="login" />;
export const Register = () => <AuthForm mode="register" />;
