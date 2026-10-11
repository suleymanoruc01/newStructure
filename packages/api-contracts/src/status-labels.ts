/** One Turkish word for a state. Web and mobile both use this map. */
export const STATUS_LABEL_TR: Record<string, string> = {
  draft: 'Taslak',
  published: 'Yayında',
  closed: 'Kapalı',
  pending: 'Bekliyor',
  accepted: 'Onaylandı',
  rejected: 'Reddedildi',
  withdrawn: 'Geri çekildi',
  cancelled: 'İptal',
  active: 'Aktif',
  restricted: 'Kısıtlı',
  banned: 'Yasaklı',
  inactive: 'Pasif',
  archived: 'Arşiv',
  scheduled: 'Planlandı',
  awaiting_confirm: 'Teyit bekliyor',
  can_come: 'Gelebilir',
  cannot_come: 'Gelemez',
  released: 'Serbest',
  checked_in: 'Giriş yaptı',
  completed: 'Tamamlandı',
  manual_confirmed: 'Manuel onay',
  pending_upload: 'Yükleme bekliyor',
  uploaded: 'Yüklendi',
  verified: 'Doğrulandı',
  bypass: 'Atlandı',
};

export function statusLabelTr(value: string): string {
  return STATUS_LABEL_TR[value] ?? value;
}
