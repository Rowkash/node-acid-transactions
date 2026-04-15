import { FastifyInstance } from 'fastify';

import { UserController } from '@/users/users.controller';

export class UsersRoutes {
  constructor(private readonly controller: UserController) {}

  register(app: FastifyInstance) {
    app.register(
      (router) => {
        router.get('/', this.controller.getUsers.bind(this.controller));
        router.post(
          '/generate',
          this.controller.generate.bind(this.controller),
        );
      },
      {
        prefix: '/users',
      },
    );
  }
}
