import { randomBytes } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCode } from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';
import { AppConfigService } from '../config/app-config.service.js';

type TicketRecord = {
  userId: string;
  expiresAt: number;
};

@Injectable()
export class RealtimeTicketService {
  private readonly tickets = new Map<string, TicketRecord>();

  constructor(private readonly config: AppConfigService) {}

  issue(userId: string): { ticket: string; expiresAt: Date } {
    const ticket = randomBytes(24).toString('hex');
    const ttlMs = this.config.env.SSE_TICKET_TTL_SECONDS * 1000;
    const expiresAt = Date.now() + ttlMs;
    this.tickets.set(ticket, { userId, expiresAt });
    return { ticket, expiresAt: new Date(expiresAt) };
  }

  redeem(ticket: string): string {
    this.purgeExpired();
    const row = this.tickets.get(ticket);
    if (!row || row.expiresAt < Date.now()) {
      this.tickets.delete(ticket);
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
        'SSE bilet geçersiz veya süresi doldu.',
      );
    }
    this.tickets.delete(ticket);
    return row.userId;
  }

  private purgeExpired(): void {
    const now = Date.now();
    for (const [key, row] of this.tickets) {
      if (row.expiresAt < now) {
        this.tickets.delete(key);
      }
    }
  }
}
