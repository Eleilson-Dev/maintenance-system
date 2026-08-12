import multer from "multer";

import { AppError } from "../errors/AppError.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];

export const CallImagesUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    files: 3,
    fileSize: MAX_FILE_SIZE,
  },

  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      callback(
        new AppError(
          400,
          "Formato de imagem inválido. Envie apenas JPG ou PNG.",
        ),
      );

      return;
    }

    callback(null, true);
  },
}).array("attachments", 3);
