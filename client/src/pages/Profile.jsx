import { useState } from 'react';
import toast from 'react-hot-toast';
import api, { errorMessage, unwrap } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Field } from '../components/ui';

const TEXT = ['title', 'phone', 'location', 'linkedin', 'github', 'website', 'preferredJobType', 'preferredLocation', 'expectedSalary'];
const LISTS = ['skills', 'education', 'experience', 'certifications'];

export default function Profile() {
  const { user, setUser } = useAuth();
  const p = user.profile || {};
  const [name, setName] = useState(user.name);
  const [form, setForm] = useState(() => ({ ...Object.fromEntries(TEXT.map((k) => [k, p[k] ?? ''])), ...Object.fromEntries(LISTS.map((k) => [k, (p[k] || []).join(', ')])), bio: p.bio || '' }));
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    try { setUser(await unwrap(api.put('/users/profile', { name, profile: form }))); toast.success('Profile saved'); } catch (err) { toast.error(errorMessage(err)); }
  };
  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Resume must be smaller than 5 MB');
    const body = new FormData(); body.append('resume', file);
    try { setUser(await unwrap(api.post('/users/resume', body))); toast.success('Resume uploaded'); } catch (err) { toast.error(errorMessage(err)); }
  };
  const remove = async () => { setUser(await unwrap(api.delete('/users/resume'))); toast.success('Resume removed'); };
  const download = async () => {
    const res = await api.get(`/users/${user.id}/resume`, { responseType: 'blob' });
    window.open(URL.createObjectURL(res.data), '_blank');
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <h1 className="text-2xl font-bold">My profile</h1>
      <section className="card space-y-3 p-5">
        <h2 className="font-bold">Resume</h2>
        {user.resume ? <p className="flex flex-wrap items-center gap-2">{user.resume}<button type="button" className="btn btn-ghost" onClick={download}>View</button><button type="button" className="btn btn-ghost" onClick={remove}>Delete</button></p> : <p className="text-ink/70">No resume yet. You need one to apply for jobs.</p>}
        <input type="file" accept=".pdf,.doc,.docx" onChange={upload} aria-label="Upload resume" />
      </section>
      <section className="card grid gap-3 p-5 md:grid-cols-2">
        <Field label="Full name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} required /></Field>
        {TEXT.map((k) => <Field key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}><input className="input" type={k === 'expectedSalary' ? 'number' : 'text'} value={form[k]} onChange={set(k)} /></Field>)}
        <div className="md:col-span-2"><Field label="Bio"><textarea rows={3} className="input" value={form.bio} onChange={set('bio')} /></Field></div>
        {LISTS.map((k) => <Field key={k} label={`${k[0].toUpperCase()}${k.slice(1)} (comma separated)`}><input className="input" value={form[k]} onChange={set(k)} /></Field>)}
      </section>
      <button className="btn">Save profile</button>
    </form>
  );
}
