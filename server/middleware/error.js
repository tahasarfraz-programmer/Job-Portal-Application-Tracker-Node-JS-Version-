export const notFound = (_req, res) => res.status(404).json({ success: false, message: 'Route not found' });

export const errorHandler = (err, _req, res, _next) => {
  let status = err.status || 500;
  let message = err.message;
  if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map((e) => e.message).join(', '); }
  if (err.name === 'CastError') { status = 400; message = 'Invalid identifier'; }
  if (err.code === 11000) { status = 409; message = 'That record already exists'; }
  if (err.code === 'LIMIT_FILE_SIZE') { status = 400; message = 'File is larger than 5 MB'; }
  if (status >= 500) { console.error(err); message = 'Something went wrong on our side'; }
  res.status(status).json({ success: false, message });
};
