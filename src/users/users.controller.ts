import { constants as statusCode } from 'http2';
import { FastifyReply, FastifyRequest } from 'fastify';

import { UserService } from '@/users/users.service';

export class UserController {
  constructor(private readonly service: UserService) {}

  async generate(req: FastifyRequest, res: FastifyReply) {
    await this.service.generate();
    return res.code(statusCode.HTTP_STATUS_CREATED).send({
      message: 'User generated successfully.',
    });
  }

  async getUsers(req: FastifyRequest, res: FastifyReply) {
    const users = await this.service.getUsers();
    return res.code(statusCode.HTTP_STATUS_OK).send({ result: users });
  }
}
