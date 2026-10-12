import { HttpStatus, Injectable } from '@nestjs/common';
import type {
  AdminSupportTicketPatchBody,
  SupportTicketCreateBody,
  SupportTicketMessageCreateBody,
} from '@parton/api-contracts';
import { ErrorCode } from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';
import { LegalAuditLogger } from '../audit/legal-audit.logger.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';

const OPEN_STATUSES = new Set(['open', 'in_progress']);

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: SubscriptionsService,
    private readonly audit: LegalAuditLogger,
  ) {}

  private mapTicket(row: {
    id: string;
    subject: string;
    body: string;
    status: string;
    priority: string;
    requesterUserId: string;
    assignedAdminUserId: string | null;
    resolvedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      subject: row.subject,
      body: row.body,
      status: row.status as 'open' | 'in_progress' | 'resolved' | 'closed',
      priority: row.priority as 'low' | 'normal' | 'high',
      requesterUserId: row.requesterUserId,
      assignedAdminUserId: row.assignedAdminUserId,
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapMessage(row: {
    id: string;
    ticketId: string;
    authorUserId: string;
    body: string;
    isStaff: boolean;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      ticketId: row.ticketId,
      authorUserId: row.authorUserId,
      body: row.body,
      isStaff: row.isStaff,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async createTicket(requesterUserId: string, body: SupportTicketCreateBody) {
    const priority = (await this.subscriptions.userHasPrioritySupport(
      requesterUserId,
    ))
      ? 'high'
      : 'normal';
    const ticket = await this.prisma.supportTicket.create({
      data: {
        requesterUserId,
        subject: body.subject,
        body: body.body,
        priority,
        status: 'open',
        messages: {
          create: {
            authorUserId: requesterUserId,
            body: body.body,
            isStaff: false,
          },
        },
      },
    });
    return this.mapTicket(ticket);
  }

  async listTicketsForUser(requesterUserId: string, limit = 50) {
    const rows = await this.prisma.supportTicket.findMany({
      where: { requesterUserId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });
    return { items: rows.map((row) => this.mapTicket(row)) };
  }

  async getTicketForUser(ticketId: string, requesterUserId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!ticket || ticket.requesterUserId !== requesterUserId) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Destek talebi bulunamadı.',
      );
    }
    return {
      ...this.mapTicket(ticket),
      messages: ticket.messages.map((m) => this.mapMessage(m)),
    };
  }

  async addUserMessage(
    ticketId: string,
    requesterUserId: string,
    body: SupportTicketMessageCreateBody,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket || ticket.requesterUserId !== requesterUserId) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Destek talebi bulunamadı.',
      );
    }
    if (!OPEN_STATUSES.has(ticket.status)) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.SUPPORT_TICKET_CLOSED,
        'Kapalı destek talebine yanıt verilemez.',
      );
    }
    const message = await this.prisma.supportTicketMessage.create({
      data: {
        ticketId,
        authorUserId: requesterUserId,
        body: body.body,
        isStaff: false,
      },
    });
    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });
    return this.mapMessage(message);
  }

  async listTicketsAdmin(limit = 50, status?: string) {
    const rows = await this.prisma.supportTicket.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: Math.min(limit, 100),
    });
    return { items: rows.map((row) => this.mapTicket(row)) };
  }

  async getTicketAdmin(ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!ticket) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Destek talebi bulunamadı.',
      );
    }
    return {
      ...this.mapTicket(ticket),
      messages: ticket.messages.map((m) => this.mapMessage(m)),
    };
  }

  async addStaffMessage(
    ticketId: string,
    adminUserId: string,
    body: SupportTicketMessageCreateBody,
    requestId: string,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Destek talebi bulunamadı.',
      );
    }
    if (ticket.status === 'closed') {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.SUPPORT_TICKET_CLOSED,
        'Kapalı destek talebine yanıt verilemez.',
      );
    }
    const message = await this.prisma.supportTicketMessage.create({
      data: {
        ticketId,
        authorUserId: adminUserId,
        body: body.body,
        isStaff: true,
      },
    });
    const nextStatus = ticket.status === 'open' ? 'in_progress' : ticket.status;
    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: nextStatus,
        assignedAdminUserId: ticket.assignedAdminUserId ?? adminUserId,
        updatedAt: new Date(),
      },
    });
    await this.audit.append({
      category: 'admin',
      action: 'support_ticket_reply',
      actorUserId: adminUserId,
      actorRole: 'admin',
      resourceType: 'support_ticket',
      resourceId: ticketId,
      requestId,
    });
    return this.mapMessage(message);
  }

  async patchTicketAdmin(
    ticketId: string,
    body: AdminSupportTicketPatchBody,
    adminUserId: string,
    requestId: string,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Destek talebi bulunamadı.',
      );
    }
    const resolvedAt =
      body.status === 'resolved' || body.status === 'closed'
        ? new Date()
        : body.status
          ? null
          : ticket.resolvedAt;
    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: body.status ?? ticket.status,
        priority: body.priority ?? ticket.priority,
        assignedAdminUserId:
          body.assignedAdminUserId === undefined
            ? ticket.assignedAdminUserId
            : body.assignedAdminUserId,
        resolvedAt,
      },
    });
    await this.audit.append({
      category: 'admin',
      action: 'support_ticket_updated',
      actorUserId: adminUserId,
      actorRole: 'admin',
      resourceType: 'support_ticket',
      resourceId: ticketId,
      requestId,
      metadata: body,
    });
    return this.mapTicket(updated);
  }
}
