import { Link } from 'react-router-dom';
import { money } from './ui';

export default function JobCard({ job, onSave, saved }) {
  const company = job.company?.name || job.companyName;
  return (
    <article className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Link to={`/jobs/${job._id}`} className="font-display text-lg font-bold hover:text-teal">{job.title}</Link>
        <p className="text-ink/70">{company} • {job.location} • {job.workMode}</p>
        <p className="mt-1 text-sm">{job.employmentType} • {job.experienceLevel} • {money(job.salaryMin, job.salaryMax)}</p>
      </div>
      <div className="flex gap-2">
        {onSave && <button className="btn btn-ghost" onClick={() => onSave(job)} aria-pressed={saved}>{saved ? 'Saved' : 'Save'}</button>}
        <Link to={`/jobs/${job._id}`} className="btn">View</Link>
      </div>
    </article>
  );
}
