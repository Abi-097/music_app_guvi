import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id);
    if (!user) return res.status(401).json({ message: 'User no longer exists' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Attaches req.user if a valid token is present, but never blocks
export const optionalAuth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
      const { id } = jwt.verify(header.slice(7), process.env.JWT_SECRET);
      req.user = await User.findById(id);
    }
  } catch {
    /* ignore */
  }
  next();
};
