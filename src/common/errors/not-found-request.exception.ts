import { HttpError } from '@/common/errors/http-error';
import { constants as statusCode } from 'node:http2';

export class NotFoundRequestException extends HttpError {
  constructor(message: string, context?: string) {
    super(statusCode.HTTP_STATUS_NOT_FOUND, message, context);
  }
}
