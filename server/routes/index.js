import { Router } from 'express';
import { authorize, protect } from '../middleware/auth.js';
import { resumeUpload } from '../middleware/upload.js';
import * as auth from '../controllers/authController.js';
import * as users from '../controllers/userController.js';
import * as companies from '../controllers/companyController.js';
import * as jobs from '../controllers/jobController.js';
import * as apps from '../controllers/applicationController.js';
import * as misc from '../controllers/miscController.js';
import * as admin from '../controllers/adminController.js';

const api = Router();
const seeker = [protect, authorize('seeker')];
const employer = [protect, authorize('employer', 'admin')];

api.post('/auth/register', auth.register);
api.post('/auth/login', auth.login);
api.get('/auth/me', protect, auth.me);

api.put('/users/profile', ...seeker, users.updateProfile);
api.post('/users/resume', ...seeker, resumeUpload, users.uploadResume);
api.delete('/users/resume', ...seeker, users.deleteResume);
api.get('/users/:userId/resume', protect, users.downloadResume);
api.get('/users/:userId/profile', ...employer, users.candidateProfile);

api.get('/companies', companies.listCompanies);
api.get('/companies/mine', ...employer, companies.myCompany);
api.put('/companies/mine', ...employer, companies.saveCompany);
api.get('/companies/:id', companies.getCompany);

api.get('/jobs', jobs.searchJobs);
api.get('/jobs/categories', jobs.categories);
api.get('/jobs/suggestions', jobs.suggestions);
api.get('/jobs/mine', ...employer, jobs.myJobs);
api.post('/jobs', ...employer, jobs.createJob);
api.get('/jobs/:id', jobs.getJob);
api.put('/jobs/:id', ...employer, jobs.updateJob);
api.delete('/jobs/:id', ...employer, jobs.deleteJob);
api.get('/jobs/:jobId/applicants', ...employer, apps.jobApplicants);
api.post('/jobs/:jobId/apply', ...seeker, apps.apply);

api.get('/applications/mine', ...seeker, apps.myApplications);
api.get('/applications/:id', protect, apps.getApplication);
api.patch('/applications/:id/status', ...employer, apps.updateStatus);
api.patch('/applications/:id/withdraw', ...seeker, apps.withdraw);

api.get('/saved-jobs', ...seeker, misc.listSaved);
api.put('/saved-jobs/:jobId', ...seeker, misc.saveJob);
api.delete('/saved-jobs/:jobId', ...seeker, misc.unsaveJob);

api.get('/interviews/mine', ...seeker, misc.myInterviews);
api.post('/interviews/application/:id', ...employer, apps.scheduleInterview);

api.get('/notifications', protect, misc.listNotifications);
api.patch('/notifications/read', protect, misc.markRead);

api.get('/employer/stats', ...employer, misc.employerStats);

const adm = [protect, authorize('admin')];
api.get('/admin/stats', ...adm, admin.stats);
api.get('/admin/users', ...adm, admin.listUsers);
api.patch('/admin/users/:id/toggle', ...adm, admin.toggleUser);
api.delete('/admin/users/:id', ...adm, admin.deleteUser);
api.get('/admin/companies', ...adm, admin.listCompanies);
api.get('/admin/jobs', ...adm, admin.listJobs);
api.get('/admin/applications', ...adm, admin.listApplications);
api.post('/admin/categories', ...adm, admin.createCategory);
api.delete('/admin/categories/:id', ...adm, admin.deleteCategory);

export default api;
