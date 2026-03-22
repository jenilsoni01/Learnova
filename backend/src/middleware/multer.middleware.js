import multer from "multer";
import fs from "fs";
import path from "path";

const uploadsRoot = path.resolve("public", "uploads");

const inferFolder = (file) => {
  if (file.fieldname === "avatar") return "avatars";

  if (file.mimetype.startsWith("image/")) return "images";
  if (file.mimetype.startsWith("video/")) return "videos";
  return "documents";
};

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const sanitizeBaseName = (name) =>
  name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 50);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = inferFolder(file);
    const targetDir = path.join(uploadsRoot, folder);
    ensureDir(targetDir);
    cb(null, targetDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeName = sanitizeBaseName(file.originalname || "file");
    cb(null, `${Date.now()}-${safeName}${ext}`);
  },
});

export const upload = multer({
  storage,
});