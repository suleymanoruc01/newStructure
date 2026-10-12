import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "@/components/admin-layout";
import { useAuth } from "@/features/auth/auth-context";
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
  SupportTicketDetailPage,
} from "@/routes/ops-special-pages";
import {
  AbuseDetailPage,
  ApplicationDetailPage,
  DisputeDetailPage,
  DocumentDetailPage,
  EmployerDetailPage,
  JobDetailPage,
  RatingDetailPage,
  ShiftDetailPage,
  UserDetailPage,
  WorkerDetailPage,
} from "@/routes/ops-entity-pages";
import { PoliciesManagePage } from "@/routes/policies-manage-page";
import { SubscriptionsManagePage } from "@/routes/subscriptions-manage-page";
import { CatalogManagePage } from "@/routes/catalog-manage-page";
import { TokenPackagesManagePage } from "@/routes/token-packages-manage-page";
import { BranchesManagePage } from "@/routes/branches-manage-page";
import { BranchDetailPage } from "@/routes/branch-detail-page";
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
          <Route path="users/:id" element={<UserDetailPage />} />
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
          <Route path="workers/:id" element={<WorkerDetailPage />} />
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
          <Route path="employers/:id" element={<EmployerDetailPage />} />
          <Route path="branches" element={<BranchesManagePage />} />
          <Route path="branches/:id" element={<BranchDetailPage />} />
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
          <Route path="jobs/:id" element={<JobDetailPage />} />
          <Route path="catalog" element={<CatalogManagePage />} />
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
          <Route path="applications/:id" element={<ApplicationDetailPage />} />
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
          <Route path="shifts/:id" element={<ShiftDetailPage />} />
          <Route
            path="disputes"
            element={
              <AdminListRoute
                title="Uyuşmazlıklar"
                screenId="w.admin.disputes.queue"
                apiPath="/admin/disputes"
                linkBase="/disputes"
              />
            }
          />
          <Route path="disputes/:id" element={<DisputeDetailPage />} />
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
          <Route path="tokens/packages" element={<TokenPackagesManagePage />} />
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
          <Route path="ratings/:id" element={<RatingDetailPage />} />
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
                linkBase="/documents"
              />
            }
          />
          <Route path="documents/:id" element={<DocumentDetailPage />} />
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
          <Route path="abuse/:id" element={<AbuseDetailPage />} />
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
          <Route path="subscriptions" element={<SubscriptionsManagePage />} />
          <Route
            path="support"
            element={
              <AdminListRoute
                title="Destek talepleri"
                screenId="w.admin.support.list"
                apiPath="/admin/support/tickets"
                linkBase="/support"
              />
            }
          />
          <Route path="support/:id" element={<SupportTicketDetailPage />} />
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
