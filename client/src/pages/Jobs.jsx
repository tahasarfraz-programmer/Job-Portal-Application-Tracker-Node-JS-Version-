import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errorMessage, unwrap } from '../services/api';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';
import { Empty, Spinner } from '../components/ui';

const SELECTS = {
  type: ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
  level: ['entry', 'mid', 'senior', 'lead'],
  mode: ['on-site', 'hybrid', 'remote'],
};

export default function Jobs() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [cats, setCats] = useState([]);
  const [saved, setSaved] = useState(new Set());
  const [hints, setHints] = useState([]);
  const { user } = useAuth();
  const query = Object.fromEntries(params);

  useEffect(() => { unwrap(api.get('/jobs/categories')).then(setCats).catch(() => {}); }, []);
  useEffect(() => {
    setData(null);
    unwrap(api.get('/jobs', { params: query })).then(setData).catch((e) => { toast.error(errorMessage(e)); setData({ items: [], total: 0, pages: 0 }); });
  }, [params]);
  useEffect(() => {
    if (user?.role === 'seeker') unwrap(api.get('/saved-jobs')).then((s) => setSaved(new Set(s.map((x) => x.job._id)))).catch(() => {});
  }, [user]);
  useEffect(() => {
    const t = setTimeout(() => (query.q?.length > 1 ? unwrap(api.get('/jobs/suggestions', { params: { q: query.q } })).then(setHints).catch(() => {}) : setHints([])), 250);
    return () => clearTimeout(t);
  }, [query.q]);

  const setParam = (k, v) => { const p = new URLSearchParams(params); v ? p.set(k, v) : p.delete(k); if (k !== 'page') p.delete('page'); setParams(p); };
  const toggleSave = async (job) => {
    if (user?.role !== 'seeker') return toast('Log in as a candidate to save jobs');
    const has = saved.has(job._id);
    await (has ? api.delete(`/saved-jobs/${job._id}`) : api.put(`/saved-jobs/${job._id}`));
    const next = new Set(saved); has ? next.delete(job._id) : next.add(job._id); setSaved(next);
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[16rem_1fr]">
      <aside className="card h-fit space-y-3 p-4">
        <label className="block text-sm font-semibold">Keyword
          <input className="input mt-1 font-normal" list="hints" value={query.q || ''} onChange={(e) => setParam('q', e.target.value)} placeholder="Title, skill, company" />
          <datalist id="hints">{hints.map((h) => <option key={h} value={h} />)}</datalist>
        </label>
        <label className="block text-sm font-semibold">Location<input className="input mt-1 font-normal" value={query.location || ''} onChange={(e) => setParam('location', e.target.value)} /></label>
        <label className="block text-sm font-semibold">Category
          <select className="input mt-1 font-normal" value={query.category || ''} onChange={(e) => setParam('category', e.target.value)}><option value="">All</option>{cats.map((c) => <option key={c._id} value={c.slug}>{c.name}</option>)}</select>
        </label>
        {Object.entries(SELECTS).map(([k, opts]) => (
          <label key={k} className="block text-sm font-semibold capitalize">{k === 'mode' ? 'Work mode' : k === 'type' ? 'Job type' : 'Experience'}
            <select className="input mt-1 font-normal" value={query[k] || ''} onChange={(e) => setParam(k, e.target.value)}><option value="">Any</option>{opts.map((o) => <option key={o}>{o}</option>)}</select>
          </label>
        ))}
        <label className="block text-sm font-semibold">Minimum salary
          <input type="number" min="0" step="5000" className="input mt-1 font-normal" value={query.minSalary || ''} onChange={(e) => setParam('minSalary', e.target.value)} />
        </label>
        <label className="block text-sm font-semibold">Posted
          <select className="input mt-1 font-normal" value={query.posted || ''} onChange={(e) => setParam('posted', e.target.value)}><option value="">Any time</option><option value="1">Last 24 hours</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select>
        </label>
        <button className="btn btn-ghost w-full" onClick={() => setParams({})}>Clear filters</button>
      </aside>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-semibold">{data ? `${data.total} jobs` : 'Searching…'}</p>
          <select aria-label="Sort" className="input w-auto" value={query.sort || 'newest'} onChange={(e) => setParam('sort', e.target.value)}><option value="newest">Newest</option><option value="salary">Highest salary</option></select>
        </div>
        {!data ? <Spinner /> : data.items.length === 0 ? <Empty title="No jobs match your search" hint="Try removing a filter or searching a broader keyword." /> : (
          <div className="space-y-3">{data.items.map((j) => <JobCard key={j._id} job={j} saved={saved.has(j._id)} onSave={toggleSave} />)}</div>
        )}
        {data?.pages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button className="btn btn-ghost" disabled={data.page <= 1} onClick={() => setParam('page', data.page - 1)}>Previous</button>
            <span>Page {data.page} of {data.pages}</span>
            <button className="btn btn-ghost" disabled={data.page >= data.pages} onClick={() => setParam('page', data.page + 1)}>Next</button>
          </div>
        )}
      </section>
    </div>
  );
}
