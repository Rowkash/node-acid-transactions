import { and, eq, inArray, sql } from 'drizzle-orm';
import { constants as statusCode } from 'node:http2';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import {
  transactionsTable,
  TransactionStatusEnum,
} from '@/transactions/schemas/transactions.schema';
import { usersTable } from '@/users/schemas/user.schema';
import { TCreateTransactionDto } from '@/transactions/dto/transaction-create.dto';
import { HttpError } from '@/common/http-error';

export class TransactionsService {
  constructor(private readonly dbClient: NodePgDatabase) {}

  async create(data: TCreateTransactionDto) {
    if (data.fromUserId === data.toUserId) {
      throw new HttpError(
        statusCode.HTTP_STATUS_BAD_REQUEST,
        'Cannot transfer money to yourself.',
      );
    }

    return await this.dbClient.transaction(
      async (tx) => {
        const [newTransaction] = await tx
          .insert(transactionsTable)
          .values({ ...data, status: TransactionStatusEnum.PENDING })
          .onConflictDoNothing({ target: transactionsTable.idempotencyKey })
          .returning();

        if (!newTransaction) {
          const [existing] = await tx
            .select()
            .from(transactionsTable)
            .where(eq(transactionsTable.idempotencyKey, data.idempotencyKey));

          const samePayload =
            existing.fromUserId === data.fromUserId &&
            existing.toUserId === data.toUserId &&
            this.normalizeDecimal(existing.amount) ===
              this.normalizeDecimal(data.amount);

          if (!samePayload) {
            throw new HttpError(
              statusCode.HTTP_STATUS_CONFLICT,
              'Idempotency key was already used with a different request.',
            );
          }

          return existing;
        }

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
          throw new HttpError(
            statusCode.HTTP_STATUS_NOT_FOUND,
            'Sender not found.',
          );
        }

        if (!toUser) {
          throw new HttpError(
            statusCode.HTTP_STATUS_NOT_FOUND,
            'Receiver not found.',
          );
        }

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
          throw new HttpError(
            statusCode.HTTP_STATUS_BAD_REQUEST,
            'Insufficient funds.',
          );
        }

        // increase Receiver's amound
        await tx
          .update(usersTable)
          .set({
            balance: sql`${usersTable.balance} + ${data.amount}::numeric`,
          })
          .where(eq(usersTable.id, data.toUserId));

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
