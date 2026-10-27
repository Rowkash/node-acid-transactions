import { and, eq, inArray, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import {
  transactionsTable,
  TransactionStatusEnum,
} from '@/transactions/schemas/transactions.schema';
import { usersTable } from '@/users/schemas/user.schema';
import { TCreateTransactionDto } from '@/transactions/dto/transaction-create.dto';
import { BadRequestException } from '@/common/errors/bad-request.exception';
import { ConflictRequestException } from '@/common/errors/conflict-request.exception';
import { NotFoundRequestException } from '@/common/errors/not-found-request.exception';

export class TransactionsService {
  constructor(private readonly dbClient: NodePgDatabase) {}

  async create(data: TCreateTransactionDto) {
    if (data.fromUserId === data.toUserId) {
      throw new BadRequestException('Cannot transfer money to yourself.');
    }

    return await this.dbClient.transaction(
      // Check existing transaction
      async (tx) => {
        const [existing] = await tx
          .select()
          .from(transactionsTable)
          .where(eq(transactionsTable.idempotencyKey, data.idempotencyKey));

        if (existing) {
          const samePayload =
            existing.fromUserId === data.fromUserId &&
            existing.toUserId === data.toUserId &&
            this.normalizeDecimal(existing.amount) ===
              this.normalizeDecimal(data.amount);

          if (!samePayload) {
            throw new ConflictRequestException(
              'Idempotency key was already used with a different request.',
            );
          }
          return existing;
        }
        // Check existing transaction

        // Check users and block with sorting to prevent deadlocks
        const orderedUserIds = [data.fromUserId, data.toUserId].sort();

        const users = await tx
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(inArray(usersTable.id, orderedUserIds))
          .orderBy(usersTable.id)
          .for('update');

        const fromUser = users.find((u) => u.id === data.fromUserId);
        const toUser = users.find((u) => u.id === data.toUserId);

        if (!fromUser) {
          throw new NotFoundRequestException('Sender not found.');
        }

        if (!toUser) {
          throw new NotFoundRequestException('Receiver not found.');
        }
        // Check users and block with sorting to prevent deadlocks

        const [newTransaction] = await tx
          .insert(transactionsTable)
          .values({ ...data, status: TransactionStatusEnum.PENDING })
          .onConflictDoNothing({ target: transactionsTable.idempotencyKey })
          .returning();

        // Transfer money with checking
        // decrease Sender's amound
        const debited = await tx
          .update(usersTable)
          .set({
            balance: sql`${usersTable.balance} - ${data.amount}::numeric`,
          })
          .where(
            and(
              eq(usersTable.id, data.fromUserId),
              sql`${usersTable.balance} >= ${data.amount}::numeric`,
            ),
          )
          .returning({ id: usersTable.id });

        if (debited.length === 0) {
          throw new BadRequestException('Insufficient funds.');
        }

        // increase Receiver's amound
        await tx
          .update(usersTable)
          .set({
            balance: sql`${usersTable.balance} + ${data.amount}::numeric`,
          })
          .where(eq(usersTable.id, data.toUserId));
        // Transfer money with checking

        const [completedTransaction] = await tx
          .update(transactionsTable)
          .set({ status: TransactionStatusEnum.COMPLETED })
          .where(eq(transactionsTable.id, newTransaction.id))
          .returning();

        return completedTransaction;
      },
      {
        isolationLevel: 'read committed',
        accessMode: 'read write',
        deferrable: false,
      },
    );
  }

  private normalizeDecimal(val: string): string {
    const [intPart, decPart = ''] = val.split('.');
    const normalizedDec = decPart.padEnd(2, '0').slice(0, 2);
    return `${BigInt(intPart)}.${normalizedDec}`;
  }
}
