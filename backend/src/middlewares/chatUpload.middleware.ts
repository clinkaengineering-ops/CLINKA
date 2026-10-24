import { createUploadMiddleware } from "../config/upload";

export const CHAT_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
export const CHAT_MAX_VOICE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const CHAT_ALLOWED_EXTENSIONS = new Set<string>([
  // Images
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  // Audio / Voice messages
  ".webm",
  ".m4a",
  ".mp4",
  ".ogg",
  ".mp3",
  // Documents & Office / Spreadsheets
  ".pdf",
  ".xlsx",
  ".xls",
  ".docx",
  ".doc",
  ".csv",
  ".txt",
  // Compressed / Archives
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
  ".tgz",
  ".bz2",
  // CAD & 2D/3D Drawing Formats
  ".dwg",
  ".dxf",
  ".dgn",
  ".dwf",
  ".dwfx",
  // BIM & Revit Formats
  ".rvt",
  ".rfa",
  ".rte",
  ".ifc",
  ".nwd",
  ".nwc",
  ".nwf",
  // Architectural & 3D Modeling Formats
  ".skp",
  ".pln",
  ".pla",
  ".3ds",
  ".max",
  ".blend",
  ".obj",
  ".stl",
  ".step",
  ".stp",
  ".iges",
  ".igs",
  ".fbx",
  ".dae",
  // Civil / Structural / Survey Formats
  ".sdb",
  ".edb",
  ".std",
  ".landxml",
  ".xml",
  ".kml",
  ".kmz",
]);

export const CHAT_MIME_TYPES = new Set<string>([
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  // Audio / Voice messages
  "audio/webm",
  "audio/mp4",
  "audio/ogg",
  "audio/mpeg",
  // PDF, Office, and text docs
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "text/csv",
  "application/xml",
  "text/xml",
  // Archives
  "application/zip",
  "application/x-zip-compressed",
  "application/x-zip",
  "multipart/x-zip",
  "application/x-rar-compressed",
  "application/vnd.rar",
  "application/x-rar",
  "application/x-7z-compressed",
  "application/x-tar",
  "application/tar",
  "application/gzip",
  "application/x-gzip",
  "application/x-bzip2",
  // CAD / BIM / 3D
  "image/vnd.dwg",
  "image/x-dwg",
  "application/acad",
  "application/x-acad",
  "application/autocad_dwg",
  "application/dwg",
  "application/x-dwg",
  "image/vnd.dxf",
  "image/x-dxf",
  "application/dxf",
  "application/x-dxf",
  "application/x-step",
  "model/step",
  "model/iges",
  "model/stl",
  "model/obj",
  "application/vnd.sketchup.skp",
  "application/vnd.google-earth.kml+xml",
  "application/vnd.google-earth.kmz",
  // Generic binary / octet-stream for CAD, BIM, and archive binaries sent by browsers
  "application/octet-stream",
]);

const chatUpload = createUploadMiddleware("documents", {
  allowedMimeTypes: CHAT_MIME_TYPES,
  allowedExtensions: CHAT_ALLOWED_EXTENSIONS,
  maxFileSize: CHAT_MAX_FILE_SIZE,
});

export default chatUpload;
