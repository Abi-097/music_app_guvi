import jwt from 'jsonwebtoken';

const secret = () => process.env.JWT_SECRET || 'dev-secret-change-me';

export const signToken = (id) => jwt.sign({ id }, secret(), { expiresIn: '7d' });

function readUserId(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, secret()).id;
  } catch {
    return null;
  }
}

export function requireAuth(req, res, next) {
  const id = readUserId(req);
  if (!id) return res.status(401).json({ message: 'Please sign in' });
  req.userId = id;
  next();
}

export function optionalAuth(req, _res, next) {
  req.userId = readUserId(req);
  next();
}
