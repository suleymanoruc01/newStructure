export type AdminNavItem = {
  path: string;
  label: string;
  screenId: string;
};

export const adminNavSections: { title: string; items: AdminNavItem[] }[] = [
  {
    title: "Genel",
    items: [
      { path: "/", label: "Kontrol paneli", screenId: "w.admin.dashboard" },
      { path: "/ops/perf", label: "Performans", screenId: "w.admin.perf.metrics" },
    ],
  },
  {
    title: "Abonelik ve destek",
    items: [
      { path: "/subscriptions", label: "Abonelik planları", screenId: "w.admin.subscriptions.plans" },
      { path: "/support", label: "Destek talepleri", screenId: "w.admin.support.list" },
    ],
  },
  {
    title: "Kimlik ve uyum",
    items: [
      { path: "/users", label: "Kullanıcılar", screenId: "w.admin.users.list" },
      { path: "/verification", label: "Doğrulama kuyruğu", screenId: "w.admin.verification.queue" },
      { path: "/policies", label: "Politikalar", screenId: "w.admin.policies.manage" },
      { path: "/audit", label: "Denetim günlüğü", screenId: "w.admin.audit.log" },
      { path: "/audit/reports", label: "Denetim raporları", screenId: "w.admin.audit.reports" },
    ],
  },
  {
    title: "Taraflar",
    items: [
      { path: "/workers", label: "İş arayanlar", screenId: "w.admin.workers.list" },
      { path: "/employers", label: "İşverenler", screenId: "w.admin.employers.list" },
      { path: "/branches", label: "Şubeler", screenId: "w.admin.branches.list" },
      { path: "/documents", label: "Belge kuyruğu", screenId: "w.admin.documents.queue" },
    ],
  },
  {
    title: "İlan ve eşleşme",
    items: [
      { path: "/jobs", label: "İlanlar", screenId: "w.admin.jobs.list" },
      { path: "/catalog", label: "Katalog", screenId: "w.admin.catalog.manage" },
      { path: "/applications", label: "Başvurular", screenId: "w.admin.applications.list" },
      { path: "/matching/diagnostics", label: "Eşleşme teşhisi", screenId: "w.admin.matching.diagnostics" },
    ],
  },
  {
    title: "Vardiya ve jeton",
    items: [
      { path: "/shifts", label: "Vardiyalar", screenId: "w.admin.shifts.list" },
      { path: "/disputes", label: "Uyuşmazlıklar", screenId: "w.admin.disputes.queue" },
      { path: "/tokens/ledger", label: "Jeton defteri", screenId: "w.admin.tokens.ledger" },
      { path: "/tokens/packages", label: "Jeton paketleri", screenId: "w.admin.tokens.packages" },
      { path: "/config/adapty", label: "Adapty ödemeler", screenId: "w.admin.config.adapty" },
      { path: "/ratings", label: "Puan moderasyonu", screenId: "w.admin.ratings.queue" },
    ],
  },
  {
    title: "Bildirim ve risk",
    items: [
      { path: "/notifications/outbox", label: "Outbox", screenId: "w.admin.notifications.outbox" },
      { path: "/notifications/broadcast", label: "Yayın", screenId: "w.admin.notifications.broadcast" },
      { path: "/abuse", label: "Kötüye kullanım", screenId: "w.admin.abuse.list" },
      { path: "/risk", label: "Risk olayları", screenId: "w.admin.risk.queue" },
      { path: "/config", label: "Uzak yapılandırma", screenId: "w.admin.config.remote" },
      { path: "/config/sms", label: "Verimor SMS", screenId: "w.admin.config.sms" },
    ],
  },
  {
    title: "DevOps",
    items: [
      { path: "/devops", label: "DevOps özet", screenId: "w.admin.devops.overview" },
      { path: "/devops/errors", label: "Hatalar", screenId: "w.admin.devops.errors.list" },
      { path: "/devops/releases", label: "Sürümler", screenId: "w.admin.devops.releases" },
      { path: "/devops/services", label: "Servisler", screenId: "w.admin.devops.services" },
      { path: "/devops/clients", label: "İstemciler", screenId: "w.admin.devops.clients" },
    ],
  },
];
