// Development email backend: logs to console. Swap `send` for nodemailer/SES in production.
const send = async ({ to, subject, text }) => {
  console.log(`[email] to=${to} subject="${subject}"\n${text}\n`);
};

export const emailService = {
  welcome: (user) => send({ to: user.email, subject: 'Welcome to Hirewell', text: `Hi ${user.name}, your account is ready.` }),
  applicationReceived: (candidate, job) => send({ to: candidate.email, subject: 'Application submitted', text: `You applied for ${job.title}.` }),
  statusChanged: (candidate, job, status) => send({ to: candidate.email, subject: 'Application update', text: `${job.title} is now: ${status}.` }),
  interviewScheduled: (candidate, job, when) => send({ to: candidate.email, subject: 'Interview scheduled', text: `${job.title}: ${when.toISOString()}` }),
  newApplication: (employer, job) => send({ to: employer.email, subject: 'New application', text: `New applicant for ${job.title}.` }),
};
