export function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

export function sendError(res, message, statusCode = 500, details) {
  const body = { success: false, message };

  if (details !== undefined) {
    body.details = details;
  }

  return res.status(statusCode).json(body);
}
