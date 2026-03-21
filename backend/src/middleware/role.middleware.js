import { ApiError } from "../utils/ApiError.js";

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const error = new ApiError(
        403,
        `Role '${req.user?.role || "unknown"}' not allowed`
      );
      return res.status(error.statusCode).json(error);
    }

    return next();
  };
};

export { authorize };
