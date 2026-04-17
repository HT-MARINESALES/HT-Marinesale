import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  status?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err.message);
  console.error(err.stack);

  const status = err.status || 500;
  const message = err.message || 'Interner Serverfehler';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({ error: `Route nicht gefunden: ${req.originalUrl}` });
};
