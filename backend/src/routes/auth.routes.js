// FILE: server/routes/auth.routes.js
// STATUS: MODIFIED
// PURPOSE: Define authentication endpoints for learners and admins.
// ⚠️ WARNING: This file was modified. Review changes carefully before merging.

import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.post("/register", upload.single("avatar"), register);
router.post("/login", login);
router.get("/me", protect, getMe);

export default router;
