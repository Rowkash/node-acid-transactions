import { App } from '@/app';
import { ConfigService } from '@/common/config/config.service';

async function bootstrap() {
  try {
    const configService = new ConfigService();
    const app = new App(configService);
    await app.init();
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

void bootstrap();
