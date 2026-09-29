import { Application, Company, Interview, Job, Notification, SavedJob } from '../models/index.js';
import { ok, wrap } from '../utils/http.js';

export const listSaved = wrap(async (req, res) => {
  const saved = await SavedJob.find({ user: req.user._id }).populate({ path: 'job', populate: { path: 'company', select: 'name' } }).sort('-createdAt');
  ok(res, saved.filter((s) => s.job));
});
export const saveJob = wrap(async (req, res) => {
  await SavedJob.updateOne({ user: req.user._id, job: req.params.jobId }, { $setOnInsert: {} }, { upsert: true });
  ok(res, { saved: true }, 201);
});
export const unsaveJob = wrap(async (req, res) => {
  await SavedJob.deleteOne({ user: req.user._id, job: req.params.jobId });
  ok(res, { saved: false });
});

export const listNotifications = wrap(async (req, res) => ok(res, await Notification.find({ user: req.user._id }).sort('-createdAt').limit(30)));
export const markRead = wrap(async (req, res) => {
  await Notification.updateMany({ user: req.user._id }, { read: true });
  ok(res, { updated: true });
});

export const myInterviews = wrap(async (req, res) => {
  const apps = await Application.find({ candidate: req.user._id }).populate('job', 'title companyName').lean();
  const interviews = await Interview.find({ application: { $in: apps.map((a) => a._id) } }).sort('scheduledAt').lean();
  ok(res, interviews.map((i) => ({ ...i, job: apps.find((a) => String(a._id) === String(i.application)).job })));
});

export const employerStats = wrap(async (req, res) => {
  const company = await Company.findOne({ owner: req.user._id });
  const jobIds = company ? await Job.find({ company: company._id }).distinct('_id') : [];
  const byStatus = await Application.aggregate([{ $match: { job: { $in: jobIds } } }, { $group: { _id: '$status', n: { $sum: 1 } } }]);
  const s = Object.fromEntries(byStatus.map((x) => [x._id, x.n]));
  ok(res, {
    totalJobs: jobIds.length,
    activeJobs: company ? await Job.countDocuments({ company: company._id, status: 'active' }) : 0,
    totalApplications: byStatus.reduce((a, x) => a + x.n, 0),
    shortlisted: s.shortlisted || 0, interviews: s.interview || 0, hired: s.hired || 0, byStatus: s,
  });
});
