import { Link } from 'react-router-dom';

export const STATUS = {
  applied: ['Applied', 'bg-slate-100 text-slate-700'],
  'under-review': ['Under review', 'bg-sky-100 text-sky-800'],
  shortlisted: ['Shortlisted', 'bg-indigo-100 text-indigo-800'],
  interview: ['Interview', 'bg-amber-100 text-amber-800'],
  offered: ['Offered', 'bg-emerald-100 text-emerald-800'],
  hired: ['Hired', 'bg-emerald-600 text-white'],
  rejected: ['Rejected', 'bg-rose-100 text-rose-800'],
  withdrawn: ['Withdrawn', 'bg-zinc-200 text-zinc-600'],
};

export const StatusBadge = ({ status }) => {
  const [label, cls] = STATUS[status] || [status, 'bg-slate-100'];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
};

export const Spinner = () => <div role="status" className="mx-auto my-16 h-8 w-8 animate-spin rounded-full border-4 border-line border-t-teal" />;

export const Empty = ({ title, hint, action }) => (
  <div className="card p-10 text-center">
    <h3 className="text-lg font-bold">{title}</h3>
    {hint && <p className="mx-auto mt-1 max-w-sm text-ink/70">{hint}</p>}
    {action && <Link to={action.to} className="btn mt-4">{action.label}</Link>}
  </div>
);

export const Field = ({ label, children }) => (
  <label className="block text-sm font-semibold">{label}<div className="mt-1 font-normal">{children}</div></label>
);

const FLOW = ['applied', 'under-review', 'shortlisted', 'interview', 'offered', 'hired'];
export const Timeline = ({ status, history = [] }) => {
  const reached = new Set(history.map((h) => h.status));
  const idx = FLOW.indexOf(status);
  const terminal = ['rejected', 'withdrawn'].includes(status);
  return (
    <ol className="space-y-3">
      {FLOW.map((s, i) => {
        const at = history.find((h) => h.status === s)?.at;
        const done = reached.has(s) || i < idx;
        return (
          <li key={s} className="flex items-start gap-3">
            <span className={`mt-1 h-3 w-3 rounded-full ${s === status ? 'bg-amber ring-4 ring-amber/30' : done ? 'bg-teal' : 'bg-line'}`} />
            <div className={done || s === status ? '' : 'text-ink/40'}>
              <p className="font-semibold">{STATUS[s][0]}</p>
              {at && <p className="text-xs text-ink/60">{new Date(at).toLocaleDateString()}</p>}
            </div>
          </li>
        );
      })}
      {terminal && <li className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-rose-500" /><StatusBadge status={status} /></li>}
    </ol>
  );
};

export const money = (min, max) => (min || max ? `$${(min || 0) / 1000}k – $${(max || min) / 1000}k` : 'Salary not listed');
