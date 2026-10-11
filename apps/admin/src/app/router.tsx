import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "@/components/admin-layout";
import { useAuth } from "@/features/auth/auth-context";
import {
  AbuseResolveControl,
  EmployerControls,
  JobForceCloseControl,
  RatingModerationControl,
  UserStatusControl,
} from "@/routes/admin-controls";
import { AdminDetailRoute } from "@/routes/admin-detail-route";
import { AdminListRoute } from "@/routes/admin-list-route";
import { DashboardPage } from "@/routes/dashboard-page";
import { DevopsErrorsListPage } from "@/routes/devops-errors-list-page";
import { LoginPage } from "@/routes/login-page";
import {
  AuditReportsPage,
  BroadcastPage,
  DevopsClientsPage,
  DevopsErrorDetailPage,
  DevopsOverviewPage,
  DevopsServicesPage,
  MatchingDiagnosticsPage,
  PerfMetricsPage,
  RemoteConfigPage,
} from "@/routes/ops-special-pages";
import { PoliciesManagePage } from "@/routes/policies-manage-page";
import { ProtectedRoute } from "@/routes/protected-route";

function LoginRoute() {
  const { state } = useAuth();
  if (state.status === "authenticated") {
    return <Navigate to="/" replace />;
  }
  return <LoginPage />;
}

function ProtectedAdminShell() {
  return (
    <ProtectedRoute>
      <AdminLayout />
    </ProtectedRoute>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter basename="/admin">
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route element={<ProtectedAdminShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="ops/perf" element={<PerfMetricsPage />} />
          <Route
            path="users"
            element={
              <AdminListRoute
                title="Kullanıcılar"
                screenId="w.admin.users.list"
                apiPath="/admin/users"
                linkBase="/users"
                searchable
              />
            }
          />
          <Route
            path="users/:id"
            element={
              <AdminDetailRoute
                title="Kullanıcı detayı"
                screenId="w.admin.users.detail"
                buildPath={(id) => `/admin/users/${id}`}
                controls={(data, reload) =>
                  typeof data.id === "string" ? (
                    <UserStatusControl
                      userId={data.id}
                      status={typeof data.status === "string" ? data.status : "active"}
                      onDone={reload}
                    />
                  ) : null
                }
              />
            }
          />
          <Route
            path="workers"
            element={
              <AdminListRoute
                title="İş arayanlar"
                screenId="w.admin.workers.list"
                apiPath="/admin/workers"
                linkBase="/workers"
              />
            }
          />
          <Route
            path="workers/:id"
            element={
              <AdminDetailRoute
                title="İş arayan detayı"
                screenId="w.admin.workers.detail"
                buildPath={(id) => `/admin/workers/${id}`}
              />
            }
          />
          <Route
            path="employers"
            element={
              <AdminListRoute
                title="İşverenler"
                screenId="w.admin.employers.list"
                apiPath="/admin/employers"
                linkBase="/employers"
              />
            }
          />
          <Route
            path="employers/:id"
            element={
              <AdminDetailRoute
                title="İşveren detayı"
                screenId="w.admin.employers.detail"
                buildPath={(id) => `/admin/employers/${id}`}
                controls={(data, reload) => {
                  const employer = data.employer;
                  if (!employer || typeof employer !== "object") {
                    return null;
                  }
                  const record = employer as Record<string, unknown>;
                  if (typeof record.id !== "string") {
                    return null;
                  }
                  return (
                    <EmployerControls
                      employerId={record.id}
                      verificationStatus={
                        typeof record.verificationStatus === "string"
                          ? record.verificationStatus
                          : "pending"
                      }
                      onDone={reload}
                    />
                  );
                }}
              />
            }
          />
          <Route
            path="branches"
            element={
              <AdminListRoute
                title="Şubeler"
                screenId="w.admin.branches.list"
                apiPath="/admin/branches"
              />
            }
          />
          <Route
            path="verification"
            element={
              <AdminListRoute
                title="Doğrulama kuyruğu"
                screenId="w.admin.verification.queue"
                apiPath="/admin/verification/queue"
                linkBase="/employers"
              />
            }
          />
          <Route
            path="jobs"
            element={
              <AdminListRoute
                title="İlanlar"
                screenId="w.admin.jobs.list"
                apiPath="/admin/jobs"
                linkBase="/jobs"
              />
            }
          />
          <Route
            path="jobs/:id"
            element={
              <AdminDetailRoute
                title="İlan detayı"
                screenId="w.admin.jobs.detail"
                buildPath={(id) => `/admin/jobs/${id}`}
                controls={(data, reload) =>
                  typeof data.id === "string" ? (
                    <JobForceCloseControl jobId={data.id} onDone={reload} />
                  ) : null
                }
              />
            }
          />
          <Route
            path="catalog"
            element={
              <AdminListRoute
                title="Katalog"
                screenId="w.admin.catalog.manage"
                apiPath="/admin/catalog"
              />
            }
          />
          <Route
            path="applications"
            element={
              <AdminListRoute
                title="Başvurular"
                screenId="w.admin.applications.list"
                apiPath="/admin/applications"
                linkBase="/applications"
              />
            }
          />
          <Route
            path="applications/:id"
            element={
              <AdminDetailRoute
                title="Başvuru detayı"
                screenId="w.admin.applications.detail"
                buildPath={(id) => `/admin/applications/${id}`}
              />
            }
          />
          <Route path="matching/diagnostics" element={<MatchingDiagnosticsPage />} />
          <Route
            path="shifts"
            element={
              <AdminListRoute
                title="Vardiyalar"
                screenId="w.admin.shifts.list"
                apiPath="/admin/shifts"
                linkBase="/shifts"
              />
            }
          />
          <Route
            path="shifts/:id"
            element={
              <AdminDetailRoute
                title="Vardiya detayı"
                screenId="w.admin.shifts.detail"
                buildPath={(id) => `/admin/shifts/${id}`}
              />
            }
          />
          <Route
            path="disputes"
            element={
              <AdminListRoute
                title="Uyuşmazlıklar"
                screenId="w.admin.disputes.queue"
                apiPath="/admin/disputes"
              />
            }
          />
          <Route
            path="tokens/ledger"
            element={
              <AdminListRoute
                title="Jeton defteri"
                screenId="w.admin.tokens.ledger"
                apiPath="/admin/tokens/ledger"
              />
            }
          />
          <Route
            path="ratings"
            element={
              <AdminListRoute
                title="Puan moderasyonu"
                screenId="w.admin.ratings.queue"
                apiPath="/admin/ratings/queue"
                linkBase="/ratings"
              />
            }
          />
          <Route
            path="ratings/:id"
            element={
              <AdminDetailRoute
                title="Puan detayı"
                screenId="w.admin.ratings.detail"
                buildPath={(id) => `/admin/ratings/${id}`}
                controls={(data, reload) =>
                  typeof data.id === "string" ? (
                    <RatingModerationControl
                      ratingId={data.id}
                      moderationStatus={
                        typeof data.moderationStatus === "string"
                          ? data.moderationStatus
                          : "visible"
                      }
                      onDone={reload}
                    />
                  ) : null
                }
              />
            }
          />
          <Route
            path="notifications/outbox"
            element={
              <AdminListRoute
                title="Bildirim outbox"
                screenId="w.admin.notifications.outbox"
                apiPath="/admin/notifications/outbox"
              />
            }
          />
          <Route path="notifications/broadcast" element={<BroadcastPage />} />
          <Route
            path="documents"
            element={
              <AdminListRoute
                title="Belge kuyruğu"
                screenId="w.admin.documents.queue"
                apiPath="/admin/documents"
              />
            }
          />
          <Route
            path="abuse"
            element={
              <AdminListRoute
                title="Kötüye kullanım raporları"
                screenId="w.admin.abuse.list"
                apiPath="/admin/abuse-reports"
                linkBase="/abuse"
              />
            }
          />
          <Route
            path="abuse/:id"
            element={
              <AdminDetailRoute
                title="Kötüye kullanım detayı"
                screenId="w.admin.abuse.detail"
                buildPath={(id) => `/admin/abuse-reports/${id}`}
                controls={(data, reload) =>
                  typeof data.id === "string" ? (
                    <AbuseResolveControl
                      reportId={data.id}
                      status={typeof data.status === "string" ? data.status : "open"}
                      onDone={reload}
                    />
                  ) : null
                }
              />
            }
          />
          <Route
            path="risk"
            element={
              <AdminListRoute
                title="Risk olayları"
                screenId="w.admin.risk.queue"
                apiPath="/admin/risk-events"
              />
            }
          />
          <Route path="policies" element={<PoliciesManagePage />} />
          <Route path="config" element={<RemoteConfigPage />} />
          <Route
            path="audit"
            element={
              <AdminListRoute
                title="Denetim günlüğü"
                screenId="w.admin.audit.log"
                apiPath="/admin/audit/events"
              />
            }
          />
          <Route path="audit/reports" element={<AuditReportsPage />} />
          <Route path="devops" element={<DevopsOverviewPage />} />
          <Route path="devops/errors" element={<DevopsErrorsListPage />} />
          <Route
            path="devops/errors/:fingerprint"
            element={<DevopsErrorDetailPage />}
          />
          <Route
            path="devops/releases"
            element={
              <AdminListRoute
                title="Sürümler"
                screenId="w.admin.devops.releases"
                apiPath="/admin/devops/releases"
              />
            }
          />
          <Route path="devops/services" element={<DevopsServicesPage />} />
          <Route path="devops/clients" element={<DevopsClientsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
