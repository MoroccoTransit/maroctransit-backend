import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileUploadService {
  constructor(private readonly configService: ConfigService) {}

  getFileUrl(filename: string): string {
    return `${this.configService.get('BASE_URL')}/uploads/${filename}`;
  }

  getFilePath(filename: string): string {
    return `./uploads/${filename}`;
  }
}
