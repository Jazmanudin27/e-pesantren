export const sendSuccess = (res, message, data = {}, statusCode = 200) => {
  if (Array.isArray(data)) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data && typeof data === 'object' ? data : {}),
    data: (data && data.data !== undefined) ? data.data : data
  });
};

export const sendError = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    error: message,
    message
  });
};
