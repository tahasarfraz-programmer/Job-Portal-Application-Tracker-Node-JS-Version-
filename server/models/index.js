import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema, model } = mongoose;
const ref = (name, extra = {}) => ({ type: Schema.Types.ObjectId, ref: name, ...extra });

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ['seeker', 'employer', 'admin'], default: 'seeker' },
  isActive: { type: Boolean, default: true },
  profile: {
    title: String, phone: String, location: String, bio: String,
    skills: [String], education: [String], experience: [String], certifications: [String],
    linkedin: String, github: String, website: String,
    preferredJobType: String, preferredLocation: String, expectedSalary: Number,
  },
  resume: { path: String, originalName: String, uploadedAt: Date },
}, { timestamps: true });

userSchema.pre('save', async function hash(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.matchPassword = function matchPassword(plain) {
  return bcrypt.compare(plain, this.password);
};

const companySchema = new Schema({
  owner: ref('User', { required: true, unique: true }),
  name: { type: String, required: true, trim: true },
  description: String, industry: String, website: String, location: String,
  size: String, foundedYear: Number, contactEmail: String, logoUrl: String,
  social: { linkedin: String, twitter: String },
}, { timestamps: true });

const categorySchema = new Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
});

const jobSchema = new Schema({
  title: { type: String, required: true, trim: true },
  company: ref('Company', { required: true, index: true }),
  companyName: { type: String, index: true },
  category: ref('Category', { index: true }),
  description: { type: String, required: true },
  responsibilities: [String], requirements: [String], skills: [String], benefits: [String],
  experienceLevel: { type: String, enum: ['entry', 'mid', 'senior', 'lead'], default: 'entry' },
  employmentType: { type: String, enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'], default: 'full-time' },
  workMode: { type: String, enum: ['on-site', 'hybrid', 'remote'], default: 'on-site' },
  location: { type: String, index: true },
  salaryMin: { type: Number, min: 0 }, salaryMax: { type: Number, min: 0 },
  deadline: Date,
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
}, { timestamps: true });

const STATUSES = ['applied', 'under-review', 'shortlisted', 'interview', 'offered', 'rejected', 'withdrawn', 'hired'];
const applicationSchema = new Schema({
  candidate: ref('User', { required: true, index: true }),
  job: ref('Job', { required: true, index: true }),
  coverLetter: { type: String, required: true },
  additionalInfo: String,
  status: { type: String, enum: STATUSES, default: 'applied' },
  history: [{ status: String, at: { type: Date, default: Date.now } }],
}, { timestamps: true });
applicationSchema.index({ candidate: 1, job: 1 }, { unique: true });

const savedJobSchema = new Schema({ user: ref('User', { required: true }), job: ref('Job', { required: true }) }, { timestamps: true });
savedJobSchema.index({ user: 1, job: 1 }, { unique: true });

const interviewSchema = new Schema({
  application: ref('Application', { required: true, index: true }),
  scheduledAt: { type: Date, required: true },
  type: { type: String, enum: ['phone', 'video', 'in-person'], required: true },
  locationOrLink: String, notes: String,
}, { timestamps: true });

const notificationSchema = new Schema({
  user: ref('User', { required: true, index: true }),
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

export const User = model('User', userSchema);
export const Company = model('Company', companySchema);
export const Category = model('Category', categorySchema);
export const Job = model('Job', jobSchema);
export const Application = model('Application', applicationSchema);
export const SavedJob = model('SavedJob', savedJobSchema);
export const Interview = model('Interview', interviewSchema);
export const Notification = model('Notification', notificationSchema);
export { STATUSES };
