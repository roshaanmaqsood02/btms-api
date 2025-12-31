// src/common/services/cloudinary.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as streamifier from 'streamifier';
import { getCloudinary } from './cloudinary.config';
import { UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private cloudinary = getCloudinary();

  uploadImage(
    file: Express.Multer.File,
    folder = 'profilePic',
  ): Promise<{ secure_url: string; public_id: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            return reject(
              new InternalServerErrorException('Cloudinary upload failed'),
            );
          }

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async deleteImage(publicId: string) {
    return this.cloudinary.uploader.destroy(publicId);
  }
}
