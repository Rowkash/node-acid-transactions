import { FastifyReply, FastifyRequest } from 'fastify';
import { TransactionsService } from '@/transactions/transactions.service';

import { createTransactionSchema } from '@/transactions/dto/transaction-create.dto';

export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  async create(req: FastifyRequest, res: FastifyReply) {
    const body = createTransactionSchema.parse(req.body);
    const transaction = await this.service.create(body);
    return res.status(201).send(transaction);
  }
}
