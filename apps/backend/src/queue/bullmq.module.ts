import {
  DynamicModule,
  Injectable,
  Logger,
  Module,
  type OnModuleInit,
} from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { AppConfigService } from '../config/app-config.service.js';

@Injectable()
class BullmqBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BullmqBootstrapService.name);

  constructor(private readonly config: AppConfigService) {}

  onModuleInit(): void {
    if (!this.config.bullmqEnabled()) {
      this.logger.log('BullMQ disabled (Stage A outbox drain only).');
      return;
    }
    this.logger.log(
      `BullMQ enabled — Redis at ${this.config.env.REDIS_QUEUE_URL}`,
    );
  }
}

@Module({})
export class BullmqModule {
  static register(enabled: boolean, redisUrl?: string): DynamicModule {
    if (!enabled || !redisUrl) {
      return {
        module: BullmqModule,
        providers: [BullmqBootstrapService],
      };
    }
    return {
      module: BullmqModule,
      imports: [
        BullModule.forRoot({
          connection: { url: redisUrl },
        }),
        BullModule.registerQueue({ name: 'outbox-relay' }),
      ],
      providers: [BullmqBootstrapService],
      exports: [BullModule],
    };
  }
}
