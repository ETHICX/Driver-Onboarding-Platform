import { Request, Response, NextFunction } from 'express';
import { db, hashPassword } from './db';
import { AuthUser, UserRole } from '../src/types';

// In-memory active tokens mapping: token -> userId
const sessions = new Map<string, { userId: string; expiresAt: number }>();

export function createSessionToken(userId: string): string {
  const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  // 7 days expiration
  sessions.set(token, {
    userId,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  });
  return token;
}

export function generateOtp(): string {
  // 6 digit number
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);
  const session = sessions.get(token);
  if (!session) {
    return next();
  }

  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return next();
  }

  const user = db.findUserById(session.userId);
  if (user) {
    const { passwordHash: _, ...publicUser } = user as any;
    req.user = publicUser;
  }

  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. Authentication required.' });
  }
  next();
}

export function requireRole(role: UserRole) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Authentication required.' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Forbidden. Requires ${role} role.` });
    }
    next();
  };
}
