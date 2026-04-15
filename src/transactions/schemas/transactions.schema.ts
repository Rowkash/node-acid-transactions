import { z as zod } from 'zod';
import {
  pgTable,
  uniqueIndex,
  uuid,
  pgEnum,
  decimal,
} from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import {
  timestampsData,
  TimeStampsSchema,
} from '@/common/schemas/timestamps.schema';
import { usersTable } from '@/users/schemas/user.schema';

export enum TransactionStatusEnum {
  COMPLETED = 'completed',
  FAILED = 'failed',
  REJECTED = 'rejected',
  PENDING = 'pending',
}

export const transactionStatusPgEnum = pgEnum('status', TransactionStatusEnum);

export const TransactionsSchema = TimeStampsSchema.extend({
  id: zod.uuid(),
  idempotencyKey: zod.uuid(),
  fromUserId: zod.uuid(),
  toUserId: zod.uuid(),
  amount: zod.number(),
  status: zod.enum(TransactionStatusEnum),
});

export const transactionsTable = pgTable(
  'transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    idempotencyKey: uuid('idempotency_key').notNull().unique(),
    fromUserId: uuid('from_user_id')
      .notNull()
      .references(() => usersTable.id),
    toUserId: uuid('to_user_id')
      .notNull()
      .references(() => usersTable.id),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    status: transactionStatusPgEnum()
      .default(TransactionStatusEnum.PENDING)
      .notNull(),

    ...timestampsData,
  },
  (table) => [uniqueIndex('idempotency_key_idx').on(table.idempotencyKey)],
);

export type TTransactionSchema = InferSelectModel<typeof transactionsTable>;
export type TTransactionInsertSchema = InferInsertModel<
  typeof transactionsTable
>;
