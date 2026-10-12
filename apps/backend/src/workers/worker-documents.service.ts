import { randomUUID } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import type { WorkerDocumentCreateBody } from '@parton/api-contracts';
import { ErrorCode } from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';
import { AppConfigService } from '../config/app-config.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ObjectStorageService } from '../storage/object-storage.service.js';

@Injectable()
export class WorkerDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly storage: ObjectStorageService,
  ) {}

  private allowedMimeSet(): Set<string> {
    return new Set(
      this.config.env.WORKER_DOCUMENT_ALLOWED_MIME.split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    );
  }

  private assertUploadAllowed(contentType: string, sizeBytes: number): void {
    if (!this.allowedMimeSet().has(contentType)) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_DOCUMENT,
        'Desteklenmeyen belge formatı.',
      );
    }
    if (sizeBytes > this.config.env.WORKER_DOCUMENT_MAX_BYTES) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.DOCUMENT_TOO_LARGE,
        'Belge boyutu limiti aşıldı.',
      );
    }
  }

  async listForUser(userId: string) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'İş arayan profili gerekli.',
      );
    }
    const rows = await this.prisma.workerDocument.findMany({
      where: { workerProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
    return {
      items: rows.map((row) => this.mapRow(row)),
    };
  }

  async createUpload(userId: string, body: WorkerDocumentCreateBody) {
    this.assertUploadAllowed(body.contentType, body.sizeBytes);
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'İş arayan profili gerekli.',
      );
    }

    const storageKey = `workers/${profile.id}/${body.documentType}/${randomUUID()}/${body.fileName}`;
    const expiresSeconds = 900;
    const uploadUrl = await this.storage.presignedPutUrl(
      storageKey,
      body.contentType,
      expiresSeconds,
    );
    const uploadExpiresAt = new Date(Date.now() + expiresSeconds * 1000);

    const row = await this.prisma.workerDocument.upsert({
      where: {
        workerProfileId_documentType: {
          workerProfileId: profile.id,
          documentType: body.documentType,
        },
      },
      create: {
        workerProfileId: profile.id,
        documentType: body.documentType,
        fileName: body.fileName,
        contentType: body.contentType,
        sizeBytes: body.sizeBytes,
        storageKey,
        status: 'pending_upload',
      },
      update: {
        fileName: body.fileName,
        contentType: body.contentType,
        sizeBytes: body.sizeBytes,
        storageKey,
        status: 'pending_upload',
        uploadedAt: null,
      },
    });

    return {
      ...this.mapRow(row),
      uploadUrl,
      uploadExpiresAt: uploadExpiresAt.toISOString(),
    };
  }

  async finalizeUpload(userId: string, documentId: string) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'İş arayan profili gerekli.',
      );
    }
    const row = await this.prisma.workerDocument.findUnique({
      where: { id: documentId },
    });
    if (!row) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Belge bulunamadı.',
      );
    }
    if (row.workerProfileId !== profile.id) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Bu belgeye erişiminiz yok.',
      );
    }
    const exists = await this.storage.objectExists(row.storageKey);
    if (!exists) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.INVALID_DOCUMENT,
        'Belge depolamada bulunamadı.',
      );
    }
    const updated = await this.prisma.workerDocument.update({
      where: { id: row.id },
      data: {
        status: 'uploaded',
        uploadedAt: new Date(),
      },
    });
    return this.mapRow(updated);
  }

  async downloadUrl(userId: string, documentId: string) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'İş arayan profili gerekli.',
      );
    }
    const row = await this.prisma.workerDocument.findUnique({
      where: { id: documentId },
    });
    if (!row || row.status !== 'uploaded') {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Belge bulunamadı.',
      );
    }
    if (row.workerProfileId !== profile.id) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Bu belgeye erişiminiz yok.',
      );
    }
    const expiresSeconds = 900;
    const downloadUrl = await this.storage.presignedGetUrl(
      row.storageKey,
      expiresSeconds,
    );
    return {
      downloadUrl,
      expiresAt: new Date(Date.now() + expiresSeconds * 1000).toISOString(),
    };
  }

  async uploadedTypesForUsers(
    userIds: string[],
  ): Promise<Map<string, Set<string>>> {
    const uniqueIds = [...new Set(userIds)];
    const out = new Map<string, Set<string>>();
    for (const id of uniqueIds) {
      out.set(id, new Set());
    }
    if (uniqueIds.length === 0) {
      return out;
    }
    const profiles = await this.prisma.workerProfile.findMany({
      where: { userId: { in: uniqueIds } },
      include: {
        documents: { where: { status: 'uploaded' } },
      },
    });
    for (const profile of profiles) {
      out.set(
        profile.userId,
        new Set(profile.documents.map((d) => d.documentType)),
      );
    }
    return out;
  }

  async uploadedTypesForUser(userId: string): Promise<Set<string>> {
    const map = await this.uploadedTypesForUsers([userId]);
    return map.get(userId) ?? new Set();
  }

  async adminDownloadUrl(documentId: string) {
    const row = await this.prisma.workerDocument.findUnique({
      where: { id: documentId },
    });
    if (!row || row.status !== 'uploaded') {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Belge bulunamadı.',
      );
    }
    const expiresSeconds = 900;
    const downloadUrl = await this.storage.presignedGetUrl(
      row.storageKey,
      expiresSeconds,
    );
    return {
      downloadUrl,
      expiresAt: new Date(Date.now() + expiresSeconds * 1000).toISOString(),
    };
  }

  private mapRow(row: {
    id: string;
    documentType: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
    status: string;
    uploadedAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      documentType: row.documentType,
      fileName: row.fileName,
      contentType: row.contentType,
      sizeBytes: row.sizeBytes,
      status: row.status as 'pending_upload' | 'uploaded',
      uploadedAt: row.uploadedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
