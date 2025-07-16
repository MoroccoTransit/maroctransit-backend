import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string = '';
    let validationErrors: string[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        if (Array.isArray((exceptionResponse as any).message)) {
          validationErrors = (exceptionResponse as any).message;
          message = 'Validation failed';
        } else {
          message = (exceptionResponse as any).message || 'HTTP exception occurred';
        }
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message || 'Internal server error';

      this.logger.error(
        `Unhandled exception: ${message}`,
        exception.stack,
        `For request: ${request.method} ${request.url}`,
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Unknown server error';
      this.logger.error('Non-Error exception thrown', exception);
    }

    const responseBody: ExceptionResponse = {
      success: false,
      statusCode: status,
      message,
      ...(validationErrors.length > 0 && { errors: validationErrors }),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(responseBody);
  }
}

interface ExceptionResponse {
  success: boolean;
  statusCode: number;
  message: string;
  errors?: string[];
  timestamp: string;
  path: string;
}
