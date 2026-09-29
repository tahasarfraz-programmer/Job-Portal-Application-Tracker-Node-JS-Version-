import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { unwrap } from '../services/api';
import JobCard from '../components/JobCard';

const STEPS = [['Build a profile', 'Add your skills and upload one resume.'], ['Apply in minutes', 'Send a cover letter to any open role.'], ['Follow every step', 'Your tracker shows where each application stands.']];

export default function Home() {
  const [q, setQ] = useState('');
  const [jobs, setJobs] = useState([]);
  const [cats, setCats] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    unwrap(api.get('/jobs', { params: { limit: 4 } })).then((d) => setJobs(d.items)).catch(() => {});
    unwrap(api.get('/jobs/categories')).then(setCats).catch(() => {});
  }, []);

  return (
    <>
      <section className="border-b border-line bg-ink text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight md:text-6xl">Apply once. Know where you stand every time.</h1>
          <p className="mt-4 max-w-xl text-lg text-white/75">Hirewell pairs a job board with a live application tracker, so candidates and hiring teams always see the same status.</p>
          <form onSubmit={(e) => { e.preventDefault(); navigate(`/jobs?q=${encodeURIComponent(q)}`); }} className="mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
            <input aria-label="Search jobs" className="input flex-1 text-ink" placeholder="Job title, skill or company" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn bg-amber text-ink hover:bg-amber/90">Search jobs</button>
          </form>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-4 text-2xl font-bold">Latest openings</h2>
        <div className="space-y-3">{jobs.map((j) => <JobCard key={j._id} job={j} />)}</div>
        {jobs.length === 0 && <p className="text-ink/60">No jobs yet. Run the seed script to add demo data.</p>}
      </section>
      {cats.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-12">
          <h2 className="mb-4 text-2xl font-bold">Browse by category</h2>
          <div className="flex flex-wrap gap-2">{cats.map((c) => <Link key={c._id} to={`/jobs?category=${c.slug}`} className="btn btn-ghost">{c.name}</Link>)}</div>
        </section>
      )}
      <section className="bg-white py-12">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-3">
          {STEPS.map(([t, d], i) => <div key={t}><p className="font-display text-3xl font-extrabold text-teal">{i + 1}</p><h3 className="text-lg font-bold">{t}</h3><p className="text-ink/70">{d}</p></div>)}
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 md:grid-cols-2">
        <div className="card p-6"><h3 className="text-xl font-bold">Looking for your next role?</h3><p className="my-2 text-ink/70">Search, save and apply from one place.</p><Link to="/register" className="btn">Create a candidate account</Link></div>
        <div className="card p-6"><h3 className="text-xl font-bold">Hiring?</h3><p className="my-2 text-ink/70">Post roles and move applicants through your pipeline.</p><Link to="/register" className="btn btn-ghost">Create an employer account</Link></div>
      </section>
    </>
  );
}
