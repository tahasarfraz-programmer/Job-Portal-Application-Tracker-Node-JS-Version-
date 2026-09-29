import { Application, Category, Company, Job } from '../models/index.js';
import { ApiError, escapeRegex, ok, pick, toList, wrap } from '../utils/http.js';

const FIELDS = ['title', 'category', 'description', 'experienceLevel', 'employmentType', 'workMode', 'location', 'salaryMin', 'salaryMax', 'deadline', 'status'];
const LISTS = ['responsibilities', 'requirements', 'skills', 'benefits'];

const validate = (b, partial = false) => {
  if (!partial && (!b.title || !b.description)) throw new ApiError(400, 'Title and description are required');
  if (b.salaryMin != null && b.salaryMax != null && Number(b.salaryMin) > Number(b.salaryMax)) throw new ApiError(400, 'Minimum salary cannot exceed maximum salary');
  if (b.deadline && new Date(b.deadline) < new Date(new Date().toDateString())) throw new ApiError(400, 'Deadline cannot be in the past');
};

const buildData = (body) => {
  const data = pick(body, FIELDS);
  LISTS.forEach((f) => { if (body[f] !== undefined) data[f] = toList(body[f]); });
  return data;
};

export const searchJobs = wrap(async (req, res) => {
  const { q, location, category, type, level, mode, minSalary, posted, sort = 'newest' } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const filter = { status: 'active', $or: [{ deadline: null }, { deadline: { $gte: new Date() } }] };
  const and = [];
  if (q) { const re = new RegExp(escapeRegex(q), 'i'); and.push({ $or: [{ title: re }, { companyName: re }, { skills: re }, { description: re }] }); }
  if (location) filter.location = new RegExp(escapeRegex(location), 'i');
  if (category) { const c = await Category.findOne({ slug: category }); filter.category = c?._id; }
  if (type) filter.employmentType = type;
  if (level) filter.experienceLevel = level;
  if (mode) filter.workMode = mode;
  if (minSalary) filter.salaryMax = { $gte: Number(minSalary) };
  if (posted) filter.createdAt = { $gte: new Date(Date.now() - Number(posted) * 86400000) };
  if (and.length) filter.$and = and;
  const sorts = { newest: '-createdAt', salary: '-salaryMax' };
  const [items, total] = await Promise.all([
    Job.find(filter).populate('category', 'name slug').populate('company', 'name logoUrl').sort(sorts[sort] || '-createdAt').skip((page - 1) * limit).limit(limit),
    Job.countDocuments(filter),
  ]);
  ok(res, { items, total, page, pages: Math.ceil(total / limit) });
});

export const getJob = wrap(async (req, res) => {
  const job = await Job.findById(req.params.id).populate('category').populate('company');
  if (!job) throw new ApiError(404, 'Job not found');
  const related = await Job.find({ _id: { $ne: job._id }, status: 'active', category: job.category?._id }).limit(3);
  ok(res, { job, related });
});

export const suggestions = wrap(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return ok(res, []);
  const titles = await Job.find({ status: 'active', title: new RegExp(escapeRegex(q), 'i') }).distinct('title');
  ok(res, titles.slice(0, 6));
});

export const categories = wrap(async (_req, res) => ok(res, await Category.find().sort('name')));

export const myJobs = wrap(async (req, res) => {
  const company = await Company.findOne({ owner: req.user._id });
  const jobs = company ? await Job.find({ company: company._id }).sort('-createdAt').lean() : [];
  const counts = await Application.aggregate([{ $match: { job: { $in: jobs.map((j) => j._id) } } }, { $group: { _id: '$job', n: { $sum: 1 } } }]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  ok(res, jobs.map((j) => ({ ...j, applicants: map[String(j._id)] || 0 })));
});

export const createJob = wrap(async (req, res) => {
  const company = await Company.findOne({ owner: req.user._id });
  if (!company) throw new ApiError(400, 'Create your company profile before posting jobs');
  validate(req.body);
  ok(res, await Job.create({ ...buildData(req.body), company: company._id, companyName: company.name }), 201);
});

const ownedJob = async (req) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, 'Job not found');
  if (req.user.role !== 'admin') {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company || String(company._id) !== String(job.company)) throw new ApiError(403, 'You can only manage your own jobs');
  }
  return job;
};

export const updateJob = wrap(async (req, res) => {
  const job = await ownedJob(req);
  validate({ salaryMin: job.salaryMin, salaryMax: job.salaryMax, ...req.body, deadline: undefined }, true);
  Object.assign(job, buildData(req.body));
  ok(res, await job.save());
});

export const deleteJob = wrap(async (req, res) => {
  const job = await ownedJob(req);
  await Application.deleteMany({ job: job._id });
  await job.deleteOne();
  ok(res, { deleted: true });
});
