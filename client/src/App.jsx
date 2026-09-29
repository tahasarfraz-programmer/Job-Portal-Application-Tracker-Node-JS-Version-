import { Route, Routes } from 'react-router-dom';
import { DashboardLayout, PublicLayout } from './layouts/AppLayout';
import RequireAuth from './components/RequireAuth';
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import { Login, Register } from './pages/AuthPages';
import { ApplicationDetail, Saved, Tracker } from './pages/SeekerPages';
import Profile from './pages/Profile';
import { Applicants, CompanyForm, EmployerDashboard, JobForm } from './pages/EmployerPages';
import Admin from './pages/Admin';
import { Forbidden, NotFound } from './pages/StatusPages';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forbidden" element={<Forbidden />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="app" element={<RequireAuth />}>
        <Route element={<DashboardLayout />}>
          <Route element={<RequireAuth roles={['seeker']} />}>
            <Route path="tracker" element={<Tracker />} />
            <Route path="tracker/:id" element={<ApplicationDetail />} />
            <Route path="saved" element={<Saved />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route element={<RequireAuth roles={['employer']} />}>
            <Route path="employer" element={<EmployerDashboard />} />
            <Route path="employer/company" element={<CompanyForm />} />
            <Route path="employer/jobs/new" element={<JobForm />} />
            <Route path="employer/jobs/:id/edit" element={<JobForm />} />
            <Route path="employer/jobs/:id/applicants" element={<Applicants />} />
          </Route>
          <Route element={<RequireAuth roles={['admin']} />}>
            <Route path="admin" element={<Admin />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
