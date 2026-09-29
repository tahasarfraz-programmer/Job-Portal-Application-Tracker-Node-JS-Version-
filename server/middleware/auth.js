import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { ApiError, wrap } from '../utils/http.js';

export const protect = wrap(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw new ApiError(401, 'Authentication required');
  let payload;
  try { payload = jwt.verify(header.slice(7), process.env.JWT_SECRET); } catch { throw new ApiError(401, 'Invalid or expired token'); }
  const user = await User.findById(payload.id);
  if (!user || !user.isActive) throw new ApiError(401, 'Account not available');
  req.user = user;
  next();
});

export const authorize = (...roles) => (req, _res, next) =>
  roles.includes(req.user.role) ? next() : next(new ApiError(403, 'You do not have permission to do that'));
