import { Application, Category, Company, Job, User } from '../models/index.js';
import { ApiError, ok, wrap } from '../utils/http.js';

export const stats = wrap(async (_req, res) => {
  const [users, employers, candidates, jobs, applications, activeJobs, recentUsers, recentApplications] = await Promise.all([
    User.countDocuments(), User.countDocuments({ role: 'employer' }), User.countDocuments({ role: 'seeker' }),
    Job.countDocuments(), Application.countDocuments(), Job.countDocuments({ status: 'active' }),
    User.find().sort('-createdAt').limit(5).select('name email role createdAt'),
    Application.find().sort('-createdAt').limit(5).populate('candidate', 'name').populate('job', 'title'),
  ]);
  ok(res, { users, employers, candidates, jobs, applications, activeJobs, recentUsers, recentApplications });
});

export const listUsers = wrap(async (_req, res) => ok(res, await User.find().sort('-createdAt').select('name email role isActive createdAt')));
export const toggleUser = wrap(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(400, 'Admin accounts cannot be deactivated here');
  user.isActive = !user.isActive;
  await user.save();
  ok(res, user);
});
export const deleteUser = wrap(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role === 'admin') throw new ApiError(400, 'That user cannot be removed');
  await user.deleteOne();
  ok(res, { deleted: true });
});
export const listCompanies = wrap(async (_req, res) => ok(res, await Company.find().sort('-createdAt')));
export const listJobs = wrap(async (_req, res) => ok(res, await Job.find().sort('-createdAt').limit(200)));
export const listApplications = wrap(async (_req, res) =>
  ok(res, await Application.find().sort('-createdAt').limit(200).populate('candidate', 'name').populate('job', 'title companyName')));

export const createCategory = wrap(async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) throw new ApiError(400, 'Category name is required');
  ok(res, await Category.create({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') }), 201);
});
export const deleteCategory = wrap(async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  ok(res, { deleted: true });
});
