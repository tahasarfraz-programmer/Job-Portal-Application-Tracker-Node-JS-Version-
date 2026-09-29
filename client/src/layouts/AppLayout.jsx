import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { unwrap } from '../services/api';

const LINKS = {
  seeker: [['/app/tracker', 'Applications'], ['/app/saved', 'Saved jobs'], ['/app/profile', 'My profile']],
  employer: [['/app/employer', 'Dashboard'], ['/app/employer/jobs/new', 'Post a job'], ['/app/employer/company', 'Company']],
  admin: [['/app/admin', 'Overview']],
};

export function PublicLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const home = { seeker: '/app/tracker', employer: '/app/employer', admin: '/app/admin' }[user?.role];
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-white">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link to="/" className="font-display text-2xl font-extrabold text-teal">Hirewell</Link>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <Link to="/jobs">Find jobs</Link>
            {user ? <>
              <Link to={home}>Dashboard</Link>
              <button className="btn btn-ghost" onClick={() => { logout(); navigate('/'); }}>Log out</button>
            </> : <><Link to="/login">Log in</Link><Link to="/register" className="btn">Sign up</Link></>}
          </div>
        </nav>
      </header>
      <main className="flex-1"><Outlet /></main>
      <footer className="border-t border-line bg-white py-6 text-center text-sm text-ink/60">Hirewell is a portfolio project. All companies and people are fictional.</footer>
    </div>
  );
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const [notes, setNotes] = useState([]);
  const [open, setOpen] = useState(false);
  useEffect(() => { unwrap(api.get('/notifications')).then(setNotes).catch(() => {}); }, []);
  const unread = notes.filter((n) => !n.read).length;
  const markRead = async () => { await api.patch('/notifications/read'); setNotes(notes.map((n) => ({ ...n, read: true }))); };
  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-line bg-white md:min-h-screen md:w-56 md:border-b-0 md:border-r">
        <Link to="/" className="block px-4 py-4 font-display text-xl font-extrabold text-teal">Hirewell</Link>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-0">
          {LINKS[user.role].map(([to, label]) => (
            <NavLink key={to} to={to} end className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-2 font-semibold ${isActive ? 'bg-teal text-white' : 'hover:bg-paper'}`}>{label}</NavLink>
          ))}
          {user.role === 'seeker' && <NavLink to="/jobs" className="rounded-lg px-3 py-2 font-semibold hover:bg-paper">Browse jobs</NavLink>}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-end gap-3 border-b border-line bg-white px-4 py-3">
          <div className="relative">
            <button className="btn btn-ghost" onClick={() => setOpen(!open)}>Notifications{unread > 0 && <span className="rounded-full bg-amber px-1.5 text-xs">{unread}</span>}</button>
            {open && (
              <div className="card absolute right-0 z-10 mt-2 w-72 p-3 shadow-lg">
                {notes.length === 0 ? <p className="text-sm text-ink/60">Nothing new yet.</p> : notes.slice(0, 6).map((n) => <p key={n._id} className={`border-b border-line py-2 text-sm ${n.read ? 'text-ink/60' : 'font-semibold'}`}>{n.message}</p>)}
                {unread > 0 && <button className="mt-2 text-sm font-semibold text-teal" onClick={markRead}>Mark all read</button>}
              </div>
            )}
          </div>
          <span className="hidden text-sm sm:inline">{user.name}</span>
          <button className="btn btn-ghost" onClick={logout}>Log out</button>
        </div>
        <div className="mx-auto max-w-5xl p-4 md:p-6"><Outlet /></div>
      </div>
    </div>
  );
}
