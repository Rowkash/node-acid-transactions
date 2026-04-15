import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';

import { ConfigService } from '@/common/config/config.service';
import { EnvEnum } from '@/common/config/env.enum';

export class DrizzleService {
  client: NodePgDatabase;
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const connectionString = this.configService.get(EnvEnum.DATABASE_URL);
    this.pool = new Pool({ connectionString });
    this.client = drizzle({
      client: this.pool,
    });
  }

  async connect() {
    try {
      await this.client.execute('select 1');
      console.info(
        `[DrizzleService] Drizzle successfully connected to Database`,
      );
    } catch (error) {
      if (error instanceof Error)
        console.error(
          '[DrizzleService] Error connecting to Database: ' + error.message,
        );
    }
  }

  async disconnect() {
    await this.pool.end();
    console.info('[DrizzleService] Successful disconnected from Database');
  }

  async ping() {
    try {
      await this.client.execute('select 1');
      return true;
    } catch {
      return false;
    }
  }
}
