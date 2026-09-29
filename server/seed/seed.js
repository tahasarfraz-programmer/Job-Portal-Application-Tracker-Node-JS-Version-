import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { Application, Category, Company, Interview, Job, Notification, SavedJob, User } from '../models/index.js';

await connectDB();
await Promise.all([Application, Category, Company, Interview, Job, Notification, SavedJob, User].map((m) => m.deleteMany({})));

const cats = await Category.insertMany(['Engineering', 'Design', 'Marketing', 'Data', 'Operations'].map((name) => ({ name, slug: name.toLowerCase() })));
const pw = 'Password123!';
const admin = await User.create({ name: 'Ada Admin', email: 'admin@demo.test', password: pw, role: 'admin' });
const seekers = await User.create([
  { name: 'Sam Rivera', email: 'seeker@demo.test', password: pw, profile: { title: 'Frontend Developer', location: 'Lisbon', skills: ['React', 'CSS', 'TypeScript'], bio: 'Frontend developer who cares about accessibility.' } },
  { name: 'Priya Nair', email: 'priya@demo.test', password: pw, profile: { title: 'Data Analyst', location: 'Remote', skills: ['SQL', 'Python'] } },
]);
const employers = await User.create([
  { name: 'Olu Bright', email: 'employer@demo.test', password: pw, role: 'employer' },
  { name: 'Mei Tanaka', email: 'mei@demo.test', password: pw, role: 'employer' },
]);
const companies = await Company.create([
  { owner: employers[0]._id, name: 'Brightwave Labs', industry: 'Software', location: 'Lisbon', size: '51-200', foundedYear: 2016, description: 'Fictional studio building scheduling tools for clinics.', website: 'https://example.com' },
  { owner: employers[1]._id, name: 'Northfield Foods', industry: 'Food & Beverage', location: 'Toronto', size: '201-500', foundedYear: 2009, description: 'Fictional regional grocery and logistics group.', website: 'https://example.com' },
]);
const seedJobs = [
  ['Senior React Engineer', 0, 0, 'senior', 'remote', 'Remote', 90000, 120000, ['React', 'TypeScript']],
  ['Product Designer', 0, 1, 'mid', 'hybrid', 'Lisbon', 60000, 80000, ['Figma', 'Research']],
  ['Backend Developer (Node)', 0, 0, 'mid', 'hybrid', 'Lisbon', 70000, 95000, ['Node.js', 'MongoDB']],
  ['Data Analyst', 1, 3, 'entry', 'on-site', 'Toronto', 55000, 70000, ['SQL', 'Python']],
  ['Logistics Coordinator', 1, 4, 'mid', 'on-site', 'Toronto', 50000, 62000, ['Planning']],
  ['Marketing Intern', 1, 2, 'entry', 'remote', 'Remote', 15000, 20000, ['Copywriting']],
];
const jobs = await Job.create(seedJobs.map(([title, c, cat, level, mode, location, salaryMin, salaryMax, skills]) => ({
  title, company: companies[c]._id, companyName: companies[c].name, category: cats[cat]._id, experienceLevel: level, workMode: mode,
  location, salaryMin, salaryMax, skills, employmentType: title.includes('Intern') ? 'internship' : 'full-time',
  description: `${title} at ${companies[c].name}. Work with a small, collaborative team on real problems.`,
  responsibilities: ['Own features end to end', 'Collaborate with product and design'], requirements: ['Relevant experience', 'Clear communication'],
  benefits: ['Health cover', 'Learning budget'], deadline: new Date(Date.now() + 30 * 86400000),
})));
const app = await Application.create({ candidate: seekers[0]._id, job: jobs[0]._id, coverLetter: 'I have four years of React experience and would love to contribute.', status: 'interview', history: [{ status: 'applied' }, { status: 'under-review' }, { status: 'interview' }] });
await Application.create({ candidate: seekers[1]._id, job: jobs[3]._id, coverLetter: 'I enjoy turning messy data into decisions.', history: [{ status: 'applied' }] });
await Interview.create({ application: app._id, scheduledAt: new Date(Date.now() + 5 * 86400000), type: 'video', locationOrLink: 'https://meet.example.com/demo', notes: 'Technical conversation, 45 minutes' });
await Notification.create({ user: seekers[0]._id, message: 'Interview scheduled for Senior React Engineer.' });
console.log('Seeded. Demo password for all accounts:', pw, '\nadmin@demo.test | seeker@demo.test | employer@demo.test');
void admin;
await mongoose.disconnect();
