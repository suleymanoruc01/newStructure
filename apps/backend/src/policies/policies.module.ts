import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { PoliciesController } from './policies.controller.js';
import { PoliciesService } from './policies.service.js';

@Module({
  imports: [AuthModule],
  controllers: [PoliciesController],
  providers: [PoliciesService],
})
export class PoliciesModule {}
