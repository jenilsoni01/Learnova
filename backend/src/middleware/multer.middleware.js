import multer from "multer";
import path from "path";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const inferFolder = (file) => {
  if (file.fieldname === "avatar") return "avatars";

  if (file.mimetype.startsWith("image/")) return "images";
  if (file.mimetype.startsWith("video/")) return "videos";
  return "documents";
};

const sanitizeBaseName = (name) =>
  name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 50);

const storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_S3_BUCKET_NAME || 'learnova-storage',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    const folder = inferFolder(file);
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeName = sanitizeBaseName(file.originalname || "file");
    cb(null, `${folder}/${Date.now()}-${safeName}${ext}`);
  },
});

export const upload = multer({
  storage,
});