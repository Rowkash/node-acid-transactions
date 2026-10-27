import { HttpError } from '@/common/errors/http-error';
import { constants as statusCode } from 'node:http2';

export class ConflictRequestException extends HttpError {
  constructor(message: string, context?: string) {
    super(statusCode.HTTP_STATUS_CONFLICT, message, context);
  }
}
