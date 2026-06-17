import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "engineer-docs",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
  } as any,
});

const upload = multer({ storage });

export default upload;