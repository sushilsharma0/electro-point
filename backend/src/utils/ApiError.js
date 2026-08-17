export class ApiError extends Error {
  constructor(status, code, message, details = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static validation(message, details) {
    return new ApiError(400, 'VALIDATION_ERROR', message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Not found') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message, details) {
    return new ApiError(409, 'CONFLICT', message, details);
  }

  static gone(message = 'Gone') {
    return new ApiError(410, 'GONE', message);
  }

  static payloadTooLarge(message = 'File too large') {
    return new ApiError(413, 'PAYLOAD_TOO_LARGE', message);
  }

  static unprocessable(message, details) {
    return new ApiError(422, 'UNPROCESSABLE', message, details);
  }

  static tooMany(message = 'Too many requests') {
    return new ApiError(429, 'RATE_LIMITED', message);
  }

  static unavailable(message = 'Service unavailable') {
    return new ApiError(503, 'UNAVAILABLE', message);
  }
}

export default ApiError;
