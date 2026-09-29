import { Company, Job } from '../models/index.js';
import { ApiError, ok, pick, wrap } from '../utils/http.js';

const FIELDS = ['name', 'description', 'industry', 'website', 'location', 'size', 'foundedYear', 'contactEmail', 'logoUrl', 'social'];

export const listCompanies = wrap(async (_req, res) => ok(res, await Company.find().sort('name')));

export const getCompany = wrap(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) throw new ApiError(404, 'Company not found');
  const jobs = await Job.find({ company: company._id, status: 'active' }).sort('-createdAt');
  ok(res, { company, jobs });
});

export const myCompany = wrap(async (req, res) => ok(res, await Company.findOne({ owner: req.user._id })));

export const saveCompany = wrap(async (req, res) => {
  const data = pick(req.body, FIELDS);
  if (!data.name && !(await Company.exists({ owner: req.user._id }))) throw new ApiError(400, 'Company name is required');
  const company = await Company.findOneAndUpdate({ owner: req.user._id }, { $set: data }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
  if (data.name) await Job.updateMany({ company: company._id }, { companyName: company.name });
  ok(res, company);
});
