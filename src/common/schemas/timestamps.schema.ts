import { z as zod } from 'zod';
import { timestamp } from 'drizzle-orm/pg-core';

export const timestampsData = {
  updatedAt: timestamp('updatedAt').defaultNow(),
  createdAt: timestamp('createdAt').defaultNow(),
};

export const TimeStampsSchema = zod.object({
  createdAt: zod.date(),
  updatedAt: zod.date(),
});
