import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { ApiError, ok, wrap } from '../utils/http.js';
import { emailService } from '../services/emailService.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sign = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, profile: u.profile, resume: u.resume?.originalName || null });

export const register = wrap(async (req, res) => {
  const { name, email, password, role = 'seeker' } = req.body;
  if (!name || !EMAIL_RE.test(email || '')) throw new ApiError(400, 'A name and valid email are required');
  if (!password || password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters');
  if (!['seeker', 'employer'].includes(role)) throw new ApiError(400, 'Role must be seeker or employer');
  const user = await User.create({ name, email, password, role });
  emailService.welcome(user);
  ok(res, { token: sign(user), user: publicUser(user) }, 201);
});

export const login = wrap(async (req, res) => {
  const user = await User.findOne({ email: String(req.body.email || '').toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(req.body.password || ''))) throw new ApiError(401, 'Email or password is incorrect');
  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated');
  ok(res, { token: sign(user), user: publicUser(user) });
});

export const me = wrap(async (req, res) => ok(res, publicUser(req.user)));
export { publicUser };
