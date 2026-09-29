import { Application, Company, Interview, Job, STATUSES } from '../models/index.js';
import { ApiError, ok, wrap } from '../utils/http.js';
import { emailService } from '../services/emailService.js';
import { notify } from '../services/notify.js';

const populate = [{ path: 'job', populate: { path: 'company', select: 'name logoUrl' } }, { path: 'candidate', select: 'name email profile resume' }];

export const apply = wrap(async (req, res) => {
  const { coverLetter, additionalInfo } = req.body;
  if (!coverLetter || coverLetter.trim().length < 20) throw new ApiError(400, 'Cover letter must be at least 20 characters');
  if (!req.user.resume?.path) throw new ApiError(400, 'Upload a resume to your profile before applying');
  const job = await Job.findById(req.params.jobId).populate('company');
  if (!job || job.status !== 'active') throw new ApiError(404, 'This job is not accepting applications');
  if (job.deadline && job.deadline < new Date()) throw new ApiError(400, 'The application deadline has passed');
  if (await Application.exists({ candidate: req.user._id, job: job._id })) throw new ApiError(409, 'You have already applied to this job');
  const app = await Application.create({ candidate: req.user._id, job: job._id, coverLetter, additionalInfo, history: [{ status: 'applied' }] });
  await Promise.all([
    notify(req.user._id, `Your application for ${job.title} was submitted.`),
    notify(job.company.owner, `${req.user.name} applied for ${job.title}.`),
    emailService.applicationReceived(req.user, job),
  ]);
  ok(res, app, 201);
});

export const myApplications = wrap(async (req, res) => {
  const apps = await Application.find({ candidate: req.user._id }).populate(populate).sort('-updatedAt').lean();
  const interviews = await Interview.find({ application: { $in: apps.map((a) => a._id) } }).sort('scheduledAt').lean();
  ok(res, apps.map((a) => ({ ...a, interviews: interviews.filter((i) => String(i.application) === String(a._id)) })));
});

export const getApplication = wrap(async (req, res) => {
  const app = await Application.findById(req.params.id).populate(populate).lean();
  if (!app) throw new ApiError(404, 'Application not found');
  await assertAccess(req.user, app);
  app.interviews = await Interview.find({ application: app._id }).sort('scheduledAt');
  ok(res, app);
});

const assertAccess = async (user, app) => {
  if (user.role === 'admin' || String(app.candidate._id || app.candidate) === String(user._id)) return;
  const company = await Company.findOne({ owner: user._id });
  if (user.role === 'employer' && company && String(app.job.company._id || app.job.company) === String(company._id)) return;
  throw new ApiError(403, 'You do not have access to this application');
};

export const jobApplicants = wrap(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  const company = await Company.findOne({ owner: req.user._id });
  if (!job || !company || String(job.company) !== String(company._id)) throw new ApiError(403, 'You can only view applicants for your own jobs');
  ok(res, await Application.find({ job: job._id }).populate('candidate', 'name email profile resume').sort('-createdAt'));
});

export const updateStatus = wrap(async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status) || status === 'withdrawn') throw new ApiError(400, 'Invalid status');
  const app = await Application.findById(req.params.id).populate('job').populate('candidate');
  if (!app) throw new ApiError(404, 'Application not found');
  await assertAccess(req.user, { ...app.toObject(), job: app.job });
  app.status = status;
  app.history.push({ status });
  await app.save();
  await Promise.all([notify(app.candidate._id, `${app.job.title} moved to "${status}".`), emailService.statusChanged(app.candidate, app.job, status)]);
  ok(res, app);
});

export const withdraw = wrap(async (req, res) => {
  const app = await Application.findOne({ _id: req.params.id, candidate: req.user._id });
  if (!app) throw new ApiError(404, 'Application not found');
  if (['hired', 'rejected', 'withdrawn'].includes(app.status)) throw new ApiError(400, 'This application can no longer be withdrawn');
  app.status = 'withdrawn';
  app.history.push({ status: 'withdrawn' });
  ok(res, await app.save());
});

export const scheduleInterview = wrap(async (req, res) => {
  const { scheduledAt, type, locationOrLink, notes } = req.body;
  if (!scheduledAt || !['phone', 'video', 'in-person'].includes(type)) throw new ApiError(400, 'Interview date and type are required');
  if (new Date(scheduledAt) < new Date()) throw new ApiError(400, 'Interview must be scheduled in the future');
  const app = await Application.findById(req.params.id).populate('job').populate('candidate');
  if (!app) throw new ApiError(404, 'Application not found');
  await assertAccess(req.user, { ...app.toObject(), job: app.job });
  const interview = await Interview.create({ application: app._id, scheduledAt, type, locationOrLink, notes });
  if (app.status !== 'interview') { app.status = 'interview'; app.history.push({ status: 'interview' }); await app.save(); }
  await Promise.all([notify(app.candidate._id, `Interview scheduled for ${app.job.title}.`), emailService.interviewScheduled(app.candidate, app.job, new Date(scheduledAt))]);
  ok(res, interview, 201);
});
