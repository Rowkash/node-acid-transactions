import { z as zod } from 'zod';
import {
  pgTable,
  varchar,
  uniqueIndex,
  uuid,
  decimal,
} from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import {
  timestampsData,
  TimeStampsSchema,
} from '@/common/schemas/timestamps.schema';

export const UserSchema = TimeStampsSchema.extend({
  id: zod.number(),
  name: zod.string(),
  email: zod.email(),
  balance: zod.number(),
});

export const usersTable = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name').notNull(),
    email: varchar('email').unique().notNull(),
    balance: decimal('balance', { precision: 12, scale: 2 })
      .default('100000.00')
      .notNull(),
    ...timestampsData,
  },
  (table) => [uniqueIndex('email_idx').on(table.email)],
);

export type TUserSchema = InferSelectModel<typeof usersTable>;
export type TUserInsertSchema = InferInsertModel<typeof usersTable>;
