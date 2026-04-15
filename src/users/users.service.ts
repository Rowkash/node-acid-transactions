import { seed } from 'drizzle-seed';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { usersTable } from '@/users/schemas/user.schema';

export class UserService {
  constructor(private readonly dbClient: NodePgDatabase) {}

  async generate() {
    await seed(this.dbClient, { usersTable }, { count: 1000 }).refine(
      (func) => ({
        usersTable: {
          columns: {
            id: func.uuid(),
            balance: func.number({ minValue: 100000, precision: 12 }),
          },
        },
      }),
    );
  }

  async getUsers() {
    const users = await this.dbClient
      .select({ id: usersTable.id })
      .from(usersTable);
    return users.map((user) => user.id);
  }
}
