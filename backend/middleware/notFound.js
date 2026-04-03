import { AppError } from './errorHandler.js';

export const notFound = (req, res, next) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

export default notFound;

