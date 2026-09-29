import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errorMessage, unwrap } from '../services/api';
import { Empty, Field, Spinner, StatusBadge } from '../components/ui';

const STATUS_OPTIONS = ['applied', 'under-review', 'shortlisted', 'interview', 'offered', 'rejected', 'hired'];

export function EmployerDashboard() {
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState(null);
  const load = () => { unwrap(api.get('/employer/stats')).then(setStats); unwrap(api.get('/jobs/mine')).then(setJobs); };
  useEffect(load, []);
  if (!stats || !jobs) return <Spinner />;
  const cards = [['Total jobs', stats.totalJobs], ['Active jobs', stats.activeJobs], ['Applications', stats.totalApplications], ['Shortlisted', stats.shortlisted], ['Interviews', stats.interviews], ['Hired', stats.hired]];
  const max = Math.max(1, ...Object.values(stats.byStatus));
  const toggle = async (j) => { await api.put(`/jobs/${j._id}`, { status: j.status === 'active' ? 'inactive' : 'active' }); load(); };
  const del = async (j) => { if (window.confirm(`Delete "${j.title}" and its applications?`)) { await api.delete(`/jobs/${j._id}`); toast.success('Job deleted'); load(); } };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Employer dashboard</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{cards.map(([l, n]) => <div key={l} className="card p-4"><p className="font-display text-3xl font-extrabold">{n}</p><p className="text-sm text-ink/70">{l}</p></div>)}</div>
      {stats.totalApplications > 0 && (
        <div className="card p-4"><h2 className="mb-2 font-bold">Pipeline</h2>
          {Object.entries(stats.byStatus).map(([s, n]) => <div key={s} className="mb-1 flex items-center gap-2 text-sm"><span className="w-24"><StatusBadge status={s} /></span><div className="h-3 rounded bg-teal" style={{ width: `${(n / max) * 70}%` }} /><span>{n}</span></div>)}
        </div>
      )}
      <div>
        <div className="mb-2 flex items-center justify-between"><h2 className="text-lg font-bold">Your jobs</h2><Link to="/app/employer/jobs/new" className="btn">Post a job</Link></div>
        {jobs.length === 0 ? <Empty title="No jobs posted" hint="Create your company profile, then post your first role." action={{ to: '/app/employer/company', label: 'Set up company' }} /> : (
          <div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-paper"><tr>{['Title', 'Status', 'Applicants', ''].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
            <tbody>{jobs.map((j) => (
              <tr key={j._id} className="border-t border-line"><td className="px-3 py-2 font-semibold">{j.title}</td><td className="px-3 py-2">{j.status}</td><td className="px-3 py-2">{j.applicants}</td>
                <td className="flex flex-wrap gap-2 px-3 py-2"><Link className="font-semibold text-teal" to={`/app/employer/jobs/${j._id}/applicants`}>Applicants</Link><Link className="font-semibold text-teal" to={`/app/employer/jobs/${j._id}/edit`}>Edit</Link>
                  <button className="font-semibold text-teal" onClick={() => toggle(j)}>{j.status === 'active' ? 'Deactivate' : 'Activate'}</button><button className="font-semibold text-rose-600" onClick={() => del(j)}>Delete</button></td></tr>))}</tbody></table></div>)}
      </div>
    </div>
  );
}

const useForm = (initial) => { const [f, setF] = useState(initial); return [f, (k) => (e) => setF({ ...f, [k]: e.target.value }), setF]; };

export function CompanyForm() {
  const [f, set, setF] = useForm({ name: '', industry: '', website: '', location: '', size: '', foundedYear: '', contactEmail: '', description: '' });
  useEffect(() => { unwrap(api.get('/companies/mine')).then((c) => c && setF((old) => ({ ...old, ...c }))); }, []);
  const save = async (e) => { e.preventDefault(); try { await api.put('/companies/mine', f); toast.success('Company saved'); } catch (err) { toast.error(errorMessage(err)); } };
  return (
    <form onSubmit={save} className="card grid gap-3 p-5 md:grid-cols-2">
      <h1 className="text-2xl font-bold md:col-span-2">Company profile</h1>
      {['name', 'industry', 'website', 'location', 'size', 'foundedYear', 'contactEmail'].map((k) => <Field key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}><input required={k === 'name'} className="input" value={f[k] || ''} onChange={set(k)} /></Field>)}
      <div className="md:col-span-2"><Field label="Description"><textarea rows={4} className="input" value={f.description || ''} onChange={set('description')} /></Field></div>
      <button className="btn md:col-span-2">Save company</button>
    </form>
  );
}

export function JobForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cats, setCats] = useState([]);
  const [f, set, setF] = useForm({ title: '', description: '', category: '', location: '', workMode: 'on-site', employmentType: 'full-time', experienceLevel: 'entry', salaryMin: '', salaryMax: '', deadline: '', skills: '', requirements: '', responsibilities: '', benefits: '' });
  useEffect(() => {
    unwrap(api.get('/jobs/categories')).then(setCats);
    if (id) unwrap(api.get(`/jobs/${id}`)).then(({ job }) => setF({ ...job, category: job.category?._id || '', deadline: job.deadline?.slice(0, 10) || '', skills: job.skills.join(', '), requirements: job.requirements.join(', '), responsibilities: job.responsibilities.join(', '), benefits: job.benefits.join(', ') }));
  }, [id]);
  const save = async (e) => {
    e.preventDefault();
    const body = { ...f, category: f.category || undefined, deadline: f.deadline || undefined, salaryMin: f.salaryMin || undefined, salaryMax: f.salaryMax || undefined };
    try { await (id ? api.put(`/jobs/${id}`, body) : api.post('/jobs', body)); toast.success('Job saved'); navigate('/app/employer'); } catch (err) { toast.error(errorMessage(err)); }
  };
  const opt = (arr) => arr.map((o) => <option key={o}>{o}</option>);
  return (
    <form onSubmit={save} className="card grid gap-3 p-5 md:grid-cols-2">
      <h1 className="text-2xl font-bold md:col-span-2">{id ? 'Edit job' : 'Post a job'}</h1>
      <Field label="Job title"><input required className="input" value={f.title} onChange={set('title')} /></Field>
      <Field label="Category"><select className="input" value={f.category} onChange={set('category')}><option value="">Choose…</option>{cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></Field>
      <Field label="Location"><input className="input" value={f.location || ''} onChange={set('location')} /></Field>
      <Field label="Work mode"><select className="input" value={f.workMode} onChange={set('workMode')}>{opt(['on-site', 'hybrid', 'remote'])}</select></Field>
      <Field label="Employment type"><select className="input" value={f.employmentType} onChange={set('employmentType')}>{opt(['full-time', 'part-time', 'contract', 'internship', 'freelance'])}</select></Field>
      <Field label="Experience level"><select className="input" value={f.experienceLevel} onChange={set('experienceLevel')}>{opt(['entry', 'mid', 'senior', 'lead'])}</select></Field>
      <Field label="Minimum salary"><input type="number" min="0" className="input" value={f.salaryMin || ''} onChange={set('salaryMin')} /></Field>
      <Field label="Maximum salary"><input type="number" min="0" className="input" value={f.salaryMax || ''} onChange={set('salaryMax')} /></Field>
      <Field label="Application deadline"><input type="date" className="input" value={f.deadline || ''} onChange={set('deadline')} /></Field>
      <div className="md:col-span-2"><Field label="Description"><textarea required rows={5} className="input" value={f.description} onChange={set('description')} /></Field></div>
      {['skills', 'requirements', 'responsibilities', 'benefits'].map((k) => <Field key={k} label={`${k[0].toUpperCase()}${k.slice(1)} (comma separated)`}><input className="input" value={f[k]} onChange={set(k)} /></Field>)}
      <button className="btn md:col-span-2">Save job</button>
    </form>
  );
}

export function Applicants() {
  const { id } = useParams();
  const [apps, setApps] = useState(null);
  const [sched, setSched] = useState(null);
  const [iv, setIv] = useState({ scheduledAt: '', type: 'video', locationOrLink: '', notes: '' });
  const load = () => unwrap(api.get(`/jobs/${id}/applicants`)).then(setApps).catch((e) => toast.error(errorMessage(e)));
  useEffect(() => { load(); }, [id]);
  if (!apps) return <Spinner />;
  const setStatus = async (a, status) => { try { await api.patch(`/applications/${a._id}/status`, { status }); toast.success('Status updated'); load(); } catch (e) { toast.error(errorMessage(e)); } };
  const viewResume = async (c) => { const r = await api.get(`/users/${c._id}/resume`, { responseType: 'blob' }); window.open(URL.createObjectURL(r.data), '_blank'); };
  const schedule = async (e) => {
    e.preventDefault();
    try { await api.post(`/interviews/application/${sched}`, iv); toast.success('Interview scheduled'); setSched(null); load(); } catch (err) { toast.error(errorMessage(err)); }
  };
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Applicants</h1>
      {apps.length === 0 && <Empty title="No applicants yet" hint="Applications will appear here as candidates apply." />}
      {apps.map((a) => (
        <div key={a._id} className="card space-y-2 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-bold">{a.candidate.name}</h2><p className="text-sm text-ink/70">{a.candidate.profile?.title} • {a.candidate.email}</p></div><StatusBadge status={a.status} /></div>
          <p className="whitespace-pre-line text-sm">{a.coverLetter}</p>
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Update status" className="input w-auto" value={a.status} onChange={(e) => setStatus(a, e.target.value)}>{a.status === 'withdrawn' ? <option>withdrawn</option> : STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}</select>
            <button className="btn btn-ghost" onClick={() => viewResume(a.candidate)}>View resume</button>
            <button className="btn btn-ghost" onClick={() => setSched(a._id)}>Schedule interview</button>
          </div>
          {sched === a._id && (
            <form onSubmit={schedule} className="grid gap-2 rounded-lg bg-paper p-3 md:grid-cols-2">
              <input required type="datetime-local" className="input" value={iv.scheduledAt} onChange={(e) => setIv({ ...iv, scheduledAt: e.target.value })} />
              <select className="input" value={iv.type} onChange={(e) => setIv({ ...iv, type: e.target.value })}><option>phone</option><option>video</option><option>in-person</option></select>
              <input className="input" placeholder="Location or link" value={iv.locationOrLink} onChange={(e) => setIv({ ...iv, locationOrLink: e.target.value })} />
              <input className="input" placeholder="Notes" value={iv.notes} onChange={(e) => setIv({ ...iv, notes: e.target.value })} />
              <button className="btn md:col-span-2">Save interview</button>
            </form>)}
        </div>))}
    </div>
  );
}
