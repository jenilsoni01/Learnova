import multer from "multer";

// Use /tmp for serverless environments (Vercel), otherwise use ./public/temp
const uploadDir = process.env.VERCEL ? "/tmp" : "./public/temp";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({
  storage,
});