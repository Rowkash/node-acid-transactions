import { z as zod, ZodError } from 'zod';
import { constants as statusCode } from 'node:http2';
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

import { HttpError } from '@/common/http-error';
import { STATUS_CODES } from 'http';

export class ExceptionFilter {
  public handle(
    error: FastifyError | ZodError | HttpError,
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    switch (true) {
      case error instanceof ZodError:
        return this.handleZodError(error, reply);
      case error instanceof HttpError:
        return this.handleHttpError(error, reply);

      default:
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Something went wrong',
        });
    }
  }

  handleHttpError(error: HttpError, reply: FastifyReply) {
    return reply.code(error.statusCode).send({
      statusCode: error.statusCode,
      message: STATUS_CODES[error.statusCode],
      details: error.message,
    });
  }

  handleZodError(error: ZodError, reply: FastifyReply) {
    const formatErrors = zod.flattenError(error);
    let details = {};
    if (formatErrors.formErrors.length > 0) details = formatErrors.formErrors;
    if (Object.keys(formatErrors.fieldErrors).length != 0)
      details = formatErrors.fieldErrors;

    return reply.code(statusCode.HTTP_STATUS_BAD_REQUEST).send({
      statusCode: statusCode.HTTP_STATUS_BAD_REQUEST,
      message: 'Validation failed',
      details,
    });
  }
}
