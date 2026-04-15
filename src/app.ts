import Fastify from 'fastify';
import { FastifyInstance } from 'fastify/types/instance';

import { EnvEnum } from '@/common/config/env.enum';
import { UsersModule } from '@/users/users.module';
import { ExceptionFilter } from '@/common/exception.filter';
import { DrizzleService } from '@/common/db/drizzle.service';
import { ConfigService } from '@/common/config/config.service';
import { TransactionsModule } from '@/transactions/transactions.module';

export class App {
  private readonly fastify: FastifyInstance;
  private readonly drizzleService: DrizzleService;
  private readonly usersModule: UsersModule;
  private readonly transactionsModule: TransactionsModule;

  constructor(private readonly configService: ConfigService) {
    this.fastify = this.fastify = Fastify({ logger: true });
    this.drizzleService = new DrizzleService(this.configService);
    this.usersModule = new UsersModule(this.drizzleService.client);
    this.transactionsModule = new TransactionsModule(
      this.drizzleService.client,
    );
  }

  private useRoutes() {
    this.fastify.get('/favicon.ico', (request, reply) => {
      return reply.code(200).send();
    });
    this.usersModule.registerRoutes(this.fastify);
    this.transactionsModule.registerRoutes(this.fastify);
  }

  private useFilters() {
    const exceptionFilter = new ExceptionFilter();
    this.fastify.setErrorHandler(exceptionFilter.handle.bind(exceptionFilter));
  }

  private useGracefulShutdown() {
    process.on('SIGTERM', () => void this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => void this.gracefulShutdown('SIGINT'));
  }

  private async gracefulShutdown(signal: string) {
    console.warn(`${signal} received. Starting graceful shutdown...`);

    const forceExitTimeout = setTimeout(() => {
      console.error(
        'Graceful shutdown timeout exceeded. Force exiting process.',
      );
      process.exit(1);
    }, 10000);

    try {
      await this.fastify.close();
      this.fastify.log.info('Server successfully closed');
      await this.drizzleService.disconnect();
      clearTimeout(forceExitTimeout);
      console.info('Shutdown complete.');
      process.exit(0);
    } catch (error) {
      console.error('Shutdown error', error);
      process.exit(1);
    }
  }

  public async init() {
    const PORT = this.configService.get(EnvEnum.APP_PORT);
    this.useRoutes();
    this.useFilters();
    await this.drizzleService.connect();
    this.useGracefulShutdown();

    await this.fastify.listen({ port: PORT });
  }
}
