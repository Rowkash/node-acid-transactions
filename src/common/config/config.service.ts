import { envSchema, type EnvConfig } from '@/common/config/env.schema';

export class ConfigService {
  private readonly config: EnvConfig;

  constructor(customConfig?: EnvConfig) {
    this.config = customConfig ?? envSchema.parse(process.env);
  }

  get<T extends keyof EnvConfig>(key: T): EnvConfig[T] {
    return this.config[key];
  }
}
