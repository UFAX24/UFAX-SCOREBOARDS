class HttpError extends Error {
  constructor(message, data, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
  }
}

class NotFoundError extends HttpError {
  constructor(message = 'Not Found', data) {
    super(message, data, 404);
  }
}

class BadRequestError extends HttpError {
  constructor(message = 'Bad Request', data) {
    super(message, data, 400);
  }
}

class UnauthenticatedError extends HttpError {
  constructor(message = 'Unauthenticated', data) {
    super(message, data, 401);
  }
}


class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized', data) {
    super(message, data, 403);
  }
}

class ValidationError extends HttpError {
  constructor(message = 'Validation Error', data) {
    super(message, data, 422);
  }
}

module.exports = {
  HttpError,
  NotFoundError,
  BadRequestError,
  UnauthenticatedError,
  UnauthorizedError,
  ValidationError,
};
