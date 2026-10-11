import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

import { RealtimeTicketService } from './realtime-ticket.service.js';

@Injectable()
export class SseTicketGuard implements CanActivate {
  constructor(private readonly tickets: RealtimeTicketService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const ticket = req.query.ticket;
    if (typeof ticket !== 'string' || ticket.length === 0) {
      return false;
    }
    req.userId = this.tickets.redeem(ticket);
    return true;
  }
}
