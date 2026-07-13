import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
