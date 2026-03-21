// FILE: server/middleware/errorHandler.middleware.js
// PURPOSE: Global error handling middleware to catch and format errors

import { ApiError } from '../utils/ApiError.js';

const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      data: err.data,
      message: err.message,
      success: err.success,
      errors: err.errors,
    });
  }

  // Handle other types of errors
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    statusCode,
    data: null,
    message,
    success: false,
    errors: [],
  });
};

export { errorHandler };
