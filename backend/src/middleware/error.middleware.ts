import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log the complete error trace
  console.error('[Global Error Handler] Caught Exception:', err);

  const status = err.statusCode || err.status || 500;
  const message = err.message || 'An unexpected operational error occurred.';

  res.status(status).json({
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
