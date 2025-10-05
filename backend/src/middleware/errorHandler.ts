import { Request, Response, NextFunction } from 'express';

export interface ErrorResponse {
  message: string;
  stack?: string;
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { name: 'CastError', message };
  }

  // Mongoose duplicate key
  if ((err as unknown as { code: number }).code === 11000) {
    const message = 'Duplicate field value entered';
    error = { name: 'DuplicateError', message };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values((err as unknown as { errors: Record<string, { message: string }> }).errors)
      .map((val) => val.message)
      .join(', ');
    error = { name: 'ValidationError', message };
  }

  const response: ErrorResponse = {
    message: error.message || 'Server Error',
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(500).json(response);
};
