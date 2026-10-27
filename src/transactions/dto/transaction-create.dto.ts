import { z as zod } from 'zod';

export const createTransactionSchema = zod.object({
  idempotencyKey: zod.uuid(),
  fromUserId: zod.guid({ error: 'Invalid user ID' }),
  toUserId: zod.guid({ error: 'Invalid user ID' }),
  amount: zod
    .string()
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val) && Number(val) > 0, {
      message: 'Amount must be a valid decimal with up to 2 decimal places',
    }),
});

export type TCreateTransactionDto = zod.infer<typeof createTransactionSchema>;
