import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { parseEnv } from './env.schema.js';
import { AppConfigService } from './app-config.service.js';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => parseEnv(config as Record<string, string | undefined>),
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
