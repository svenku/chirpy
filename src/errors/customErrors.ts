// Base class for custom HTTP errors
export abstract class HttpError extends Error {
  abstract statusCode: number;
  
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 400 Bad Request Error
export class BadRequestError extends HttpError {
  statusCode = 400;
  
  constructor(message: string = "Bad Request") {
    super(message);
  }
}

// 401 Unauthorized Error
export class UnauthorizedError extends HttpError {
  statusCode = 401;
  
  constructor(message: string = "Unauthorized") {
    super(message);
  }
}

// 403 Forbidden Error
export class ForbiddenError extends HttpError {
  statusCode = 403;
  
  constructor(message: string = "Forbidden") {
    super(message);
  }
}

// 404 Not Found Error
export class NotFoundError extends HttpError {
  statusCode = 404;
  
  constructor(message: string = "Not Found") {
    super(message);
  }
}