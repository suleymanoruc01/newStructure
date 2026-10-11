import {
  Controller,
  MessageEvent,
  Post,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, interval, map } from 'rxjs';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { successResponse } from '../common/response.util.js';
import { AppConfigService } from '../config/app-config.service.js';
import { RealtimeTicketService } from './realtime-ticket.service.js';
import { SseTicketGuard } from './sse-ticket.guard.js';

@Controller('realtime')
export class RealtimeController {
  constructor(
    private readonly tickets: RealtimeTicketService,
    private readonly config: AppConfigService,
  ) {}

  @Post('ticket')
  @UseGuards(JwtAuthGuard)
  createTicket(@Req() req: Request) {
    const issued = this.tickets.issue(req.userId!);
    return successResponse(req.requestId ?? '', {
      ticket: issued.ticket,
      expiresAt: issued.expiresAt.toISOString(),
    });
  }

  @Sse('stream')
  @UseGuards(SseTicketGuard)
  stream(@Req() req: Request): Observable<MessageEvent> {
    const userId = req.userId!;
    const heartbeatMs = this.config.env.SSE_HEARTBEAT_INTERVAL_MS;
    return interval(heartbeatMs).pipe(
      map((count) => ({
        id: String(count),
        type: 'heartbeat',
        data: JSON.stringify({ userId, ts: new Date().toISOString() }),
        retry: heartbeatMs,
      })),
    );
  }
}
