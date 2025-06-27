import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { Logger } from '@nestjs/common';

const logger = new Logger('MulterConfig');

export const multerConfig = {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const filename = `${uuidv4()}${path.extname(file.originalname)}`;
      logger.debug(`Creating file: ${filename} from ${file.originalname}`);
      cb(null, filename);
    },
  }),
  fileFilter: (req, file, cb) => {
    logger.debug(`Processing file: ${file.originalname}, mimetype: ${file.mimetype}`);

    // Accept common image formats
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

    if (allowedMimes.includes(file.mimetype)) {
      logger.debug(`Accepted file: ${file.originalname}`);
      cb(null, true);
    } else {
      logger.debug(`Rejected file: ${file.originalname} - invalid mimetype: ${file.mimetype}`);
      cb(null, false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
};
