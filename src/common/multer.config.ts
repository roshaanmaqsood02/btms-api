import { diskStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';

export const profilePicMulterConfig = {
  storage: diskStorage({
    destination: './uploads/profilePic',
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${uniqueName}${extname(file.originalname)}`);
    },
  }),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
      return cb(
        new BadRequestException('Only JPG, JPEG, PNG files are allowed'),
        false,
      );
    }
    cb(null, true);
  },
};
