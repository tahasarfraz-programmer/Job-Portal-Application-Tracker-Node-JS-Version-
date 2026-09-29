import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errorMessage, unwrap } from '../services/api';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';
import { Field, Spinner, money } from '../components/ui';
import { NotFound } from './StatusPages';

const List = ({ title, items }) => items?.length > 0 && (
  <section className="mt-6"><h2 className="text-lg font-bold">{title}</h2><ul className="mt-2 list-disc space-y-1 pl-5">{items.map((i) => <li key={i}>{i}</li>)}</ul></section>
);

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [missing, setMissing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [form, setForm] = useState({ coverLetter: '', additionalInfo: '' });

  useEffect(() => { setData(null); unwrap(api.get(`/jobs/${id}`)).then(setData).catch(() => setMissing(true)); }, [id]);
  if (missing) return <NotFound />;
  if (!data) return <Spinner />;
  const { job, related } = data;

  const apply = async (e) => {
    e.preventDefault();
    try { await api.post(`/jobs/${id}/apply`, form); toast.success('Application submitted'); navigate('/app/tracker'); } catch (err) { toast.error(errorMessage(err)); }
  };
  const save = async () => { try { await api.put(`/saved-jobs/${id}`); toast.success('Job saved'); } catch (err) { toast.error(errorMessage(err)); } };
  const share = async () => { await navigator.clipboard?.writeText(window.location.href); toast.success('Link copied'); };

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_20rem]">
      <article className="card p-6">
        <h1 className="text-3xl font-bold">{job.title}</h1>
        <p className="mt-1 text-ink/70">{job.company?.name} • {job.location} • {job.workMode}</p>
        <p className="mt-2 font-semibold">{money(job.salaryMin, job.salaryMax)} • {job.employmentType} • {job.experienceLevel}</p>
        <p className="text-sm text-ink/60">Posted {new Date(job.createdAt).toLocaleDateString()}{job.deadline && ` • Apply by ${new Date(job.deadline).toLocaleDateString()}`}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(!user || user.role === 'seeker') && <button className="btn" onClick={() => (user ? setApplying(true) : navigate('/login', { state: { from: { pathname: `/jobs/${id}` } } }))}>Apply now</button>}
          {user?.role === 'seeker' && <button className="btn btn-ghost" onClick={save}>Save job</button>}
          <button className="btn btn-ghost" onClick={share}>Share job</button>
        </div>
        {applying && (
          <form onSubmit={apply} className="mt-6 space-y-3 rounded-lg border border-line bg-paper p-4">
            <Field label="Cover letter"><textarea required minLength={20} rows={5} className="input" value={form.coverLetter} onChange={(e) => setForm({ ...form, coverLetter: e.target.value })} /></Field>
            <Field label="Anything else? (optional)"><textarea rows={2} className="input" value={form.additionalInfo} onChange={(e) => setForm({ ...form, additionalInfo: e.target.value })} /></Field>
            <p className="text-sm text-ink/70">Your profile resume is attached automatically. <Link className="font-semibold text-teal" to="/app/profile">Update resume</Link></p>
            <button className="btn">Submit application</button>
          </form>
        )}
        <section className="mt-6"><h2 className="text-lg font-bold">About the role</h2><p className="mt-2 whitespace-pre-line">{job.description}</p></section>
        <List title="Responsibilities" items={job.responsibilities} />
        <List title="Requirements" items={job.requirements} />
        <List title="Skills" items={job.skills} />
        <List title="Benefits" items={job.benefits} />
      </article>
      <aside className="space-y-4">
        {job.company && (
          <div className="card p-5">
            <h2 className="text-lg font-bold">{job.company.name}</h2>
            <p className="text-sm text-ink/70">{job.company.industry} • {job.company.size} employees</p>
            <p className="mt-2 text-sm">{job.company.description}</p>
          </div>
        )}
        {related.length > 0 && <div><h2 className="mb-2 text-lg font-bold">Related jobs</h2><div className="space-y-2">{related.map((r) => <JobCard key={r._id} job={r} />)}</div></div>}
      </aside>
    </div>
  );
}
