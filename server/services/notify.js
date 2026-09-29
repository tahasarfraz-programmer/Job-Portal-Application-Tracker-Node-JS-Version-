import { Notification } from '../models/index.js';

export const notify = (userId, message) => Notification.create({ user: userId, message });
