import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { FastifyInstance } from 'fastify/types/instance';

import { UsersRoutes } from '@/users/users.routes';
import { UserService } from '@/users/users.service';
import { UserController } from '@/users/users.controller';

export class UsersModule {
  private readonly router: UsersRoutes;
  private readonly controller: UserController;
  readonly service: UserService;

  constructor(dbClient: NodePgDatabase) {
    this.service = new UserService(dbClient);
    this.controller = new UserController(this.service);
    this.router = new UsersRoutes(this.controller);
  }

  public registerRoutes(fastify: FastifyInstance) {
    this.router.register(fastify);
  }
}
