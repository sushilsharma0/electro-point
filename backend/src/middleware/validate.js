import { ApiError } from '../utils/ApiError.js';

export function validate(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return next(ApiError.validation(details[0]?.message || 'Invalid request', details));
    }
    if (parsed.data.body !== undefined) req.body = parsed.data.body;
    if (parsed.data.query !== undefined) req.query = parsed.data.query;
    if (parsed.data.params !== undefined) req.params = parsed.data.params;
    next();
  };
}
