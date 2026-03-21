// FILE: server/middleware/role.middleware.js
// STATUS: MODIFIED
// PURPOSE: Restrict protected endpoints to specific user roles.
// ⚠️ WARNING: This file was modified. Review changes carefully before merging.

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role '${req.user.role}' not allowed` });
    }

    return next();
  };
};

export { authorize };
