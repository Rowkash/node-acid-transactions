import { FastifyInstance } from 'fastify/types/instance';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { TransactionsRoutes } from '@/transactions/transactions.routes';
import { TransactionsService } from '@/transactions/transactions.service';
import { TransactionsController } from '@/transactions/transactions.controller';

export class TransactionsModule {
  private readonly service: TransactionsService;
  private readonly controller: TransactionsController;
  private readonly routes: TransactionsRoutes;

  constructor(dbClient: NodePgDatabase) {
    this.service = new TransactionsService(dbClient);
    this.controller = new TransactionsController(this.service);
    this.routes = new TransactionsRoutes(this.controller);
  }

  public registerRoutes(fastify: FastifyInstance) {
    this.routes.register(fastify);
  }
}
