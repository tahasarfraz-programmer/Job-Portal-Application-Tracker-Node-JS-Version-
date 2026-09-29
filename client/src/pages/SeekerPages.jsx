import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errorMessage, unwrap } from '../services/api';
import JobCard from '../components/JobCard';
import { Empty, Spinner, StatusBadge, Timeline } from '../components/ui';

const fmt = (d) => new Date(d).toLocaleDateString();

export function Tracker() {
  const [apps, setApps] = useState(null);
  const [view, setView] = useState('table');
  const [filter, setFilter] = useState('');
  const load = () => unwrap(api.get('/applications/mine')).then(setApps).catch((e) => toast.error(errorMessage(e)));
  useEffect(() => { load(); }, []);
  if (!apps) return <Spinner />;
  const shown = apps.filter((a) => !filter || a.status === filter);
  const withdraw = async (id) => { try { await api.patch(`/applications/${id}/withdraw`); toast.success('Application withdrawn'); load(); } catch (e) { toast.error(errorMessage(e)); } };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Application tracker</h1>
        <div className="flex gap-2">
          <select aria-label="Filter by status" className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All statuses</option>{['applied', 'under-review', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'withdrawn'].map((s) => <option key={s}>{s}</option>)}
          </select>
          <button className="btn btn-ghost" onClick={() => setView(view === 'table' ? 'cards' : 'table')}>{view === 'table' ? 'Card view' : 'Table view'}</button>
        </div>
      </div>
      {shown.length === 0 ? <Empty title="No applications yet" hint="When you apply for a job, it appears here with its live status." action={{ to: '/jobs', label: 'Find jobs' }} /> : view === 'table' ? (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper"><tr>{['Job', 'Company', 'Applied', 'Status', 'Updated', ''].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
            <tbody>{shown.map((a) => (
              <tr key={a._id} className="border-t border-line">
                <td className="px-3 py-2 font-semibold">{a.job?.title}</td><td className="px-3 py-2">{a.job?.company?.name}</td>
                <td className="px-3 py-2">{fmt(a.createdAt)}</td><td className="px-3 py-2"><StatusBadge status={a.status} /></td><td className="px-3 py-2">{fmt(a.updatedAt)}</td>
                <td className="px-3 py-2"><Link className="font-semibold text-teal" to={`/app/tracker/${a._id}`}>Details</Link></td>
              </tr>))}</tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">{shown.map((a) => (
          <div key={a._id} className="card space-y-1 p-4">
            <div className="flex items-start justify-between gap-2"><h2 className="font-bold">{a.job?.title}</h2><StatusBadge status={a.status} /></div>
            <p className="text-sm text-ink/70">{a.job?.company?.name} • {a.job?.location}</p>
            <p className="text-sm">Applied {fmt(a.createdAt)} • Updated {fmt(a.updatedAt)}</p>
            <div className="flex gap-2 pt-2"><Link className="btn" to={`/app/tracker/${a._id}`}>Details</Link><button className="btn btn-ghost" onClick={() => withdraw(a._id)}>Withdraw</button></div>
          </div>))}
        </div>
      )}
    </div>
  );
}

export function ApplicationDetail() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  useEffect(() => { unwrap(api.get(`/applications/${id}`)).then(setApp).catch((e) => toast.error(errorMessage(e))); }, [id]);
  if (!app) return <Spinner />;
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_16rem]">
      <div className="card space-y-3 p-5">
        <h1 className="text-2xl font-bold">{app.job?.title}</h1>
        <p className="text-ink/70">{app.job?.company?.name} • {app.job?.location}</p>
        <StatusBadge status={app.status} />
        <h2 className="pt-2 font-bold">Your cover letter</h2><p className="whitespace-pre-line">{app.coverLetter}</p>
        {app.interviews?.length > 0 && <><h2 className="font-bold">Interviews</h2>{app.interviews.map((i) => (
          <p key={i._id} className="rounded-lg bg-paper p-3 text-sm">{new Date(i.scheduledAt).toLocaleString()} • {i.type}{i.locationOrLink && ` • ${i.locationOrLink}`}{i.notes && <><br />{i.notes}</>}</p>))}</>}
        <Link to="/app/tracker" className="btn btn-ghost">Back to tracker</Link>
      </div>
      <div className="card p-5"><h2 className="mb-3 font-bold">Progress</h2><Timeline status={app.status} history={app.history} /></div>
    </div>
  );
}

export function Saved() {
  const [items, setItems] = useState(null);
  useEffect(() => { unwrap(api.get('/saved-jobs')).then(setItems).catch((e) => toast.error(errorMessage(e))); }, []);
  if (!items) return <Spinner />;
  const remove = async (job) => { await api.delete(`/saved-jobs/${job._id}`); setItems(items.filter((s) => s.job._id !== job._id)); };
  return (
    <div><h1 className="mb-4 text-2xl font-bold">Saved jobs</h1>
      {items.length === 0 ? <Empty title="No saved jobs" hint="Save jobs while browsing to compare them later." action={{ to: '/jobs', label: 'Browse jobs' }} /> : (
        <div className="space-y-3">{items.map((s) => <JobCard key={s._id} job={s.job} saved onSave={remove} />)}</div>)}
    </div>
  );
}
