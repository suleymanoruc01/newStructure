import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { ErrorCode } from '@parton/api-contracts';

import { LegalAuditLogger } from '../audit/legal-audit.logger.js';
import { ApiException } from '../common/api.exception.js';
import { PrismaService } from '../prisma/prisma.service.js';

const POLICY_ORDER = ['kvkk', 'explicit-consent', 'privacy', 'terms'] as const;

const DEFAULT_POLICIES = [
  {
    slug: 'kvkk',
    title: 'KVKK Aydınlatma Metni',
    body: 'PartOn, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusu olarak telefon numaranızı, hesap rolünüzü, cihaz kaydınızı ve uygulama içi işlem kayıtlarınızı hizmeti sunmak, güvenliği sağlamak ve yasal yükümlülükleri yerine getirmek için işler. Bu metnin sürüm numarası onay kaydınıza yazılır. Metin değişirse güncel sürümü yeniden onaylamanız gerekir. Haklarınız ve başvurularınız için destek kanalını kullanabilirsiniz.',
  },
  {
    slug: 'explicit-consent',
    title: 'Açık Rıza Metni',
    body: 'Vardiya eşleştirme, konum doğrulama ve size gönderilen bildirimler için KVKK aydınlatma metninde belirtilen kişisel verilerimin, bu metnin gösterilen sürümü kapsamında işlenmesine açık rıza veriyorum. Rızamı daha sonra destek talebiyle geri alabileceğimi biliyorum. Rızamı geri almam, yasal zorunluluklara dayanan işlemleri durdurmaz.',
  },
  {
    slug: 'privacy',
    title: 'Gizlilik Politikası',
    body: 'PartOn, hesabınızı işletmek için gerekli olan kişisel verileri amaçla sınırlı ve ölçülü tutar. Şifreler düz metin olarak saklanmaz. Yasal denetim kayıtları, metin sürümü ve onay zamanını içerir; bu kayıtlar admin panelinden CSV ve PDF olarak alınabilir. Verileriniz, hizmeti sunan alt işlemciler dışında satılmaz.',
  },
  {
    slug: 'terms',
    title: 'Kullanım Koşulları',
    body: 'PartOn hesabı telefon numarası ve şifre ile açılır. İlan, başvuru ve vardiya işlemleri uygulama içindeki kurallara tabidir. Zorunlu yasal metinlerin güncel sürümünü onaylamadan uygulamayı kullanmaya devam edemezsiniz. Metinler sunucuda tutulur ve admin tarafından yeni bir sürüm numarasıyla güncellenebilir.',
  },
] as const;

function nextPolicyVersion(current: string): string {
  const parsed = Number(current);
  if (Number.isInteger(parsed) && parsed > 0 && String(parsed) === current) {
    return String(parsed + 1);
  }
  return '2';
}

function sortPolicies<T extends { slug: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ai = POLICY_ORDER.indexOf(a.slug as (typeof POLICY_ORDER)[number]);
    const bi = POLICY_ORDER.indexOf(b.slug as (typeof POLICY_ORDER)[number]);
    return (ai === -1 ? POLICY_ORDER.length : ai) - (bi === -1 ? POLICY_ORDER.length : bi);
  });
}

@Injectable()
export class PoliciesService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: LegalAuditLogger,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const policy of DEFAULT_POLICIES) {
      const existing = await this.prisma.policyDocument.findUnique({
        where: { slug: policy.slug },
      });
      if (!existing) {
        await this.prisma.policyDocument.create({
          data: {
            slug: policy.slug,
            title: policy.title,
            body: policy.body,
            version: '1',
            required: true,
          },
        });
        continue;
      }
      if (!existing.body) {
        await this.prisma.policyDocument.update({
          where: { id: existing.id },
          data: {
            body: policy.body,
            version: nextPolicyVersion(existing.version),
          },
        });
      }
    }
  }

  async listPublished() {
    const documents = await this.prisma.policyDocument.findMany({
      where: { required: true },
    });
    return { items: sortPolicies(documents).map((document) => this.toDocument(document)) };
  }

  async listPendingPolicies(userId: string) {
    const [documents, acceptances] = await Promise.all([
      this.prisma.policyDocument.findMany({ where: { required: true } }),
      this.prisma.policyAcceptance.findMany({
        where: { userId },
        select: { policyId: true, acceptedVersion: true },
      }),
    ]);
    const accepted = new Map(
      acceptances.map((row) => [row.policyId, row.acceptedVersion]),
    );
    const pending = sortPolicies(documents).filter(
      (document) => accepted.get(document.id) !== document.version,
    );
    return { items: pending.map((document) => this.toDocument(document)) };
  }

  async recordRead(
    userId: string,
    policyId: string,
    version: string,
    actorRole: string | null,
    requestId: string,
  ) {
    const document = await this.requireCurrent(policyId, version);
    await this.prisma.policyRead.upsert({
      where: {
        userId_policyId_version: { userId, policyId, version },
      },
      create: { userId, policyId, version, reachedEnd: true },
      update: { reachedEnd: true, readAt: new Date() },
    });
    await this.audit.append({
      category: 'policy',
      action: 'policy.read',
      actorUserId: userId,
      actorRole,
      resourceType: 'policy_document',
      resourceId: document.id,
      requestId,
      metadata: {
        slug: document.slug,
        version: document.version,
        reachedEnd: true,
      },
    });
    return { readAt: new Date().toISOString(), version: document.version };
  }

  async acceptPolicy(
    userId: string,
    policyId: string,
    version: string,
    actorRole: string | null,
    requestId: string,
  ) {
    const document = await this.requireCurrent(policyId, version);
    const read = await this.prisma.policyRead.findUnique({
      where: { userId_policyId_version: { userId, policyId, version } },
    });
    if (!read?.reachedEnd) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.POLICY_READ_REQUIRED,
        'Bu metnin sonuna kadar okumadan onaylayamazsınız.',
      );
    }
    const now = new Date();
    await this.prisma.policyAcceptance.upsert({
      where: { userId_policyId: { userId, policyId } },
      create: { userId, policyId, acceptedVersion: version, acceptedAt: now },
      update: { acceptedVersion: version, acceptedAt: now },
    });
    await this.audit.append({
      category: 'policy',
      action: 'policy.accept',
      actorUserId: userId,
      actorRole,
      resourceType: 'policy_document',
      resourceId: document.id,
      requestId,
      metadata: { slug: document.slug, version: document.version },
    });
    return { acceptedAt: now.toISOString(), version: document.version };
  }

  async updateDocument(
    actorUserId: string,
    policyId: string,
    input: { title: string; body: string },
    requestId: string,
  ) {
    const document = await this.prisma.policyDocument.findUnique({
      where: { id: policyId },
    });
    if (!document) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Metin bulunamadı.',
      );
    }
    const title = input.title.trim();
    const body = input.body.trim();
    const changed = title !== document.title || body !== document.body;
    const version = changed ? nextPolicyVersion(document.version) : document.version;
    const updated = await this.prisma.policyDocument.update({
      where: { id: policyId },
      data: { title, body, version },
    });
    if (changed) {
      await this.audit.append({
        category: 'admin_action',
        action: 'policy.updated',
        actorUserId,
        actorRole: 'admin',
        resourceType: 'policy_document',
        resourceId: document.id,
        requestId,
        metadata: {
          slug: document.slug,
          previousVersion: document.version,
          version,
        },
      });
    }
    return this.toDocument(updated);
  }

  private async requireCurrent(policyId: string, version: string) {
    const document = await this.prisma.policyDocument.findUnique({
      where: { id: policyId },
    });
    if (!document) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Metin bulunamadı.',
      );
    }
    if (document.version !== version) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.POLICY_VERSION_STALE,
        'Metin güncellendi. Güncel sürümü onaylayın.',
      );
    }
    return document;
  }

  private toDocument(document: {
    id: string;
    slug: string;
    title: string;
    body: string;
    version: string;
    required: boolean;
    contentUrl: string | null;
  }) {
    return {
      id: document.id,
      slug: document.slug,
      title: document.title,
      body: document.body,
      version: document.version,
      required: document.required,
      contentUrl: document.contentUrl ?? undefined,
    };
  }
}
