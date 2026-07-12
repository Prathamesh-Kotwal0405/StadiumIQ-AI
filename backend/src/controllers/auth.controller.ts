import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../db/models';
import { AuthRequest } from '../middleware/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_fifa2026_stadiumiq_key_12345';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: 'Email address already registered.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await User.create({ name, email, passwordHash, role: 'fan' });

      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.status(201).json({
        message: 'Registration successful.',
        token,
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }



      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.json({
        message: 'Login successful.',
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }
      const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'name', 'email', 'role']
      });
      if (!user) {
        return res.status(404).json({ error: 'User profile not found.' });
      }
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
}
