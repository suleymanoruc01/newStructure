import { Logger } from '@nestjs/common';

const templateLogger = new Logger('NotificationTemplates');

export type NotificationTemplateInput = {
  workerDisplayName?: string;
  jobTitle?: string;
  branchName?: string;
  startLocal?: string;
  applicationId?: string;
  jobId?: string;
  employerName?: string;
};

export function renderNotification(
  type: string,
  input: NotificationTemplateInput,
): { title: string; body: string; category: 'applications' | 'shifts' | 'matching' | 'favorites' | 'marketing' } {
  switch (type) {
    case 'application.received':
      return {
        category: 'applications',
        title: 'Yeni başvuru',
        body: `${input.workerDisplayName ?? 'İş arayan'} · ${input.jobTitle ?? 'İlan'} için başvurdu`,
      };
    case 'application.accepted':
      return {
        category: 'applications',
        title: 'Başvurun onaylandı',
        body: `${input.jobTitle ?? 'İlan'} · ${input.startLocal ?? ''} · ${input.branchName ?? ''}`.trim(),
      };
    case 'application.rejected':
      return {
        category: 'applications',
        title: 'Başvuru sonucu',
        body: `${input.jobTitle ?? 'İlan'} başvurunuz değerlendirildi.`,
      };
    case 'application.accept_revoked':
      return {
        category: 'applications',
        title: 'Onay iptal edildi',
        body: `${input.jobTitle ?? 'İlan'} için onayınız iptal edildi.`,
      };
    case 'job.closed_with_accepts':
      return {
        category: 'applications',
        title: 'İlan kapandı',
        body: `${input.jobTitle ?? 'İlan'} kontenjan dolduğu için kapatıldı.`,
      };
    case 'shift.confirm_3h':
      return {
        category: 'shifts',
        title: 'Gelebilir misiniz?',
        body: `${input.jobTitle ?? 'Vardiya'} · ${input.startLocal ?? ''} için teyit gerekli`,
      };
    case 'shift.cannot_come':
      return {
        category: 'shifts',
        title: 'Gelemiyor bildirimi',
        body: `${input.workerDisplayName ?? 'İşçi'} · ${input.jobTitle ?? 'Vardiya'} için gelemiyor`,
      };
    case 'shift.confirm_timeout':
      return {
        category: 'shifts',
        title: 'Teyit yanıtı yok',
        body: `${input.jobTitle ?? 'Vardiya'} için 3 saat teyidine yanıt verilmedi`,
      };
    case 'shift.checkin_due':
      return {
        category: 'shifts',
        title: 'Check-in zamanı',
        body: `${input.jobTitle ?? 'Vardiya'} · 10 dakika içinde işe geldim teyidi`,
      };
    case 'shift.worker_checked_in':
      return {
        category: 'shifts',
        title: 'İşçi check-in yaptı',
        body: `${input.workerDisplayName ?? 'İşçi'} · ${input.jobTitle ?? 'Vardiya'} alanına giriş`,
      };
    case 'shift.manual_confirmed':
      return {
        category: 'shifts',
        title: 'Manuel onay',
        body: `${input.jobTitle ?? 'Vardiya'} check-in manuel onaylandı`,
      };
    case 'shift.dispute_update':
      return {
        category: 'shifts',
        title: 'Check-in itirazı',
        body: `${input.jobTitle ?? 'Vardiya'} için itiraz güncellendi`,
      };
    case 'rating.pending':
      return {
        category: 'applications',
        title: 'Değerlendirme zamanı',
        body: `${input.jobTitle ?? 'Vardiya'} için deneyiminizi paylaşın`,
      };
    case 'job.audience_empty':
      return {
        category: 'applications',
        title: 'Favori aday yok',
        body: 'Bu ilan için bildirilecek favori çalışan bulunamadı',
      };
    case 'job.matched':
      return {
        category: 'matching',
        title: 'Yeni iş fırsatı',
        body: `${input.jobTitle ?? 'İlan'} · ${input.branchName ?? ''} · ${input.startLocal ?? ''}`.trim(),
      };
    case 'job.favorite_employer':
      return {
        category: 'favorites',
        title: 'Favori işverenden ilan',
        body: `${input.employerName ?? 'İşveren'}: ${input.jobTitle ?? 'İlan'}`,
      };
    case 'job.favorites_only':
      return {
        category: 'favorites',
        title: 'Sana özel ilan',
        body: `${input.employerName ?? 'İşveren'} seni favorilerine özel davet ediyor`,
      };
    case 'admin.broadcast':
      return {
        category: 'marketing',
        title: input.jobTitle ?? 'PartOn',
        body: input.branchName ?? 'Yeni duyuru',
      };
    default:
      templateLogger.warn(`Unknown notification type: ${type}`);
      return {
        category: 'applications',
        title: 'PartOn',
        body: 'Yeni bir bildiriminiz var.',
      };
  }
}
