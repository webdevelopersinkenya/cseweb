const triggerError = (req, res, next) => {
  const error = new Error("This is a simulated server error!");
  error.status = 500;
  next(error);
};

module.exports = { triggerError };
