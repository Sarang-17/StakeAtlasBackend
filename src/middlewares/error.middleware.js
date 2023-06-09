const errorResponse = require('../utils/error.utils');
const logger = require('../utils/winston');

function errorHandler(err, req, res, next) {
  let error = { ...err };

  // Log error for developer
  logger.error(`${err.name}: `, err);

  error.message = err.message;

  // Mongoose Error Bad ObjectID
  if (err.name === 'CastError') {
    const message = `Cast Error!, Resource not found`;
    error = new errorResponse(message, 404);
  }

  // Mongoose Duplicate key
  if (err.code === 11000) {
    const message = `Duplicate key Found`;
    error = new errorResponse(message, 400);
  }
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => {
      return val.message;
    });
    error = new errorResponse(message, 400);
  }
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server error',
  });
}

module.exports = errorHandler;
