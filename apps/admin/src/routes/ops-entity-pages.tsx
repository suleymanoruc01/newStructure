import { JsonDataTable } from "@/components/json-data-table";
import { Button } from "@/components/ui/button";
import { asRows, str, bool, Section } from "@/components/field-grid";
import { fetchAdminResource } from "@/lib/admin-api";
import { isApiClientError } from "@/lib/api-client";
import { OpsDetailPage } from "@/routes/admin-detail-route";
import {
  AbuseResolveControl,
  ApplicationStatusControl,
  DisputeResolveControl,
  DocumentStatusControl,
  EmployerControls,
  EmployerProfileControl,
  EmployerSubscriptionControl,
  ManagerPermissionsControl,
  TokenRequestQueue,
  WorkplaceTokenAllocateControl,
  JobFavoritesOnlyControl,
  JobForceCloseControl,
  RatingModerationControl,
  ShiftManualConfirmControl,
  UserSessionsRevokeControl,
  UserStatusControl,
  WorkerNightShiftControl,
} from "@/routes/admin-controls";

export function UserDetailPage() {
  return (
    <OpsDetailPage
      title="Kullanıcı detayı"
      screenId="w.admin.users.detail"
      buildPath={(id) => `/admin/users/${id}`}
      controls={(data, reload) =>
        typeof data.id === "string" ? (
          <>
            <UserStatusControl
              userId={data.id}
              status={str(data, "status") || "active"}
              onDone={reload}
            />
            <UserSessionsRevokeControl userId={data.id} onDone={reload} />
          </>
        ) : null
      }
      fields={(data) => [
        { label: "Kimlik", value: data.id },
        { label: "Telefon", value: data.phoneE164 },
        { label: "Durum", value: data.status },
        { label: "Dil", value: data.locale },
        { label: "Oluşturma", value: data.createdAt },
        {
          label: "İş arayan profili",
          value: data.workerProfileId ?? "—",
          href: typeof data.workerProfileId === "string" ? `/workers/${data.workerProfileId}` : undefined,
        },
        { label: "Platform yöneticisi", value: data.isPlatformAdmin },
      ]}
      extras={(data) => (
        <>
          <Section title="İşveren üyelikleri">
            <p className="text-sm text-foreground">
              {asRows(data.employerIds).length === 0
                ? "Yok"
                : asRows(data.employerIds).map((id) => String(id)).join(", ")}
            </p>
          </Section>
          <Section title="Politika kabulleri">
            <JsonDataTable rows={asRows(data.policyAcceptances)} />
          </Section>
        </>
      )}
    />
  );
}

export function WorkerDetailPage() {
  return (
    <OpsDetailPage
      title="İş arayan detayı"
      screenId="w.admin.workers.detail"
      buildPath={(id) => `/admin/workers/${id}`}
      controls={(data, reload) =>
        typeof data.id === "string" ? (
          <WorkerNightShiftControl
            workerId={data.id}
            nightShiftAvailable={bool(data, "nightShiftAvailable")}
            onDone={reload}
          />
        ) : null
      }
      fields={(data) => [
        { label: "Kimlik", value: data.id },
        {
          label: "Kullanıcı",
          value: data.userId,
          href: typeof data.userId === "string" ? `/users/${data.userId}` : undefined,
        },
        { label: "Ad", value: data.firstName },
        { label: "Soyad", value: data.lastName },
        { label: "Telefon", value: data.phoneE164 },
        { label: "Hesap durumu", value: data.userStatus },
        { label: "Gece vardiyası", value: data.nightShiftAvailable },
        { label: "Cinsiyet", value: data.gender },
        { label: "Doğum tarihi", value: data.birthDate },
        { label: "Enlem", value: data.homeLatitude },
        { label: "Boylam", value: data.homeLongitude },
        { label: "Sektörler", value: data.sectors },
        { label: "Meslekler", value: data.occupations },
      ]}
      extras={(data) => (
        <>
          <Section title="Uygunluk pencereleri">
            <JsonDataTable rows={asRows(data.availability)} />
          </Section>
          <Section title="Belgeler">
            <JsonDataTable rows={asRows(data.documents)} linkBase="/documents" />
          </Section>
          <Section title="Favoriler">
            <JsonDataTable rows={asRows(data.favorites)} />
          </Section>
        </>
      )}
    />
  );
}

export function EmployerDetailPage() {
  return (
    <OpsDetailPage
      title="İşveren detayı"
      screenId="w.admin.employers.detail"
      buildPath={(id) => `/admin/employers/${id}`}
      controls={(data, reload) =>
        typeof data.id === "string" ? (
          <>
            <EmployerProfileControl
              employerId={data.id}
              legalName={str(data, "legalName")}
              tradingName={str(data, "tradingName") || null}
              addressLine1={str(data, "addressLine1") || null}
              city={str(data, "city") || null}
              latitude={
                typeof data.latitude === "number" ? data.latitude : null
              }
              longitude={
                typeof data.longitude === "number" ? data.longitude : null
              }
              onDone={reload}
            />
            <WorkplaceTokenAllocateControl
              employerId={data.id}
              onDone={reload}
            />
            <EmployerControls
              employerId={data.id}
              verificationStatus={str(data, "verificationStatus") || "pending"}
              onDone={reload}
            />
            <EmployerSubscriptionControl
              employerId={data.id}
              planCode={str(data, "subscriptionPlanCode") || "free"}
              status={str(data, "subscriptionStatus") || "active"}
              onDone={reload}
            />
          </>
        ) : null
      }
      fields={(data) => [
        { label: "Kimlik", value: data.id },
        { label: "Unvan", value: data.legalName },
        { label: "Marka adı", value: data.tradingName },
        { label: "Vergi no", value: data.taxId },
        { label: "Doğrulama", value: data.verificationStatus },
        { label: "Abonelik planı", value: data.subscriptionPlanCode },
        { label: "Abonelik durumu", value: data.subscriptionStatus },
        { label: "Abonelik bitiş", value: data.subscriptionEndsAt },
        { label: "Adres", value: data.addressLine1 },
        { label: "İl", value: data.city },
        { label: "Enlem", value: data.latitude },
        { label: "Boylam", value: data.longitude },
        { label: "Dağıtılmamış jeton", value: data.unallocated },
        { label: "Jeton bakiyesi", value: data.tokenBalance },
        { label: "Bloke jeton", value: data.heldTokens },
        { label: "Oluşturma", value: data.createdAt },
      ]}
      extras={(data, reload) => (
        <>
          <Section title="Şubeler">
            <JsonDataTable rows={asRows(data.branches)} linkBase="/branches" />
          </Section>
          <Section title="Üyeler">
            <JsonDataTable rows={asRows(data.members)} idKey="userId" linkBase="/users" />
          </Section>
          <Section title="İşyeri yöneticileri">
            <ManagerPermissionsControl
              employerId={typeof data.id === "string" ? data.id : ""}
              rows={asRows(data.workplaceManagers)}
              onDone={reload}
            />
          </Section>
          <Section title="Jeton talepleri">
            <TokenRequestQueue
              employerId={typeof data.id === "string" ? data.id : ""}
              rows={asRows(data.tokenRequests)}
              onDone={reload}
            />
          </Section>
          <Section title="Jeton blokesi">
            <JsonDataTable rows={asRows(data.holds)} />
          </Section>
          <Section title="Favoriler">
            <JsonDataTable rows={asRows(data.favorites)} />
          </Section>
        </>
      )}
    />
  );
}

export function JobDetailPage() {
  return (
    <OpsDetailPage
      title="İlan detayı"
      screenId="w.admin.jobs.detail"
      buildPath={(id) => `/admin/jobs/${id}`}
      controls={(data, reload) =>
        typeof data.id === "string" ? (
          <>
            <JobFavoritesOnlyControl
              jobId={data.id}
              favoritesOnly={bool(data, "favoritesOnly")}
              onDone={reload}
            />
            <JobForceCloseControl jobId={data.id} onDone={reload} />
          </>
        ) : null
      }
      fields={(data) => [
        { label: "Kimlik", value: data.id },
        { label: "Başlık", value: data.title },
        { label: "Durum", value: data.status },
        { label: "Yalnızca favoriler", value: data.favoritesOnly },
        { label: "Kontenjan", value: data.headcount },
        { label: "Kalan kontenjan", value: data.remainingHeadcount },
        { label: "Başlangıç", value: data.startsAt },
        { label: "Bitiş", value: data.endsAt },
        { label: "Sektör", value: data.sectorCode },
        { label: "Meslek", value: data.occupationCode },
        {
          label: "İşveren",
          value: data.employerName,
          href: typeof data.employerId === "string" ? `/employers/${data.employerId}` : undefined,
        },
        {
          label: "Şube",
          value: data.branchName,
          href: typeof data.branchId === "string" ? `/branches/${data.branchId}` : undefined,
        },
        { label: "Zorunlu belgeler", value: data.requiredDocumentTypes },
        { label: "Olanaklar", value: data.amenities },
        { label: "Anında kabul", value: data.instantAutoApprove },
        { label: "Cinsiyet filtresi", value: data.genderFilter },
        { label: "Min yaş", value: data.minAge },
        { label: "Max yaş", value: data.maxAge },
        { label: "Ücret (kuruş)", value: data.payAmountMinor },
        { label: "Para birimi", value: data.payCurrency },
        { label: "Blokeli jeton", value: data.holdAmount },
        { label: "Bloke durumu", value: data.holdStatus },
      ]}
      extras={(data) => (
        <Section title="Başvurular">
          <JsonDataTable rows={asRows(data.applications)} linkBase="/applications" />
        </Section>
      )}
    />
  );
}

export function ApplicationDetailPage() {
  return (
    <OpsDetailPage
      title="Başvuru detayı"
      screenId="w.admin.applications.detail"
      buildPath={(id) => `/admin/applications/${id}`}
      controls={(data, reload) =>
        typeof data.id === "string" ? (
          <ApplicationStatusControl
            applicationId={data.id}
            status={str(data, "status") || "pending"}
            onDone={reload}
          />
        ) : null
      }
      fields={(data) => [
        { label: "Kimlik", value: data.id },
        { label: "Durum", value: data.status },
        {
          label: "İlan",
          value: data.jobTitle ?? data.jobId,
          href: typeof data.jobId === "string" ? `/jobs/${data.jobId}` : undefined,
        },
        { label: "İlan durumu", value: data.jobStatus },
        {
          label: "İşveren",
          value: data.employerId,
          href: typeof data.employerId === "string" ? `/employers/${data.employerId}` : undefined,
        },
        {
          label: "İş arayan",
          value: data.workerPhone,
          href: typeof data.workerUserId === "string" ? `/users/${data.workerUserId}` : undefined,
        },
        {
          label: "Profil",
          value: data.workerProfileId,
          href:
            typeof data.workerProfileId === "string"
              ? `/workers/${data.workerProfileId}`
              : undefined,
        },
        { label: "Oluşturma", value: data.createdAt },
        { label: "Güncelleme", value: data.updatedAt },
      ]}
      extras={(data) => (
        <Section title="Olaylar">
          <JsonDataTable rows={asRows(data.events)} />
        </Section>
      )}
    />
  );
}

export function ShiftDetailPage() {
  return (
    <OpsDetailPage
      title="Vardiya detayı"
      screenId="w.admin.shifts.detail"
      buildPath={(id) => `/admin/shifts/${id}`}
      controls={(data, reload) =>
        typeof data.id === "string" ? (
          <ShiftManualConfirmControl
            shiftId={data.id}
            checkedIn={typeof data.checkedInAt === "string" && data.checkedInAt.length > 0}
            onDone={reload}
          />
        ) : null
      }
      fields={(data) => [
        { label: "Kimlik", value: data.id },
        { label: "Durum", value: data.status },
        {
          label: "İlan",
          value: data.jobTitle ?? data.jobId,
          href: typeof data.jobId === "string" ? `/jobs/${data.jobId}` : undefined,
        },
        {
          label: "İşveren",
          value: data.employerId,
          href: typeof data.employerId === "string" ? `/employers/${data.employerId}` : undefined,
        },
        {
          label: "Şube",
          value: data.branchId,
          href: typeof data.branchId === "string" ? `/branches/${data.branchId}` : undefined,
        },
        {
          label: "Başvuru",
          value: data.applicationId,
          href: typeof data.applicationId === "string" ? `/applications/${data.applicationId}` : undefined,
        },
        {
          label: "İş arayan",
          value: data.workerPhone,
          href: typeof data.workerUserId === "string" ? `/users/${data.workerUserId}` : undefined,
        },
        { label: "Başlangıç", value: data.startsAt },
        { label: "Bitiş", value: data.endsAt },
        { label: "3s pencere açılış", value: data.confirmOpensAt },
        { label: "3s son tarih", value: data.confirmDeadlineAt },
        { label: "3s kararı", value: data.availabilityDecision },
        { label: "Yoklama", value: data.checkedInAt },
        { label: "Tamamlanma", value: data.completedAt },
      ]}
      extras={(data) => (
        <>
          <Section title="Check-in kayıtları">
            <JsonDataTable rows={asRows(data.checkIns)} />
          </Section>
          <Section title="Uyuşmazlıklar">
            <JsonDataTable rows={asRows(data.disputes)} linkBase="/disputes" />
          </Section>
        </>
      )}
    />
  );
}

export function DisputeDetailPage() {
  return (
    <OpsDetailPage
      title="Uyuşmazlık detayı"
      screenId="w.admin.disputes.queue"
      buildPath={(id) => `/admin/disputes/${id}`}
      controls={(data, reload) =>
        typeof data.id === "string" ? (
          <>
            <DisputeResolveControl
              disputeId={data.id}
              status={str(data, "status") || "open"}
              onDone={reload}
            />
            {typeof data.shiftId === "string" ? (
              <ShiftManualConfirmControl
                shiftId={data.shiftId}
                checkedIn={typeof data.checkedInAt === "string" && data.checkedInAt.length > 0}
                onDone={reload}
              />
            ) : null}
          </>
        ) : null
      }
      fields={(data) => [
        { label: "Kimlik", value: data.id },
        { label: "Durum", value: data.status },
        {
          label: "Vardiya",
          value: data.shiftId,
          href: typeof data.shiftId === "string" ? `/shifts/${data.shiftId}` : undefined,
        },
        { label: "Vardiya durumu", value: data.shiftStatus },
        {
          label: "İlan",
          value: data.jobId,
          href: typeof data.jobId === "string" ? `/jobs/${data.jobId}` : undefined,
        },
        {
          label: "İş arayan",
          value: data.workerUserId,
          href: typeof data.workerUserId === "string" ? `/users/${data.workerUserId}` : undefined,
        },
        { label: "Not", value: data.note },
        { label: "Yoklama", value: data.checkedInAt },
        { label: "Oluşturma", value: data.createdAt },
        { label: "Çözülme", value: data.resolvedAt },
      ]}
    />
  );
}

export function DocumentDetailPage() {
  return (
    <OpsDetailPage
      title="Belge detayı"
      screenId="w.admin.documents.queue"
      buildPath={(id) => `/admin/documents/${id}`}
      controls={(data, reload) =>
        typeof data.id === "string" ? (
          <DocumentStatusControl
            documentId={data.id}
            status={str(data, "status") || "uploaded"}
            onDone={reload}
          />
        ) : null
      }
      fields={(data) => [
        { label: "Kimlik", value: data.id },
        { label: "Tür", value: data.documentType },
        { label: "Durum", value: data.status },
        { label: "MIME", value: data.contentType },
        { label: "Boyut (byte)", value: data.sizeBytes },
        { label: "Dosya", value: data.fileName },
        { label: "İş arayan", value: data.workerName },
        {
          label: "Profil",
          value: data.workerProfileId,
          href:
            typeof data.workerProfileId === "string"
              ? `/workers/${data.workerProfileId}`
              : undefined,
        },
        { label: "Yükleme", value: data.uploadedAt },
      ]}
      extras={(data) =>
        str(data, "status") === "uploaded" && typeof data.id === "string" ? (
          <Section title="İnceleme">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void fetchAdminResource(`/admin/documents/${data.id}/download`)
                  .then((payload) => {
                    if (
                      payload &&
                      typeof payload === "object" &&
                      "downloadUrl" in payload &&
                      typeof (payload as { downloadUrl: unknown }).downloadUrl === "string"
                    ) {
                      window.open((payload as { downloadUrl: string }).downloadUrl, "_blank");
                    }
                  })
                  .catch((err) => {
                    window.alert(isApiClientError(err) ? err.message : "İndirme alınamadı.");
                  });
              }}
            >
              Belgeyi aç
            </Button>
          </Section>
        ) : null
      }
    />
  );
}

export function RatingDetailPage() {
  return (
    <OpsDetailPage
      title="Puan detayı"
      screenId="w.admin.ratings.detail"
      buildPath={(id) => `/admin/ratings/${id}`}
      controls={(data, reload) =>
        typeof data.id === "string" ? (
          <RatingModerationControl
            ratingId={data.id}
            moderationStatus={str(data, "moderationStatus") || "visible"}
            onDone={reload}
          />
        ) : null
      }
      fields={(data) => [
        { label: "Kimlik", value: data.id },
        { label: "Puan", value: data.score },
        { label: "Yorum", value: data.comment },
        { label: "Moderasyon", value: data.moderationStatus },
        { label: "Yazan rol", value: data.authorRole },
        {
          label: "Yazan",
          value: data.authorUserId,
          href: typeof data.authorUserId === "string" ? `/users/${data.authorUserId}` : undefined,
        },
        {
          label: "Vardiya",
          value: data.shiftId,
          href: typeof data.shiftId === "string" ? `/shifts/${data.shiftId}` : undefined,
        },
        {
          label: "Hedef iş arayan",
          value: data.targetWorkerUserId,
          href:
            typeof data.targetWorkerUserId === "string"
              ? `/users/${data.targetWorkerUserId}`
              : undefined,
        },
        {
          label: "Hedef işveren",
          value: data.targetEmployerId,
          href:
            typeof data.targetEmployerId === "string"
              ? `/employers/${data.targetEmployerId}`
              : undefined,
        },
        { label: "Oluşturma", value: data.createdAt },
      ]}
    />
  );
}

export function AbuseDetailPage() {
  return (
    <OpsDetailPage
      title="Kötüye kullanım detayı"
      screenId="w.admin.abuse.detail"
      buildPath={(id) => `/admin/abuse-reports/${id}`}
      controls={(data, reload) =>
        typeof data.id === "string" ? (
          <AbuseResolveControl
            reportId={data.id}
            status={str(data, "status") || "open"}
            onDone={reload}
          />
        ) : null
      }
      fields={(data) => [
        { label: "Kimlik", value: data.id },
        { label: "Kategori", value: data.category },
        { label: "Not", value: data.note },
        { label: "Durum", value: data.status },
        {
          label: "Bildiren",
          value: data.reporterUserId,
          href: typeof data.reporterUserId === "string" ? `/users/${data.reporterUserId}` : undefined,
        },
        {
          label: "Hedef",
          value: data.targetUserId,
          href: typeof data.targetUserId === "string" ? `/users/${data.targetUserId}` : undefined,
        },
        { label: "Oluşturma", value: data.createdAt },
        { label: "Çözülme", value: data.resolvedAt },
      ]}
    />
  );
}
