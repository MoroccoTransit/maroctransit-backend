import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileUploadService {
  private baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get('BASE_URL') || 'http://localhost:3000';
  }

  getFileUrl(filename: string): string {
    if (!filename) return '';
    return `${this.baseUrl}/uploads/${filename}`;
  }

  getFilePath(filename: string): string {
    return `./uploads/${filename}`;
  }
}
