const errorHandler = (err, req, res, next) => {
  console.error(
    "========================================"
  );

  console.error("🔥 BACKEND ERROR");

  console.error(
    "Method:",
    req.method
  );

  console.error(
    "URL:",
    req.originalUrl
  );

  console.error(
    "Status:",
    res.statusCode
  );

  console.error(
    "Message:",
    err.message
  );

  console.error(
    "Stack:",
    err.stack
  );

  console.error(
    "========================================"
  );

  const statusCode =
    res.statusCode === 200
      ? 500
      : res.statusCode;

  res.status(statusCode);

  res.json({
    message:
      err.message ||
      "Internal Server Error",

    stack:
      process.env.NODE_ENV === "production"
        ? null
        : err.stack,
  });
};

const notFound = (req, res, next) => {
  const error = new Error(
    `Not Found - ${req.originalUrl}`
  );

  res.status(404);

  next(error);
};

export {
  errorHandler,
  notFound,
};