import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    const error = new ApiError(401, "Not authorized, no token");
    return res.status(error.statusCode).json(error);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      const error = new ApiError(401, "Not authorized, user not found");
      return res.status(error.statusCode).json(error);
    }

    req.user = user;
    return next();
  } catch {
    const error = new ApiError(401, "Token invalid or expired");
    return res.status(error.statusCode).json(error);
  }
});

export { protect };
