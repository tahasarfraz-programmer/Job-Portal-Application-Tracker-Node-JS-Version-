import path from 'path';
import fs from 'fs/promises';
import { Application, Job, User } from '../models/index.js';
import { ApiError, ok, pick, toList, wrap } from '../utils/http.js';
import { publicUser } from './authController.js';

const LIST_FIELDS = ['skills', 'education', 'experience', 'certifications'];
const FIELDS = ['title', 'phone', 'location', 'bio', 'linkedin', 'github', 'website', 'preferredJobType', 'preferredLocation', 'expectedSalary'];

export const updateProfile = wrap(async (req, res) => {
  const { name, profile = {} } = req.body;
  if (name) req.user.name = name;
  Object.assign(req.user.profile, pick(profile, FIELDS));
  LIST_FIELDS.forEach((f) => { if (profile[f] !== undefined) req.user.profile[f] = toList(profile[f]); });
  await req.user.save();
  ok(res, publicUser(req.user));
});

export const uploadResume = wrap(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Choose a PDF, DOC or DOCX file to upload');
  if (req.user.resume?.path) await fs.rm(path.resolve('uploads', req.user.resume.path), { force: true });
  req.user.resume = { path: req.file.filename, originalName: req.file.originalname, uploadedAt: new Date() };
  await req.user.save();
  ok(res, publicUser(req.user));
});

export const deleteResume = wrap(async (req, res) => {
  if (req.user.resume?.path) await fs.rm(path.resolve('uploads', req.user.resume.path), { force: true });
  req.user.resume = undefined;
  await req.user.save();
  ok(res, publicUser(req.user));
});

// Owner, admin, or an employer who received an application from this candidate may download.
export const downloadResume = wrap(async (req, res) => {
  const owner = await User.findById(req.params.userId);
  if (!owner?.resume?.path) throw new ApiError(404, 'No resume on file');
  let allowed = req.user.role === 'admin' || String(owner._id) === String(req.user._id);
  if (!allowed && req.user.role === 'employer') {
    const jobs = await Job.find({ company: { $in: await companyIds(req.user) } }).distinct('_id');
    allowed = !!(await Application.exists({ candidate: owner._id, job: { $in: jobs } }));
  }
  if (!allowed) throw new ApiError(403, 'You do not have access to this resume');
  res.download(path.resolve('uploads', owner.resume.path), owner.resume.originalName);
});

const companyIds = async (user) => {
  const { Company } = await import('../models/index.js');
  return Company.find({ owner: user._id }).distinct('_id');
};

export const candidateProfile = wrap(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user || user.role !== 'seeker') throw new ApiError(404, 'Candidate not found');
  ok(res, publicUser(user));
});
