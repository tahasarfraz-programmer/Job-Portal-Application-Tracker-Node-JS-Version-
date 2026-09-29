import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { errorMessage, unwrap } from '../services/api';
import { Spinner } from '../components/ui';

const TABS = ['users', 'companies', 'jobs', 'applications', 'categories'];

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('users');
  const [rows, setRows] = useState(null);
  const [cat, setCat] = useState('');
  const load = () => {
    setRows(null);
    unwrap(api.get(tab === 'categories' ? '/jobs/categories' : `/admin/${tab}`)).then(setRows).catch((e) => toast.error(errorMessage(e)));
  };
  useEffect(() => { unwrap(api.get('/admin/stats')).then(setStats); }, []);
  useEffect(load, [tab]);
  if (!stats) return <Spinner />;
  const cards = [['Users', stats.users], ['Employers', stats.employers], ['Candidates', stats.candidates], ['Jobs', stats.jobs], ['Active jobs', stats.activeJobs], ['Applications', stats.applications]];
  const act = async (fn) => { try { await fn(); load(); } catch (e) { toast.error(errorMessage(e)); } };
  const label = (r) => r.name || r.title || `${r.candidate?.name} → ${r.job?.title}`;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Platform overview</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{cards.map(([l, n]) => <div key={l} className="card p-4"><p className="font-display text-3xl font-extrabold">{n}</p><p className="text-sm text-ink/70">{l}</p></div>)}</div>
      <div className="flex gap-1 overflow-x-auto">{TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={`btn ${tab === t ? '' : 'btn-ghost'} capitalize`}>{t}</button>)}</div>
      {tab === 'categories' && <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); act(async () => { await api.post('/admin/categories', { name: cat }); setCat(''); }); }}><input className="input" placeholder="New category" value={cat} onChange={(e) => setCat(e.target.value)} /><button className="btn">Add</button></form>}
      {!rows ? <Spinner /> : (
        <div className="card divide-y divide-line">{rows.map((r) => (
          <div key={r._id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
            <span><b>{label(r)}</b> {r.email && `• ${r.email}`} {r.role && `• ${r.role}`} {r.status && `• ${r.status}`}</span>
            <span className="flex gap-3">
              {tab === 'users' && r.role !== 'admin' && <><button className="font-semibold text-teal" onClick={() => act(() => api.patch(`/admin/users/${r._id}/toggle`))}>{r.isActive ? 'Deactivate' : 'Activate'}</button><button className="font-semibold text-rose-600" onClick={() => window.confirm('Delete this user?') && act(() => api.delete(`/admin/users/${r._id}`))}>Delete</button></>}
              {tab === 'jobs' && <button className="font-semibold text-rose-600" onClick={() => window.confirm('Remove this listing?') && act(() => api.delete(`/jobs/${r._id}`))}>Remove</button>}
              {tab === 'categories' && <button className="font-semibold text-rose-600" onClick={() => act(() => api.delete(`/admin/categories/${r._id}`))}>Delete</button>}
            </span>
          </div>))}
          {rows.length === 0 && <p className="p-4 text-ink/60">Nothing here yet.</p>}
        </div>)}
    </div>
  );
}
