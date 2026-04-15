import { FastifyInstance } from 'fastify';

import { TransactionsController } from '@/transactions/transactions.controller';

export class TransactionsRoutes {
  constructor(private readonly controller: TransactionsController) {}

  register(app: FastifyInstance) {
    app.register(
      (router) => {
        router.post('/', this.controller.create.bind(this.controller));
      },
      {
        prefix: '/transactions',
      },
    );
  }
}
