import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { RealtimeController } from './realtime.controller.js';
import { RealtimeTicketService } from './realtime-ticket.service.js';
import { SseTicketGuard } from './sse-ticket.guard.js';

@Module({
  imports: [AuthModule],
  controllers: [RealtimeController],
  providers: [RealtimeTicketService, SseTicketGuard],
})
export class RealtimeModule {}
