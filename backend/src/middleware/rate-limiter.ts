import rateLimit from 'express-rate-limit';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per windowMs
  message: { 
    error: 'Too many requests from this IP. Please try again after 15 minutes.' 
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Stricter limit of 15 attempts for registration/login
  message: { 
    error: 'Too many login attempts. Please try again after 15 minutes.' 
  },
  standardHeaders: true,
  legacyHeaders: false
});
