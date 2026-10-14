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
  locale?: 'tr' | 'en';
};

export type RenderedNotification = {
  title: string;
  body: string;
  category: 'applications' | 'shifts' | 'matching' | 'favorites' | 'marketing';
};

export function renderNotification(
  type: string,
  input: NotificationTemplateInput,
): RenderedNotification {
  const isEn = input.locale === 'en';

  if (isEn) {
    switch (type) {
      case 'application.received':
        return {
          category: 'applications',
          title: 'New Application',
          body: `${input.workerDisplayName ?? 'Candidate'} applied for ${input.jobTitle ?? 'Job'}`,
        };
      case 'application.accepted':
        return {
          category: 'applications',
          title: 'Application Accepted',
          body: `${input.jobTitle ?? 'Job'} · ${input.startLocal ?? ''} · ${input.branchName ?? ''}`.trim(),
        };
      case 'application.rejected':
        return {
          category: 'applications',
          title: 'Application Update',
          body: `Your application for ${input.jobTitle ?? 'Job'} has been reviewed.`,
        };
      case 'application.accept_revoked':
        return {
          category: 'applications',
          title: 'Approval Revoked',
          body: `Your approval for ${input.jobTitle ?? 'Job'} has been revoked.`,
        };
      case 'job.closed_with_accepts':
        return {
          category: 'applications',
          title: 'Job Filled',
          body: `${input.jobTitle ?? 'Job'} headcount has been filled.`,
        };
      case 'shift.confirm_3h':
        return {
          category: 'shifts',
          title: 'Can you attend?',
          body: `Confirmation required for ${input.jobTitle ?? 'Shift'} · ${input.startLocal ?? ''}`,
        };
      case 'shift.cannot_come':
        return {
          category: 'shifts',
          title: 'Cannot Attend Notice',
          body: `${input.workerDisplayName ?? 'Worker'} cannot attend ${input.jobTitle ?? 'Shift'}`,
        };
      case 'shift.confirm_timeout':
        return {
          category: 'shifts',
          title: 'Confirmation Timeout',
          body: `No 3-hour confirmation response received for ${input.jobTitle ?? 'Shift'}`,
        };
      case 'shift.checkin_due':
        return {
          category: 'shifts',
          title: 'Check-in Time',
          body: `Please check in to ${input.jobTitle ?? 'Shift'} within 10 minutes`,
        };
      case 'shift.worker_checked_in':
        return {
          category: 'shifts',
          title: 'Worker Checked In',
          body: `${input.workerDisplayName ?? 'Worker'} checked in to ${input.jobTitle ?? 'Shift'}`,
        };
      case 'shift.worker_checked_out':
        return {
          category: 'shifts',
          title: 'Shift Completed',
          body: `${input.workerDisplayName ?? 'Worker'} completed ${input.jobTitle ?? 'Shift'}`,
        };
      case 'shift.substitute_promoted':
        return {
          category: 'shifts',
          title: 'Promoted to Active Seat',
          body: `A seat opened for ${input.jobTitle ?? 'Shift'}. Please confirm your attendance.`,
        };
      case 'shift.no_show':
        return {
          category: 'shifts',
          title: 'Shift No-Show',
          body: `${input.workerDisplayName ?? 'Worker'} did not check in on time for ${input.jobTitle ?? 'Shift'}`,
        };
      case 'shift.manual_confirmed':
        return {
          category: 'shifts',
          title: 'Manual Check-in Confirmed',
          body: `${input.jobTitle ?? 'Shift'} check-in confirmed manually`,
        };
      case 'shift.dispute_update':
        return {
          category: 'shifts',
          title: 'Check-in Dispute Update',
          body: `Dispute updated for ${input.jobTitle ?? 'Shift'}`,
        };
      case 'rating.pending':
        return {
          category: 'applications',
          title: 'Review Required',
          body: `Please rate your experience for ${input.jobTitle ?? 'Shift'}`,
        };
      case 'job.audience_empty':
        return {
          category: 'applications',
          title: 'No Matching Favorites',
          body: 'No eligible favorite candidates found to notify for this listing.',
        };
      case 'job.matched':
        return {
          category: 'matching',
          title: 'New Opportunity Match',
          body: `${input.jobTitle ?? 'Job'} · ${input.branchName ?? ''} · ${input.startLocal ?? ''}`.trim(),
        };
      case 'job.favorite_employer':
        return {
          category: 'favorites',
          title: 'Listing from Favorite Employer',
          body: `${input.employerName ?? 'Employer'}: ${input.jobTitle ?? 'Job'}`,
        };
      case 'job.favorites_only':
        return {
          category: 'favorites',
          title: 'Exclusive Shift Invitation',
          body: `${input.employerName ?? 'Employer'} invites you to an exclusive shift`,
        };
      case 'admin.broadcast':
        return {
          category: 'marketing',
          title: input.jobTitle ?? 'PartOn',
          body: input.branchName ?? 'New announcement',
        };
      default:
        templateLogger.warn(`Unknown notification type: ${type}`);
        return {
          category: 'applications',
          title: 'PartOn',
          body: 'You have a new notification.',
        };
    }
  }

  // Default Turkish locale
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
    case 'shift.worker_checked_out':
      return {
        category: 'shifts',
        title: 'Vardiya tamamlandı',
        body: `${input.workerDisplayName ?? 'İşçi'} · ${input.jobTitle ?? 'Vardiya'} tamamlandı`,
      };
    case 'shift.substitute_promoted':
      return {
        category: 'shifts',
        title: 'Yedek kontenjan açıldı',
        body: `${input.jobTitle ?? 'Vardiya'} için kontenjana alındınız. Lütfen katılım teyidi verin`,
      };
    case 'shift.no_show':
      return {
        category: 'shifts',
        title: 'Vardiyaya gelinmedi',
        body: `${input.workerDisplayName ?? 'İşçi'} · ${input.jobTitle ?? 'Vardiya'} için zamanında check-in yapmadı`,
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
