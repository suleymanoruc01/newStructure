#!/usr/bin/env python3
"""Generate PartonNewArch acceptance catalogs (TR + EN) from parton_case_tests_tr.json.

Grounding: backend/04-domain-modules.md REST map, shared/12-api-contracts.md,
mobile/web screen catalogs, agents/02-defaults-and-non-asks.md, cases/00-coverage-matrix.md.
Does not invent case IDs. Absent catalog IDs remain T-095, T-120, T-208, T-224.
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "parton_case_tests_tr.json"
MATRIX = Path(__file__).resolve().parent / "00-coverage-matrix.md"
OUT_TR = Path(__file__).resolve().parent / "parton_case_tests_newarch_tr.json"
OUT_EN = Path(__file__).resolve().parent / "parton_case_tests_newarch_en.json"

PRIO = {
    "kritik": ("critical", "Critical", "Kritik"),
    "yuksek": ("high", "High", "Yüksek"),
    "orta": ("medium", "Medium", "Orta"),
    "dusuk": ("low", "Low", "Düşük"),
}
TTYPE = {
    "fonksiyonel": ("functional", "Functional", "Fonksiyonel"),
    "is_kurali": ("business_rule", "Business rule", "İş kuralı"),
    "uctan_uca": ("end_to_end", "End to end", "Uçtan uca"),
    "negatif": ("negative", "Negative", "Negatif"),
    "performans": ("performance", "Performance", "Performans"),
    "kullanilabilirlik": ("usability", "Usability", "Kullanılabilirlik"),
    "guvenlik": ("security", "Security", "Güvenlik"),
}

GROUP_EN = {
    "CASE-AUTH": (
        "Registration / login / account management",
        "Phone OTP registration, sessions, employer org setup, and account security. v1 is OTP-only (no email/password).",
    ),
    "CASE-WORKER-PROFILE": (
        "Worker profile management",
        "Availability, sectors, occupations, documents, home pin, demographics, and apply-gate completeness.",
    ),
    "CASE-EMPLOYER-BRANCH": (
        "Employer profile and branch management",
        "Org profile, branches, coordinates, tenant scope, and inactive/deleted branch effects on jobs.",
    ),
    "CASE-JOB-POSTING": (
        "Job posting",
        "Catalog-backed jobs, draft/publish, headcount, token holds, favorites-only, and edit rules.",
    ),
    "CASE-MATCHING": (
        "Matching engine",
        "Server-side hard filters and ranking consumed only via GET /api/v1/jobs/feed and GET /api/v1/jobs/:id.",
    ),
    "CASE-APPLICATION": (
        "Application process",
        "Apply, unique (job, worker), withdraw, snapshot freeze, overlap warn, and illegal-state 409/422.",
    ),
    "CASE-EMPLOYER-REVIEW": (
        "Employer accept / reject",
        "Applicant board, accept/reject state machine, headcount cap, and notify templates.",
    ),
    "CASE-NOTIFICATIONS": (
        "Notification system",
        "Postgres inbox is source of truth; FCM is optional delivery; dedupe_key; correct audience; deep links.",
    ),
    "CASE-AVAILABILITY-3H": (
        "3-hour availability confirmation",
        "T-3h confirm window, can-come / cannot-come, 30-minute no-response auto-release, last-minute jobs.",
    ),
    "CASE-CHECKIN": (
        "Arrival confirmation and check-in",
        "Geofenced check-in, time window, mock-GPS risk, dispute, and employer manual confirm.",
    ),
    "CASE-LOCATION": (
        "Location verification",
        "Branch coordinates as geofence center; 50/100m radii; indoor softness; GPS-only hard pass/fail.",
    ),
    "CASE-TOKEN": (
        "Tokens / provision",
        "First-class ledger: hold / capture / release / top-up. Publish requires available >= headcount.",
    ),
    "CASE-FAVORITES": (
        "Favorites system",
        "Directional favorites, favorites-only jobs omitted from non-audience feed, list consistency.",
    ),
    "CASE-RATINGS": (
        "Ratings and reviews",
        "Bidirectional ratings after attendance, windows, averages, word-list filter, no double rate.",
    ),
    "CASE-ABUSE": (
        "Negative and abuse tests",
        "Overlap accept block, no-show risk, bans, mock GPS, bot rate limits, document/age fraud.",
    ),
    "CASE-E2E": (
        "End-to-end journeys",
        "Five architecture acceptance journeys across Nest + mobile + web (catalog skips T-208, T-224).",
    ),
    "CASE-PERF": (
        "Performance and scale tests",
        "k6/Artillery against staging; admin w.admin.perf.metrics + w.admin.devops.*; idempotent tokens.",
    ),
    "CASE-UX": (
        "Usability tests",
        "First-run, wizards, feed reasons, process timeline, check-in copy, location permission, token explainer.",
    ),
    "CASE-SECURITY": (
        "Security and data protection",
        "RBAC + resource scope, JWT rotation, signed document URLs, geo retention, no PII in logs. OTP-only v1.",
    ),
}

GROUP_ARCH = {
    "CASE-AUTH": {
        "nest_modules": ["auth", "users", "policies", "employers", "branches"],
        "rest": [
            "POST /api/v1/auth/otp/request",
            "POST /api/v1/auth/otp/verify",
            "POST /api/v1/auth/token/refresh",
            "POST /api/v1/auth/logout",
            "GET /api/v1/policies",
            "POST /api/v1/policies/acceptances",
            "POST /api/v1/users/me/roles",
            "POST /api/v1/employers",
        ],
        "screens": [
            "m.auth.phone",
            "m.auth.otp",
            "m.auth.role-select",
            "m.auth.policies",
            "m.worker.onboarding.profile",
            "m.employer.onboarding.business",
            "w.auth.login",
            "w.auth.otp",
        ],
        "admin_screens": [
            "w.admin.login",
            "w.admin.users.list",
            "w.admin.policies.manage",
            "w.admin.verification.queue",
        ],
        "docs": [
            "backend/18-auth-rbac.md",
            "backend/07-auth-security.md",
            "mobile/screens/auth.md",
        ],
        "tables": [
            "users",
            "otp_challenges",
            "refresh_sessions",
            "policy_acceptances",
            "employer_memberships",
        ],
        "layers": ["domain", "api", "e2e"],
    },
    "CASE-WORKER-PROFILE": {
        "nest_modules": ["workers", "matching", "applications"],
        "rest": [
            "GET /api/v1/workers/me",
            "PATCH /api/v1/workers/me",
            "PUT /api/v1/workers/me/availability",
            "GET /api/v1/workers/me/documents",
            "POST /api/v1/workers/me/documents",
            "PATCH /api/v1/workers/me/home",
            "GET /api/v1/jobs/feed",
        ],
        "screens": [
            "m.worker.profile.root",
            "m.worker.profile.edit",
            "m.worker.availability.edit",
            "m.worker.onboarding.profile",
            "m.worker.documents.list",
            "m.worker.documents.upload",
        ],
        "admin_screens": [
            "w.admin.workers.list",
            "w.admin.workers.detail",
            "w.admin.documents.queue",
        ],
        "docs": ["backend/04-domain-modules.md", "backend/12-matching-rules.md", "mobile/screens/worker.md"],
        "tables": ["worker_profiles", "availability_windows", "worker_documents"],
        "layers": ["domain", "api", "ui"],
    },
    "CASE-EMPLOYER-BRANCH": {
        "nest_modules": ["employers", "branches"],
        "rest": [
            "POST /api/v1/employers",
            "GET /api/v1/employers/me",
            "PATCH /api/v1/employers/me",
            "GET /api/v1/branches",
            "POST /api/v1/branches",
            "PATCH /api/v1/branches/:id",
            "GET /api/v1/branches/:id",
        ],
        "screens": [
            "m.employer.branches.list",
            "m.employer.branches.form",
            "m.employer.branches.detail",
            "m.employer.business.root",
            "w.employer.branches.list",
            "w.employer.branches.form",
        ],
        "admin_screens": [
            "w.admin.employers.list",
            "w.admin.employers.detail",
            "w.admin.branches.list",
        ],
        "docs": ["backend/04-domain-modules.md", "mobile/screens/employer.md"],
        "tables": ["employers", "branches"],
        "layers": ["api", "e2e"],
    },
    "CASE-JOB-POSTING": {
        "nest_modules": ["jobs", "tokens", "favorites"],
        "rest": [
            "GET /api/v1/job-catalog",
            "POST /api/v1/jobs",
            "PATCH /api/v1/jobs/:id",
            "GET /api/v1/jobs/:id",
            "GET /api/v1/employers/me/tokens",
        ],
        "screens": [
            "m.employer.jobs.list",
            "m.employer.jobs.form",
            "m.employer.jobs.detail",
            "w.employer.jobs.create",
            "w.employer.jobs.list",
        ],
        "admin_screens": ["w.admin.jobs.list", "w.admin.jobs.detail", "w.admin.catalog.manage"],
        "docs": ["backend/11-tokens-and-provision.md", "shared/04-wizard-state.md", "mobile/screens/employer.md"],
        "tables": ["jobs", "token_holds", "token_accounts"],
        "layers": ["domain", "api", "ui"],
    },
    "CASE-MATCHING": {
        "nest_modules": ["matching", "jobs", "workers", "favorites", "location"],
        "rest": ["GET /api/v1/jobs/feed", "GET /api/v1/jobs/:id"],
        "screens": ["m.worker.jobs.list", "m.worker.jobs.detail"],
        "admin_screens": ["w.admin.matching.diagnostics"],
        "docs": ["backend/12-matching-rules.md"],
        "tables": ["jobs", "worker_profiles", "availability_windows"],
        "layers": ["domain", "api"],
    },
    "CASE-APPLICATION": {
        "nest_modules": ["applications", "workers", "jobs"],
        "rest": [
            "POST /api/v1/jobs/:id/applications",
            "GET /api/v1/applications?mine=1",
            "POST /api/v1/applications/:id/withdraw",
            "GET /api/v1/jobs/:id",
        ],
        "screens": [
            "m.worker.jobs.apply-confirm",
            "m.worker.jobs.apply-overlap",
            "m.worker.applications.list",
            "m.shared.job-process.detail",
        ],
        "admin_screens": ["w.admin.applications.list", "w.admin.applications.detail"],
        "docs": ["backend/04-domain-modules.md", "mobile/screens/worker.md"],
        "tables": ["applications"],
        "layers": ["domain", "api", "e2e"],
    },
    "CASE-EMPLOYER-REVIEW": {
        "nest_modules": ["applications", "jobs", "notifications"],
        "rest": [
            "GET /api/v1/jobs/:id/applications",
            "POST /api/v1/applications/:id/accept",
            "POST /api/v1/applications/:id/reject",
            "GET /api/v1/notifications",
        ],
        "screens": [
            "m.employer.applicants.list",
            "m.employer.applicants.detail",
            "w.employer.applicants.board",
            "w.employer.applicants.detail",
            "m.manager.applicants.list",
        ],
        "admin_screens": ["w.admin.applications.list", "w.admin.jobs.detail"],
        "docs": ["shared/05-push-notifications-ux.md", "mobile/screens/employer.md"],
        "tables": ["applications", "notification_inbox", "notification_outbox"],
        "layers": ["api", "e2e"],
    },
    "CASE-NOTIFICATIONS": {
        "nest_modules": ["notifications"],
        "rest": [
            "GET /api/v1/notifications",
            "GET /api/v1/notifications/:id",
            "POST /api/v1/notifications/:id/read",
            "PATCH /api/v1/notifications/preferences",
            "POST /api/v1/devices/push-tokens",
        ],
        "screens": [
            "m.shared.notifications.list",
            "m.shared.notifications.detail",
            "m.shared.notifications.push-prefs",
            "w.employer.notifications",
        ],
        "admin_screens": ["w.admin.notifications.outbox", "w.admin.notifications.broadcast"],
        "docs": ["shared/05-push-notifications-ux.md", "backend/20-fcm-messaging.md"],
        "tables": ["notification_inbox", "notification_outbox", "device_push_tokens"],
        "layers": ["api", "e2e"],
    },
    "CASE-AVAILABILITY-3H": {
        "nest_modules": ["shifts", "notifications", "applications", "tokens"],
        "rest": [
            "POST /api/v1/shifts/:id/availability-confirm",
            "GET /api/v1/shifts/:id",
            "GET /api/v1/notifications",
        ],
        "screens": ["m.worker.shift.availability-confirm", "m.worker.shift.prep"],
        "admin_screens": ["w.admin.shifts.list", "w.admin.shifts.detail"],
        "docs": ["backend/04-domain-modules.md", "shared/05-push-notifications-ux.md"],
        "tables": ["shifts", "token_holds"],
        "layers": ["domain", "api", "e2e"],
    },
    "CASE-CHECKIN": {
        "nest_modules": ["shifts", "location", "notifications", "tokens", "moderation"],
        "rest": [
            "POST /api/v1/shifts/:id/check-in",
            "POST /api/v1/shifts/:id/check-out",
            "POST /api/v1/shifts/:id/disputes",
            "POST /api/v1/shifts/:id/manual-confirm",
        ],
        "screens": [
            "m.worker.shift.check-in",
            "m.worker.shift.in-shift",
            "m.worker.shift.dispute",
            "m.employer.shift.manual-confirm",
            "w.employer.shift.attendance",
        ],
        "admin_screens": ["w.admin.shifts.detail", "w.admin.disputes.queue"],
        "docs": ["backend/13-location-policy.md", "mobile/screens/worker.md"],
        "tables": ["shifts", "check_in_events", "token_ledger_entries"],
        "layers": ["domain", "api", "e2e"],
    },
    "CASE-LOCATION": {
        "nest_modules": ["location", "shifts", "branches"],
        "rest": ["POST /api/v1/shifts/:id/check-in", "POST /api/v1/branches", "PATCH /api/v1/branches/:id"],
        "screens": [
            "m.worker.shift.check-in",
            "m.employer.branches.form",
            "w.employer.branches.form",
        ],
        "admin_screens": ["w.admin.config.remote", "w.admin.risk.queue", "w.admin.branches.list"],
        "docs": ["backend/13-location-policy.md"],
        "tables": ["branches", "check_in_events"],
        "layers": ["domain", "api"],
    },
    "CASE-TOKEN": {
        "nest_modules": ["tokens", "jobs", "shifts", "applications"],
        "rest": [
            "GET /api/v1/employers/me/tokens",
            "GET /api/v1/employers/me/tokens/ledger",
            "POST /api/v1/employers/me/tokens/top-ups",
            "POST /api/v1/jobs",
        ],
        "screens": [
            "m.employer.tokens.root",
            "m.employer.tokens.top-up",
            "w.employer.tokens.overview",
            "w.employer.tokens.history",
        ],
        "admin_screens": ["w.admin.tokens.ledger", "w.admin.employers.detail", "w.admin.jobs.detail"],
        "docs": ["backend/11-tokens-and-provision.md"],
        "tables": ["token_accounts", "token_holds", "token_ledger_entries"],
        "layers": ["domain", "api"],
    },
    "CASE-FAVORITES": {
        "nest_modules": ["favorites", "jobs", "matching", "notifications"],
        "rest": ["GET /api/v1/favorites", "POST /api/v1/favorites", "DELETE /api/v1/favorites/:id", "GET /api/v1/jobs/feed"],
        "screens": [
            "m.worker.favorites.list",
            "m.employer.favorites.workers",
            "w.employer.favorites.workers",
        ],
        "admin_screens": ["w.admin.workers.detail", "w.admin.employers.detail", "w.admin.jobs.detail"],
        "docs": ["backend/12-matching-rules.md"],
        "tables": ["favorites", "jobs"],
        "layers": ["api", "e2e"],
    },
    "CASE-RATINGS": {
        "nest_modules": ["ratings", "notifications", "shifts"],
        "rest": ["GET /api/v1/ratings/pending", "POST /api/v1/ratings"],
        "screens": ["m.shared.ratings.compose", "m.shared.ratings.pending", "w.employer.ratings.pending"],
        "admin_screens": ["w.admin.ratings.queue", "w.admin.ratings.detail"],
        "docs": ["backend/04-domain-modules.md", "shared/05-push-notifications-ux.md"],
        "tables": ["ratings"],
        "layers": ["domain", "api"],
    },
    "CASE-ABUSE": {
        "nest_modules": ["moderation", "auth", "shifts", "location", "ratings", "tokens"],
        "rest": [
            "POST /api/v1/moderation/reports",
            "POST /api/v1/applications/:id/accept",
            "POST /api/v1/shifts/:id/check-in",
            "POST /api/v1/auth/otp/verify",
        ],
        "screens": [
            "m.shared.abuse.report",
            "m.shared.system.forbidden",
            "w.admin.abuse.queue",
            "w.admin.risk.queue",
        ],
        "admin_screens": ["w.admin.abuse.queue", "w.admin.abuse.detail", "w.admin.risk.queue", "w.admin.users.detail"],
        "docs": ["backend/18-auth-rbac.md", "backend/13-location-policy.md"],
        "tables": ["auth_bans", "moderation_reports", "risk_events"],
        "layers": ["domain", "api"],
    },
    "CASE-E2E": {
        "nest_modules": ["auth", "workers", "employers", "branches", "jobs", "tokens", "matching", "applications", "shifts", "location", "ratings", "favorites", "notifications"],
        "rest": [
            "POST /api/v1/auth/otp/verify",
            "POST /api/v1/jobs",
            "GET /api/v1/jobs/feed",
            "POST /api/v1/jobs/:id/applications",
            "POST /api/v1/applications/:id/accept",
            "POST /api/v1/shifts/:id/availability-confirm",
            "POST /api/v1/shifts/:id/check-in",
        ],
        "screens": ["m.auth.phone", "m.worker.jobs.list", "m.employer.jobs.form", "w.employer.dashboard"],
        "admin_screens": ["w.admin.shifts.detail", "w.admin.applications.detail"],
        "docs": ["cases/02-e2e-journeys.md"],
        "tables": ["users", "jobs", "applications", "shifts", "token_holds"],
        "layers": ["e2e"],
    },
    "CASE-PERF": {
        "nest_modules": ["matching", "notifications", "applications", "tokens", "location", "devops"],
        "rest": [
            "GET /api/v1/jobs/feed",
            "POST /api/v1/jobs/:id/applications",
            "POST /api/v1/shifts/:id/check-in",
            "GET /api/v1/admin/devops/services",
        ],
        "screens": ["w.admin.perf.metrics", "w.admin.devops.overview", "w.admin.devops.services"],
        "admin_screens": [
            "w.admin.dashboard",
            "w.admin.perf.metrics",
            "w.admin.devops.overview",
            "w.admin.devops.services",
        ],
        "docs": ["06-testing-strategy.md", "web/09-admin-devops.md", "05-quality-nfr.md"],
        "tables": ["notification_outbox", "token_ledger_entries"],
        "layers": ["perf"],
    },
    "CASE-UX": {
        "nest_modules": ["auth", "workers", "jobs", "applications", "shifts", "tokens", "favorites"],
        "rest": ["GET /api/v1/jobs/feed", "POST /api/v1/jobs", "GET /api/v1/applications/:id/timeline"],
        "screens": [
            "m.auth.tutorial",
            "m.worker.onboarding.profile",
            "m.worker.jobs.list",
            "m.shared.job-process.detail",
            "m.employer.tokens.root",
            "w.public.landing",
        ],
        "admin_screens": ["w.admin.config.remote", "w.admin.devops.clients"],
        "docs": ["DESIGN.md", "shared/03-screen-ux-layout.md", "shared/10-modern-ux-principles.md"],
        "tables": [],
        "layers": ["ui", "e2e"],
    },
    "CASE-SECURITY": {
        "nest_modules": ["auth", "users", "policies", "workers", "privacy", "audit"],
        "rest": [
            "GET /api/v1/me",
            "GET /api/v1/jobs/:id/applications",
            "POST /api/v1/auth/token/refresh",
            "GET /api/v1/workers/me/documents",
            "GET /api/v1/admin/audit/events",
        ],
        "screens": [
            "m.shared.profile.settings",
            "m.shared.system.forbidden",
            "m.shared.system.session-expired",
            "w.admin.users.detail",
            "w.admin.audit.log",
        ],
        "admin_screens": [
            "w.admin.users.list",
            "w.admin.audit.log",
            "w.admin.audit.reports",
            "w.admin.documents.queue",
        ],
        "docs": [
            "backend/18-auth-rbac.md",
            "backend/21-client-security.md",
            "backend/17-privacy-kvkk-gdpr.md",
            "backend/22-legal-audit-logger.md",
        ],
        "tables": ["refresh_sessions", "worker_documents", "check_in_events", "legal_audit_events"],
        "layers": ["api", "domain"],
    },
}

# title_en for every catalog ID (titles from parton_case_tests_tr.json)
TITLE_EN = {
    "T-001": "Register with a valid phone number",
    "T-002": "Register with a valid email",
    "T-003": "Block a second registration with the same phone",
    "T-004": "Reject registration with missing fields",
    "T-005": "Reject a wrong SMS verification code",
    "T-006": "Reject an expired verification code",
    "T-007": "Lock out after too many wrong codes",
    "T-008": "Reject registration with a weak password",
    "T-009": "Complete registration without location permission",
    "T-010": "Require profile completion after registration before apply",
    "T-011": "Register an employer with valid firm details",
    "T-012": "Reject employer registration with missing firm details",
    "T-013": "Reject a duplicate tax ID (vergi no)",
    "T-014": "Block an unauthorized user from creating a branch",
    "T-015": "Block publishing a job before firm verification",
    "T-016": "Persist selected availability days",
    "T-017": "Allow multiple time ranges on the same day",
    "T-018": "Reject overlapping availability ranges",
    "T-019": "Define overnight (midnight-crossing) availability",
    "T-020": "Select multiple sectors",
    "T-021": "Select multiple occupations",
    "T-022": "Persist selected document types",
    "T-023": "Validate uploaded document MIME/size",
    "T-024": "Reject an invalid document upload",
    "T-025": "Persist home location pin accurately",
    "T-026": "Recompute matching after a profile update",
    "T-027": "Change feed visibility after an age change",
    "T-028": "Recompute matching after a gender change",
    "T-029": "Block apply when the worker profile is incomplete",
    "T-030": "Handle active applications when a profile is deleted",
    "T-031": "Create a new branch",
    "T-032": "Add multiple branches to the same employer",
    "T-033": "Persist branch coordinates correctly",
    "T-034": "Keep jobs tied to a branch after the branch is updated",
    "T-035": "Close or hide jobs when a branch is deactivated",
    "T-036": "Reject a branch with invalid coordinates",
    "T-037": "List only the caller's own branches (tenant scope)",
    "T-038": "Historical job visibility after a branch is deleted",
    "T-039": "Create a job with a valid sector",
    "T-040": "Create a job with a valid occupation",
    "T-041": "Create a future-dated job",
    "T-042": "Reject a past-dated job",
    "T-043": "Reject start time after end time",
    "T-044": "Create a job with an optional gender filter",
    "T-045": "Require documents on a job",
    "T-046": "Create a job with headcount 1",
    "T-047": "Create a job with headcount greater than 1",
    "T-048": "Allow overlapping jobs at the same hours (different seats)",
    "T-049": "Reject publish when token balance is insufficient",
    "T-050": "Place a token hold when balance is sufficient",
    "T-051": "Save a job as draft without a hold",
    "T-052": "Edit a job after creation",
    "T-053": "Increase headcount and take an additional hold",
    "T-054": "Decrease headcount and release excess hold",
    "T-055": "Unpublish / close a job",
    "T-056": "Publish a favorites-only job",
    "T-057": "Employer gate when a favorites-only job has no audience",
    "T-058": "Show a job whose day matches worker availability",
    "T-059": "Hide a job on a day the worker is unavailable",
    "T-060": "Show a job whose hours match worker availability",
    "T-061": "Hide a job whose hours the worker cannot cover",
    "T-062": "Show a sector-compatible job",
    "T-063": "Hide a sector-incompatible job",
    "T-064": "Show an occupation-compatible job",
    "T-065": "Hide an occupation-incompatible job",
    "T-066": "Show a document-gated job to a worker who has the docs",
    "T-067": "Hide a document-gated job from a worker missing docs",
    "T-068": "Rank nearer jobs higher",
    "T-069": "Show all matching jobs for a multi-sector worker",
    "T-070": "Show all matching jobs for a multi-occupation worker",
    "T-071": "Partial time overlap vs coverage rule",
    "T-072": "Full-cover time rule",
    "T-073": "Match an overnight (night-shift) window",
    "T-074": "Surface favorite-employer jobs distinctly",
    "T-075": "Omit favorites-only jobs from non-favorite workers (no existence leak)",
    "T-076": "Nearest job appears first (distance rank)",
    "T-077": "Highest match score appears first",
    "T-078": "Boost a favorite employer's job",
    "T-079": "Sooner start time ranks higher",
    "T-080": "Apply to an eligible job",
    "T-081": "Block a second apply to the same job",
    "T-082": "Block apply when the profile is incomplete",
    "T-083": "Block apply to an expired job",
    "T-084": "Block apply when headcount is full",
    "T-085": "Soft-warn on apply when time ranges overlap",
    "T-086": "Withdraw a pending application",
    "T-087": "Frozen profile snapshot after apply",
    "T-088": "Application status when job requirements change later",
    "T-089": "List applicants for a job",
    "T-090": "Filter applicants",
    "T-091": "Accept an applicant",
    "T-092": "Reject an applicant",
    "T-093": "Close the job when headcount is filled",
    "T-094": "Block accept beyond remaining headcount",
    "T-096": "Rejected worker receives the rejection notification",
    "T-097": "Accepted worker receives the acceptance notification",
    "T-098": "Revoke a previously accepted applicant",
    "T-099": "Accepted workers when the job is closed",
    "T-100": "Notify a worker of a newly matched job",
    "T-101": "Notify employer that an application was received",
    "T-102": "Acceptance notification",
    "T-103": "Rejection notification",
    "T-104": "3-hour availability confirmation notification",
    "T-105": "10-minute check-in due notification",
    "T-106": "Rating reminder 24 hours later",
    "T-107": "Notify when a favorite employer posts",
    "T-108": "Favorites-only job notification reaches only the audience",
    "T-109": "Tapping a notification opens the correct screen",
    "T-110": "No duplicate notifications (dedupe_key)",
    "T-111": "In-app inbox still works when push is disabled",
    "T-112": "Delayed push still leaves inbox visible",
    "T-113": "Notification is not delivered to the wrong user",
    "T-114": "Worker receives the 3-hour confirmation prompt",
    "T-115": "Worker selects can-come",
    "T-116": "Worker selects cannot-come",
    "T-117": "No response within the confirm window",
    "T-118": "Change can-come to cannot-come",
    "T-119": "Employer is notified of cannot-come",
    "T-121": "Only some workers cancel on a multi-headcount job",
    "T-122": "Adapt the 3h flow for a last-minute job",
    "T-123": "10-minute check-in reminder is sent",
    "T-124": "Worker asserts arrival (işe geldim)",
    "T-125": "Check-in succeeds inside the geofence",
    "T-126": "Check-in is rejected outside the geofence",
    "T-127": "GPS accuracy / drift tolerance",
    "T-128": "Retry check-in on a poor network",
    "T-129": "Reject an early check-in",
    "T-130": "Reject a late check-in",
    "T-131": "Reject a mock-GPS check-in and raise risk",
    "T-132": "Reject check-in when location permission is off",
    "T-133": "Employer is notified of successful check-in",
    "T-134": "Employer/manager manual confirm path",
    "T-135": "Worker disputes a false geofence rejection",
    "T-136": "Check-in uses the stored branch coordinates",
    "T-137": "Detect wrong branch coordinates",
    "T-138": "50-meter geofence radius",
    "T-139": "100-meter geofence radius",
    "T-140": "Indoor GPS drift softness",
    "T-141": "Mall indoor location drift",
    "T-142": "High-rise / multi-floor scenario",
    "T-143": "Rural low-accuracy GPS",
    "T-144": "Wi-Fi / network location is not a hard pass",
    "T-145": "Check-in while moving",
    "T-146": "No background location permission in v1",
    "T-147": "iOS vs Android permission and accuracy differences",
    "T-148": "Detect a fake-GPS tool",
    "T-149": "Publish a job when token balance is sufficient",
    "T-150": "Refuse publish when tokens are insufficient",
    "T-151": "Hold tokens equal to headcount",
    "T-152": "Release holds when a job is cancelled",
    "T-153": "Token state when a job gets no applicants",
    "T-154": "Token state when applications exist but none are accepted",
    "T-155": "Token state when an accepted worker is a no-show",
    "T-156": "Capture a token when the worker checks in",
    "T-157": "Partial capture on a multi-headcount job",
    "T-158": "Additional hold when headcount increases",
    "T-159": "Release when headcount decreases",
    "T-160": "Idempotent ledger: no double debit on retry",
    "T-161": "Failed top-up / payment leaves the job as draft",
    "T-162": "Token movement history / ledger",
    "T-163": "Live balance update in the UI",
    "T-164": "Employer favorites a worker",
    "T-165": "Worker favorites an employer",
    "T-166": "Favorites are directional (one-way)",
    "T-167": "Mutual favorite does not collapse into a single edge",
    "T-168": "Create a favorites-only job",
    "T-169": "Favorites-only job is visible only to the audience",
    "T-170": "Favorites-only job appears on the favorites surface",
    "T-171": "Removing a favorite drops exclusive-job access",
    "T-172": "Rating reminder 24 hours after the shift",
    "T-173": "Worker rates the employer/branch",
    "T-174": "Employer rates the worker",
    "T-175": "Leave a rating comment",
    "T-176": "Filter abusive / insulting comments",
    "T-177": "Cannot rate the same shift twice",
    "T-178": "Rating rule when the worker did not attend",
    "T-179": "No rating prompt for a cancelled job",
    "T-180": "Average rating is computed correctly",
    "T-181": "Hard-block a second overlapping accept",
    "T-182": "Repeat can-come then no-show raises worker risk",
    "T-183": "Repeat last-minute employer cancels raise employer risk",
    "T-184": "Multiple fake accounts from the same device",
    "T-185": "Fake job posting attempt",
    "T-186": "Bot apply attempts are rate-limited",
    "T-187": "Rating manipulation is blocked / queued",
    "T-188": "Mock GPS must not capture tokens",
    "T-189": "Employer falsely marks an attending worker as no-show",
    "T-190": "Worker claims attendance without being on site",
    "T-191": "False age declaration vs job age filter",
    "T-192": "Banned identity cannot re-register",
    "T-193": "Worker registers (journey 1)",
    "T-194": "Employer registers (journey 1)",
    "T-195": "Branch is created (journey 1)",
    "T-196": "Job is published (journey 1)",
    "T-197": "Job appears on the eligible worker feed (journey 1)",
    "T-198": "Worker applies (journey 1)",
    "T-199": "Employer accepts (journey 1)",
    "T-200": "Worker confirms can-come (journey 1)",
    "T-201": "Worker arrives and checks in (journey 1)",
    "T-202": "Location verifies (journey 1)",
    "T-203": "Token is captured (journey 1)",
    "T-204": "Both sides rate (journey 1)",
    "T-205": "Worker is accepted (journey 2)",
    "T-206": "Worker says cannot-come at T-3h (journey 2)",
    "T-207": "Employer is notified (journey 2)",
    "T-209": "Tokens are not wrongly captured (journey 2)",
    "T-210": "Worker is physically on site (journey 3)",
    "T-211": "GPS check-in fails (journey 3)",
    "T-212": "Worker opens a dispute (journey 3)",
    "T-213": "Employer manually confirms (journey 3)",
    "T-214": "Token decision follows manual confirm (journey 3)",
    "T-215": "Employer favorites the worker (journey 4)",
    "T-216": "Employer publishes a favorites-only job (journey 4)",
    "T-217": "Only that worker sees the job (journey 4)",
    "T-218": "Apply and accept complete (journey 4)",
    "T-219": "Employer publishes a 5-seat job (journey 5)",
    "T-220": "5 tokens are held (journey 5)",
    "T-221": "Applications arrive (journey 5)",
    "T-222": "5 workers are accepted (journey 5)",
    "T-223": "1 accepted worker cancels (journey 5)",
    "T-225": "Capture equals attendees, not the original 5 (journey 5)",
    "T-226": "Fan-out thousands of job-matched notifications",
    "T-227": "Thousands of concurrent applications",
    "T-228": "Matching engine under load",
    "T-229": "Job list performance for a multi-branch employer",
    "T-230": "Check-in / geofence under load",
    "T-231": "Notification queue lag",
    "T-232": "Concurrent token ledger operations",
    "T-233": "No duplicate side effects under load",
    "T-234": "No Postgres deadlocks on contended ledger rows",
    "T-235": "First-time worker understands the flow",
    "T-236": "Profile setup duration is acceptable",
    "T-237": "Employer job-create wizard is understandable",
    "T-238": "Job feed is clear (match reasons)",
    "T-239": "Application status is readable",
    "T-240": "Check-in timing copy is understandable",
    "T-241": "Location-permission request is persuasive and honest",
    "T-242": "Favorites screen is understandable",
    "T-243": "Token hold vs capture is explained",
    "T-244": "A user can read only their own resources",
    "T-245": "An employer sees only their own applicants",
    "T-246": "Unauthorized API access is rejected",
    "T-247": "Session refresh rotation and reuse detection",
    "T-248": "Password-reset security",
    "T-249": "Document files are not publicly readable",
    "T-250": "Location data is stored for attendance only, not tracks",
    "T-251": "Sensitive fields are not shown unnecessarily",
    "T-252": "Logs and job payloads contain no PII",
}

SUBSECTION_EN = {
    "İşçi kayıt senaryoları": "Worker registration scenarios",
    "İşveren kayıt senaryoları": "Employer registration scenarios",
    "Temel eşleşme testleri": "Basic matching tests",
    "Karma eşleşme testleri": "Composite matching tests",
    "Sıralama testleri": "Ranking tests",
    "Uçtan Uca Senaryo 1: Sorunsuz Tam Akış": "Journey 1: Happy path",
    "Uçtan Uca Senaryo 2: İşçi Gelemiyor": "Journey 2: Worker cannot come",
    "Uçtan Uca Senaryo 3: GPS Sorunu": "Journey 3: GPS failure + manual confirm",
    "Uçtan Uca Senaryo 4: Favori Üzerinden Tekrar Çalışma": "Journey 4: Favorites rehire",
    "Uçtan Uca Senaryo 5: Çok Kişili İlan": "Journey 5: Multi-headcount job",
}

# Per-case architecture overrides. Keys optional; group defaults apply otherwise.
# disp: implement | skip | assert_not_applicable
CASE_X = {
    "T-002": {"disp": "skip", "gap": "gap-email-auth", "default": "gap-email-auth", "errors": ["VALIDATION_FAILED"]},
    "T-003": {"errors": ["CONFLICT"], "http": 409},
    "T-004": {"errors": ["VALIDATION_FAILED"], "http": 400},
    "T-005": {"errors": ["VALIDATION_FAILED"], "http": 400, "rest": ["POST /api/v1/auth/otp/verify"]},
    "T-006": {"errors": ["VALIDATION_FAILED"], "http": 400},
    "T-007": {"errors": ["RATE_LIMITED"], "http": 429},
    "T-008": {"disp": "skip", "gap": "gap-password", "default": "gap-password"},
    "T-013": {"errors": ["CONFLICT"], "http": 409, "default": "gap-firm-verification"},
    "T-014": {"errors": ["FORBIDDEN"], "http": 403},
    "T-015": {"errors": ["EMPLOYER_UNVERIFIED"], "http": 422, "default": "gap-firm-verification"},
    "T-018": {"errors": ["VALIDATION_FAILED"], "http": 400},
    "T-019": {"default": "gap-night-shift"},
    "T-024": {"errors": ["VALIDATION_FAILED"], "http": 400, "default": "gap-documents"},
    "T-029": {"errors": ["PROFILE_INCOMPLETE"], "http": 422},
    "T-036": {"errors": ["VALIDATION_FAILED"], "http": 400},
    "T-037": {"errors": ["FORBIDDEN"], "http": 403},
    "T-042": {"errors": ["VALIDATION_FAILED"], "http": 400},
    "T-043": {"errors": ["VALIDATION_FAILED"], "http": 400},
    "T-049": {"errors": ["TOKEN_INSUFFICIENT"], "http": 422},
    "T-056": {"default": "gap-favorites-only-job"},
    "T-057": {"default": "gap-favorites-only-job"},
    "T-073": {"default": "gap-night-shift"},
    "T-075": {"default": "gap-favorites-only-job"},
    "T-080": {"errors": [], "http": 201},
    "T-081": {"errors": ["ALREADY_APPLIED"], "http": 409},
    "T-082": {"errors": ["PROFILE_INCOMPLETE"], "http": 422},
    "T-083": {"errors": ["APPLICATION_CLOSED"], "http": 409},
    "T-084": {"errors": ["APPLICATION_CLOSED"], "http": 409},
    "T-085": {"default": "gap-overlap-apply", "screens": ["m.worker.jobs.apply-overlap"]},
    "T-094": {"errors": ["CONFLICT"], "http": 409},
    "T-096": {"notify": "application.rejected"},
    "T-097": {"notify": "application.accepted"},
    "T-098": {"notify": "application.accept_revoked"},
    "T-099": {"notify": "job.closed_with_accepts"},
    "T-100": {"notify": "job.matched"},
    "T-101": {"notify": "application.received"},
    "T-102": {"notify": "application.accepted"},
    "T-103": {"notify": "application.rejected"},
    "T-104": {"notify": "shift.confirm_3h"},
    "T-105": {"notify": "shift.checkin_due"},
    "T-106": {"notify": "rating.pending"},
    "T-107": {"notify": "job.favorite_employer"},
    "T-108": {"notify": "job.favorites_only"},
    "T-114": {"notify": "shift.confirm_3h"},
    "T-116": {"notify": "shift.cannot_come"},
    "T-117": {"notify": "shift.confirm_timeout", "default": "gap-3h-no-response"},
    "T-119": {"notify": "shift.cannot_come"},
    "T-123": {"notify": "shift.checkin_due"},
    "T-126": {"errors": ["OUTSIDE_GEOFENCE"], "http": 422},
    "T-129": {"errors": ["CHECKIN_WINDOW_CLOSED"], "http": 422},
    "T-130": {"errors": ["CHECKIN_WINDOW_CLOSED"], "http": 422},
    "T-131": {"default": "gap-mock-gps", "errors": ["OUTSIDE_GEOFENCE"], "http": 422},
    "T-132": {"errors": ["VALIDATION_FAILED"], "http": 400},
    "T-133": {"notify": "shift.worker_checked_in"},
    "T-134": {"notify": "shift.manual_confirmed", "default": "gap-checkin-dispute"},
    "T-135": {"notify": "shift.dispute_update", "default": "gap-checkin-dispute"},
    "T-144": {"disp": "implement", "default": "gap-wifi-location", "gap": "gap-wifi-location"},
    "T-148": {"default": "gap-mock-gps"},
    "T-150": {"errors": ["TOKEN_INSUFFICIENT"], "http": 422},
    "T-155": {"default": "gap-3h-no-response"},
    "T-160": {"errors": ["HOLD_EXISTS", "CONFLICT"]},
    "T-161": {"default": "gap-payments"},
    "T-168": {"default": "gap-favorites-only-job"},
    "T-169": {"default": "gap-favorites-only-job"},
    "T-172": {"notify": "rating.pending"},
    "T-176": {"default": "gap-profanity-filter"},
    "T-181": {"errors": ["CONFLICT"], "http": 409, "default": "gap-overlap-apply"},
    "T-184": {"default": "gap-device-fingerprint"},
    "T-186": {"errors": ["RATE_LIMITED"], "http": 429, "default": "gap-bot-protection"},
    "T-188": {"default": "gap-mock-gps"},
    "T-191": {"default": "gap-profile-demographics"},
    "T-192": {"errors": ["FORBIDDEN"], "http": 403, "default": "gap-ban-reentry"},
    "T-216": {"default": "gap-favorites-only-job"},
    "T-246": {"errors": ["UNAUTHORIZED", "FORBIDDEN"], "http": 401},
    "T-247": {"errors": ["SESSION_EXPIRED", "UNAUTHORIZED"], "http": 401},
    "T-248": {"disp": "skip", "gap": "gap-password", "default": "gap-password"},
    "T-249": {"errors": ["FORBIDDEN", "NOT_FOUND"], "http": 403, "default": "gap-documents"},
}


def parse_matrix(text: str) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for line in text.splitlines():
        m = re.match(
            r"\| `(T-\d+)` \| .* \| .* \| .* \| ([^|]+) \| ([^|]+) \| `([^`]+)` \| ([^|]*) \|",
            line,
        )
        if not m:
            continue
        cid, modules, screens, status, gap = m.groups()
        gap = gap.strip().split("—")[0].strip().strip("`")
        if gap.startswith("template") or gap.startswith("product"):
            gap = ""
        out[cid] = {
            "modules": [x.strip() for x in modules.split(",") if x.strip() and x.strip() != "*"],
            "screens_matrix": [x.strip() for x in screens.split(",") if x.strip()],
            "arch_status": status.strip(),
            "gap_tag": gap or None,
        }
    return out


def envelope_ok() -> str:
    return "{data, meta} with meta.requestId (ADR-0027)"


def envelope_err(code: str) -> str:
    return f"{{error: {{code: '{code}', message}}, meta}} — message localized tr-TR, code English"


# Unique expected results (EN, TR) — architecture-grounded, not generic templates.
EXP = {}


def _e(cid: str, en: str, tr: str) -> None:
    EXP[cid] = (en, tr)


def load_expected() -> None:
    _e("T-001", "POST /api/v1/auth/otp/request then verify creates a unique users row (E.164), hashed otp_challenges, refresh_sessions, and JWT. No Firebase Auth. Next screen m.worker.onboarding.profile after role select.",
       "POST /api/v1/auth/otp/request ve verify E.164 unique users satırı, hash'li otp_challenges, refresh_sessions ve JWT üretir. Firebase Auth yok. Rol seçiminden sonra m.worker.onboarding.profile.")
    _e("T-002", "v1 is phone-OTP only (agent-default gap-email-auth). Do not ship email/password routes or m.auth.email. Mark @T-002 skipped until an ADR supersedes.",
       "v1 yalnızca telefon OTP (agent-default gap-email-auth). E-posta/şifre rotası veya m.auth.email yok. ADR gelene kadar @T-002 skip.")
    _e("T-003", "Second POST /api/v1/auth/otp/verify for an existing phone returns 409 CONFLICT. No second users row. Unique constraint on users.phone.",
       "Var olan telefon için ikinci POST /api/v1/auth/otp/verify 409 CONFLICT döner. İkinci users satırı oluşmaz. users.phone unique.")
    _e("T-004", "Missing phone/policy acceptance fails Zod at the edge: 400 VALIDATION_FAILED with details[].path. No otp_challenges row for empty phone.",
       "Eksik telefon/politika kabulü kenarda Zod ile 400 VALIDATION_FAILED (details[].path). Boş telefon için otp_challenges yok.")
    _e("T-005", "Wrong code increments otp_challenges.attempt_count. 400 VALIDATION_FAILED. OTP remains hashed. SMS-only — never FCM. m.auth.otp shows wrong-code state.",
       "Yanlış kod attempt_count artırır. 400 VALIDATION_FAILED. OTP hash'li kalır. Yalnızca SMS — FCM yok. m.auth.otp yanlış-kod durumu.")
    _e("T-006", "Expired challenge (server clock) returns 400. Code cannot be reused. Client offers resend via POST /api/v1/auth/otp/request (rate-limited).",
       "Süresi dolmuş challenge 400 döner. Kod yeniden kullanılamaz. İstemci rate-limit'li resend sunar.")
    _e("T-007", "After configured max attempts, further verify is 429 RATE_LIMITED. Lock visible on m.auth.otp. Admin can see lockout on w.admin.users.detail.",
       "Maksimum denemeden sonra 429 RATE_LIMITED. m.auth.otp kilit gösterir. Admin w.admin.users.detail üzerinde görür.")
    _e("T-008", "v1 is OTP-only (agent-default gap-password). No password set/reset APIs. Skip @T-008; do not fake a password validator.",
       "v1 OTP-only (gap-password). Şifre set/reset API'si yok. @T-008 skip; sahte şifre doğrulayıcı yazma.")
    _e("T-009", "Registration completes without OS location permission. Home pin and geofence are deferred to profile / check-in (T-025, T-132). 200 session issued.",
       "Kayıt konum izni olmadan tamamlanır. Home pin ve geofence profil/check-in'e ertelenir. Oturum 200.")
    _e("T-010", "Worker with incomplete worker_profiles cannot POST /api/v1/jobs/:id/applications → 422 PROFILE_INCOMPLETE. m.worker.jobs.apply-confirm blocked CTA. Completeness defined in workers module.",
       "Eksik worker_profiles ile başvuru 422 PROFILE_INCOMPLETE. CTA engelli. Tamlık workers modülünde tanımlı.")
    _e("T-011", "POST /api/v1/employers with legal name + tax id creates employers row (verification_status pending) and employer_memberships owner. Screens: m.employer.onboarding.business / w.employer.onboarding.",
       "Geçerli unvan + vergi no ile employers (pending) ve owner membership oluşur.")
    _e("T-012", "Missing firm fields → 400 VALIDATION_FAILED. No employers row. Wizard state restored on Back (shared/04-wizard-state.md).",
       "Eksik firma alanları 400. employers satırı yok. Sihirbaz Back ile alanları korur.")
    _e("T-013", "Duplicate tax ID → 409 CONFLICT. Unique index on employers.tax_id. Agent-default gap-firm-verification.",
       "Mükerrer vergi no 409 CONFLICT. employers.tax_id unique.")
    _e("T-014", "Worker JWT POST /api/v1/branches → 403 FORBIDDEN. Manager without invite cannot create either. Only employer membership (or admin) may create.",
       "İşçi JWT ile POST /api/v1/branches → 403 FORBIDDEN.")
    _e("T-015", "Employer verification_status != verified (and no staging bypass) POST publish → 422 EMPLOYER_UNVERIFIED. Draft PATCH still allowed. w.admin.verification.queue / m.employer.verification.status.",
       "Doğrulanmamış işveren yayınlayamaz: 422 EMPLOYER_UNVERIFIED. Taslak PATCH serbest.")
    _e("T-016", "PUT /api/v1/workers/me/availability replaces day flags in availability_windows. GET round-trips the same days. m.worker.availability.edit.",
       "Uygun günler availability_windows içinde kalıcıdır.")
    _e("T-017", "Multiple non-overlapping ranges on one weekday persist as separate windows. UI allows add/remove on m.worker.availability.edit.",
       "Aynı günde örtüşmeyen birden fazla aralık ayrı window olarak kaydolur.")
    _e("T-018", "Overlapping ranges on the same day → 400 VALIDATION_FAILED. No write. Server-side interval check, not client-only.",
       "Çakışan aralıklar 400. Yazma yok. Kontrol sunucuda.")
    _e("T-019", "Midnight-crossing windows stored as UTC instants (agent-default gap-night-shift). UI shows Europe/Istanbul. Matching uses interval normalization (T-073).",
       "Gece vardiyası UTC an olarak saklanır; UI TR saati gösterir.")
    _e("T-020", "PATCH /api/v1/workers/me industries[] accepts multiple catalog IDs. Invalid catalog id → 400. Feed uses intersection (T-069).",
       "Çoklu sektör catalog ID olarak kaydolur.")
    _e("T-021", "Multiple occupations persist. Invalid occupation → 400. Matching intersection (T-070).",
       "Çoklu meslek kalıcıdır.")
    _e("T-022", "Document type selections persist on worker_documents (typed). GET /api/v1/workers/me/documents returns types. m.worker.documents.list.",
       "Belge tipleri worker_documents üzerinde kalıcıdır.")
    _e("T-023", "Upload via POST /api/v1/workers/me/documents uses signed PUT to object storage (MinIO/S3). MIME/size from config. Wrong type → 400 before store.",
       "Yükleme imzalı URL + MIME/boyut limiti. Yanlış tip 400.")
    _e("T-024", "Disallowed MIME/exe/oversize → 400 VALIDATION_FAILED. No object stored. Admin queue unchanged.",
       "Geçersiz belge 400. Nesne yazılmaz.")
    _e("T-025", "PATCH /api/v1/workers/me/home stores lat/lng used for matching distance (T-068). Not used as check-in geofence (branch coords are).",
       "Home pin eşleşme mesafesi içindir; check-in geofence şube koordinatıdır.")
    _e("T-026", "After profile PATCH, GET /api/v1/jobs/feed reflects new hard filters (async re-index OK). Admin diagnostics w.admin.matching.diagnostics explain include/exclude.",
       "Profil PATCH sonrası feed yeni hard filter'ları yansıtır.")
    _e("T-027", "Age field + optional job age filter (agent-default gap-profile-demographics). Feed hides jobs whose constraints the new age fails.",
       "Yaş değişince kısıtlı ilanlar feed'den düşer.")
    _e("T-028", "Gender on profile; optional job gender filter. Feed/eligibility updates. No client-side-only filter.",
       "Cinsiyet filtresi sunucu eşleşmesinde uygulanır.")
    _e("T-029", "POST apply with incomplete profile → 422 PROFILE_INCOMPLETE. Same gate as T-082.",
       "Eksik profil başvurusu 422 PROFILE_INCOMPLETE.")
    _e("T-030", "Erasure/profile delete withdraws or closes pending applications; accepted shifts follow privacy + tokens policy. DSR via POST /api/v1/privacy/erasure-requests.",
       "Profil silinince bekleyen başvurular kapanır; DSR erasure endpoint.")
    _e("T-031", "POST /api/v1/branches creates a branch under the employer. 201 + data. m.employer.branches.form / w.employer.branches.form.",
       "POST /api/v1/branches 201 ile şube oluşturur.")
    _e("T-032", "Multiple branches share employer_id. List GET /api/v1/branches returns all for the org (employer context).",
       "Aynı işverene birden fazla şube bağlanır.")
    _e("T-033", "Lat/lng persisted and later used as geofence center (T-136). Invalid numbers rejected (T-036).",
       "Şube koordinatı geofence merkezi olarak saklanır.")
    _e("T-034", "PATCH branch metadata does not orphan jobs. jobs.branch_id remains. Feed still resolves the branch geo.",
       "Şube güncellemesi ilan branch_id ilişkisini bozmaz.")
    _e("T-035", "Deactivating a branch unpublishes or blocks new publishes on that branch; open holds follow token release rules.",
       "Pasif şubede yeni yayın engellenir; açık hold'lar kurala göre iade.")
    _e("T-036", "Out-of-range / non-finite coordinates → 400 VALIDATION_FAILED.",
       "Geçersiz koordinat 400.")
    _e("T-037", "Employer B JWT listing branches of A → empty 200 or 403; never leak rows. Manager scoped to branchIds (AO-11).",
       "Başka işverenin şubeleri sızmaz. Manager branch scope.")
    _e("T-038", "Deleted/archived branch: historical jobs remain for participants; public feed omits them. Admin can still inspect.",
       "Silinen şube geçmişi katılımcılara; public feed'de yok.")
    _e("T-039", "POST /api/v1/jobs with catalog sector id. Unknown sector → 400. GET /api/v1/job-catalog is SoR.",
       "Geçerli sektör catalog ID ile ilan oluşur.")
    _e("T-040", "Occupation must belong to catalog. Invalid occupation → 400.",
       "Geçerli meslek catalog'dan gelmelidir.")
    _e("T-041", "Future start (ISO-8601 UTC) accepted. UI Europe/Istanbul.",
       "Gelecek tarihli ISO-8601 UTC başlangıç kabul.")
    _e("T-042", "Start in the past → 400 VALIDATION_FAILED on publish.",
       "Geçmiş tarihli yayın 400.")
    _e("T-043", "start >= end (after overnight normalization) → 400. Overnight jobs use T-019/T-073 rules, not this rejection.",
       "Başlangıç ≥ bitiş (gece kuralı hariç) 400.")
    _e("T-044", "Optional gender constraint stored on job; matching hard-filter (T-028). Legal copy via policies.",
       "Opsiyonel cinsiyet filtresi job üzerinde; eşleşme hard filter.")
    _e("T-045", "required_document_types[] on job. Workers missing types are ineligible (T-067) and cannot apply.",
       "Zorunlu belgeler job.required_document_types.")
    _e("T-046", "headcount=1 → hold 1 token on publish (T-151).",
       "headcount=1 iken 1 jeton hold.")
    _e("T-047", "headcount=N → hold N. Accept cap N (T-094).",
       "headcount=N iken N hold; kabul tavanı N.")
    _e("T-048", "Two jobs at the same hours are allowed. Worker overlap is apply/accept policy (T-085/T-181), not a job-create block.",
       "Aynı saatte iki ilan açılabilir; çakışma işçi kabul kuralıdır.")
    _e("T-049", "available < headcount → 422 TOKEN_INSUFFICIENT. Job stays draft. m.employer.tokens.root shows balance.",
       "Yetersiz bakiye 422 TOKEN_INSUFFICIENT; taslak kalır.")
    _e("T-050", "Publish calls tokens.holdForJob. Ledger hold row; balance decreases; hold amount = headcount. Idempotency-Key required.",
       "Yayın holdForJob çağırır; hold=headcount; Idempotency-Key.")
    _e("T-051", "POST/PATCH status=draft does not hold tokens. Wizard persists via PATCH (ADR-0020).",
       "Taslak hold almaz.")
    _e("T-052", "PATCH published job: immutable fields (branch, captured holds) enforced; legal edits 200. Past start cannot be introduced.",
       "Yayın sonrası PATCH kurallı; hold/şube korunur.")
    _e("T-053", "Increase headcount → additional hold or 422 TOKEN_INSUFFICIENT (T-158).",
       "Personel artışı ek hold veya 422.")
    _e("T-054", "Decrease headcount cannot go below accepted count; excess hold released (T-159).",
       "Azalış kabul sayısının altına inemez; fazla hold iade.")
    _e("T-055", "Close/unpublish → applications APPLICATION_CLOSED; remaining holds released per T-152–T-154. Notify T-099.",
       "Yayından kaldırma başvuruları kapatır; hold iade.")
    _e("T-056", "favorites_only=true. Matching omits non-audience (T-075). Template job.favorites_only (T-108).",
       "favorites_only bayrağı; feed'den non-audience çıkarılır.")
    _e("T-057", "Publish with empty favorites audience: in-app employer banner; optional inbox job.audience_empty; no worker push. Job may stay draft or warn — do not silently notify the world.",
       "Boş favori kitlesinde işçi push yok; işveren uyarılır.")
    _e("T-058", "Hard filter day: job weekday ⊆ worker availability. Shown on GET /api/v1/jobs/feed. RN must not re-filter a global list.",
       "Gün hard filter sunucuda; istemci global liste süzmez.")
    _e("T-059", "Unavailable day → job omitted from feed and eligibility.false on GET /api/v1/jobs/:id with matchReasons.",
       "Uygun olmayan gün feed'de yok.")
    _e("T-060", "Time hard filter pass → visible. Coverage mode from matching config (T-071/T-072).",
       "Saat kuralı geçince ilan görünür.")
    _e("T-061", "No covering range → omitted.",
       "Saat uymuyorsa ilan yok.")
    _e("T-062", "Sector intersection non-empty → visible.",
       "Sektör kesişimi varsa görünür.")
    _e("T-063", "No sector intersection → omitted.",
       "Sektör uyumsuzsa yok.")
    _e("T-064", "Occupation intersection → visible.",
       "Meslek kesişimi varsa görünür.")
    _e("T-065", "No occupation intersection → omitted.",
       "Meslek uyumsuzsa yok.")
    _e("T-066", "Worker has all required_document_types → visible/eligible.",
       "Zorunlu belgeler varsa ilan görünür.")
    _e("T-067", "Missing any required type → omitted (no greyed leak of exclusive constraints beyond reasons on detail if already eligible otherwise).",
       "Eksik belge tipi ilanı gizler.")
    _e("T-068", "Ranking uses distance from worker home pin to branch. Nearer higher. Weights via admin config.",
       "Sıralama home pin → şube mesafesi.")
    _e("T-069", "Union of worker sectors vs job sector: all passing jobs appear (pagination cursor).",
       "Çoklu sektör işçisi tüm uyan ilanları görür.")
    _e("T-070", "Same for occupations.",
       "Çoklu meslek tüm uyan ilanları görür.")
    _e("T-071", "partial_overlap mode: any overlap counts. Documented in backend/12. Admin diagnostics show mode.",
       "Kısmi örtüşme modu 12-matching-rules.md.")
    _e("T-072", "full_cover mode: worker range must contain the job interval.",
       "Tam kapsama: işçi aralığı ilanı içermeli.")
    _e("T-073", "Overnight intervals normalized (agent-default gap-night-shift). Cross-midnight job matches overnight availability.",
       "Gece vardiyası interval normalize.")
    _e("T-074", "Favorite-employer jobs get a distinct badge/section but still pass hard filters. Boost T-078.",
       "Favori işveren ilanları ayrı gösterilir; hard filter durur.")
    _e("T-075", "favorites_only jobs are omitted for non-audience — not greyed (existence leak). Agent-default gap-favorites-only-job.",
       "Favorilere özel ilan non-audience'a hiç gösterilmez.")
    _e("T-076", "Primary sort includes distance; nearest first when other scores tie per config.",
       "En yakın iş üstte (mesafe sıralaması).")
    _e("T-077", "match score from matched attributes ranks higher. matchReasons[] returned for T-238.",
       "Eşleşme skoru üstte; matchReasons döner.")
    _e("T-078", "Favorite employer is a positive ranking signal, not a hard filter (unless favorites_only).",
       "Favori işveren ranking boost; hard filter değil.")
    _e("T-079", "Sooner start_at ranks higher among eligible jobs.",
       "Tarihi yakın ilan öncelikli.")
    _e("T-080", "Eligible worker POST /api/v1/jobs/:id/applications + Idempotency-Key → 201 pending. Inbox application.received for employer (T-101). Snapshot JSON frozen (gap-application-snapshot).",
       "Uygun başvuru 201 pending; snapshot donar; işveren bildirimi.")
    _e("T-081", "Second apply → 409 ALREADY_APPLIED. Unique (job_id, worker_id). Idempotent same key returns original 201 body.",
       "İkinci başvuru 409 ALREADY_APPLIED.")
    _e("T-082", "Incomplete profile → 422 PROFILE_INCOMPLETE (same as T-029).",
       "Eksik profil 422 PROFILE_INCOMPLETE.")
    _e("T-083", "Expired/unpublished job → 409 APPLICATION_CLOSED.",
       "Süresi geçmiş ilan 409 APPLICATION_CLOSED.")
    _e("T-084", "No remaining seats → 409 APPLICATION_CLOSED (or equivalent domain code).",
       "Kontenjan dolu 409.")
    _e("T-085", "Overlapping pending apply: soft warn on m.worker.jobs.apply-overlap; POST still allowed (agent-default gap-overlap-apply). Second accept is hard-blocked (T-181).",
       "Başvuruda soft warn; ikinci kabul hard block.")
    _e("T-086", "POST /api/v1/applications/:id/withdraw while pending → withdrawn. Accepted withdraw follows shift/token rules, not this path.",
       "Pending withdraw başarılı.")
    _e("T-087", "applications.profile_snapshot JSON frozen at apply. Later PATCH /workers/me does not mutate the snapshot (agent-default).",
       "Başvuru anı snapshot donar; sonraki profil değişmez.")
    _e("T-088", "Job requirement change does not silently invalidate an existing pending application without a documented transition; employer/worker notified if revalidation fails. Snapshot remains for audit.",
       "İlan şartı değişince mevcut başvuru belgelenmiş geçişle ele alınır.")
    _e("T-089", "GET /api/v1/jobs/:id/applications scoped to employer/manager branch. Empty list is 200 []. Worker cannot list others.",
       "Aday listesi işveren/şube kapsamlı; 200 [].")
    _e("T-090", "Query filters (status, rating) applied server-side. No unscoped dump.",
       "Filtre sunucuda; kapsam dışına çıkılmaz.")
    _e("T-091", "POST .../accept → accepted, seat reserved, notify application.accepted (T-097). Remaining headcount decrements.",
       "Kabul accepted + bildirim; kontenjan azalır.")
    _e("T-092", "POST .../reject → rejected, notify application.rejected (T-096).",
       "Red rejected + bildirim.")
    _e("T-093", "When accepted_count == headcount, job stops new applies (T-084) and may auto-close per jobs rules.",
       "Kontenjan dolunca yeni başvuru kapanır.")
    _e("T-094", "Accept when remaining=0 → 409 CONFLICT. No over-accept. Concurrent accepts serialized (T-232).",
       "Kontenjan üstü kabul 409.")
    _e("T-096", "Rejected worker inbox+optional FCM template application.rejected. Wrong user must not receive (T-113). Dedupe T-110.",
       "Red bildirimi doğru işçiye; dedupe_key.")
    _e("T-097", "Accepted worker template application.accepted. Deep link to m.shared.job-process.detail / shift prep.",
       "Onay bildirimi; doğru deep link.")
    _e("T-098", "Revoke accept → worker application.accept_revoked; seat released; tokens per T-154/T-209.",
       "Onay iptali bildirim + koltuk iade.")
    _e("T-099", "Job close notifies accepted workers job.closed_with_accepts; holds released if shift not captured.",
       "İlan kapanınca onaylı işçiler bilgilendirilir.")
    _e("T-100", "Eligible worker gets job.matched outbox+inbox. Fan-out via outbox (Stage A in-process / Stage B BullMQ). No OTP in payload.",
       "job.matched inbox+outbox; PII yok.")
    _e("T-101", "Employer/managers of the branch get application.received.",
       "application.received işveren/manager.")
    _e("T-102", "Same template as T-097; this case is delivery QA for accept.",
       "Onay bildirimi teslim QA.")
    _e("T-103", "Same template as T-096; delivery QA for reject.",
       "Red bildirimi teslim QA.")
    _e("T-104", "Scheduler enqueue shift.confirm_3h at T-3h. High priority. SMS not used.",
       "T-3s shift.confirm_3h yüksek öncelik.")
    _e("T-105", "shift.checkin_due at T-10m. Deep link m.worker.shift.check-in.",
       "T-10dk shift.checkin_due → check-in ekranı.")
    _e("T-106", "rating.pending +24h both sides if attendance confirmed (T-172).",
       "rating.pending +24s her iki taraf.")
    _e("T-107", "job.favorite_employer to workers who favorited the employer, if hard filters pass.",
       "Favori işveren ilanı, filtre geçen işçilere.")
    _e("T-108", "job.favorites_only only to favorites audience. Non-audience: no inbox row.",
       "favorites_only yalnızca kitleye.")
    _e("T-109", "Each template has a screen target in shared/05. Tap uses mobile/03 deep links. Never a dead home dump.",
       "Her şablon doğru ekrana deep link.")
    _e("T-110", "Identical logical event shares dedupe_key; second insert is no-op. Collapse key on FCM.",
       "dedupe_key çift bildirimi önler.")
    _e("T-111", "Push pref off: inbox row still written; FCM not sent. GET /api/v1/notifications returns it.",
       "Push kapalıysa inbox yazılır; FCM gitmez.")
    _e("T-112", "Queue lag: inbox already visible; w.admin.notifications.outbox shows pending. T-231 metrics.",
       "Gecikmede inbox görünür; outbox pending.")
    _e("T-113", "Audience resolved only in Nest. No client-supplied recipient ids. Cross-user GET 403/empty.",
       "Alıcıyı yalnızca Nest seçer.")
    _e("T-114", "Worker sees m.worker.shift.availability-confirm after shift.confirm_3h. GET shift shows confirm_window.",
       "3s kala teyit ekranı açılır.")
    _e("T-115", "POST .../availability-confirm {decision: can_come}. Quiet inbox optional; no spam push. State can_come.",
       "can_come kaydı; spam push yok.")
    _e("T-116", "decision cannot_come → seat released, tokens adjust, notify shift.cannot_come to employer (T-119).",
       "cannot_come koltuk iade + işveren bildirimi.")
    _e("T-117", "After AVAILABILITY_NO_RESPONSE_RELEASE_MINUTES=30, auto-release seat, notify shift.confirm_timeout (agent-default gap-3h-no-response).",
       "30 dk yanıtsızlıkta otomatik koltuk iade.")
    _e("T-118", "can_come → cannot_come allowed inside window; then same as T-116. Reverse after release follows product lock.",
       "Pencere içinde can_come→cannot_come T-116 gibi.")
    _e("T-119", "Employer/managers receive shift.cannot_come. Worker-specific, not a bulk wrong user (T-121).",
       "İşveren cannot_come bilgisini alır.")
    _e("T-121", "One cannot_come among N: only that seat releases; others remain held. One notify per cancelling worker.",
       "Kısmi iptalde yalnızca o koltuk iade; N-1 hold kalır.")
    _e("T-122", "If job starts in <3h, scheduler fires confirm ASAP (same template). Window shortened, not skipped silently.",
       "Son dakika ilanda 3s akışı hemen tetiklenir.")
    _e("T-123", "shift.checkin_due delivered; deep link check-in. Case is e2e with running API + sandbox FCM.",
       "10 dk kala check-in bildirimi.")
    _e("T-124", "Worker CTA on m.worker.shift.check-in sends POST .../check-in with lat/lng/accuracy. Not a client-set hired flag.",
       "İşe geldim = check-in POST; istemci status yazmaz.")
    _e("T-125", "Inside radius + window + accuracy → 200; shift checked_in; capture path T-156. Employer notify T-133.",
       "Geofence içi 200; check-in başarılı.")
    _e("T-126", "Outside radius → 422 OUTSIDE_GEOFENCE. Offer dispute (T-135). No capture.",
       "Dışarıda 422 OUTSIDE_GEOFENCE; capture yok.")
    _e("T-127", "accuracy worse than geofence.max_accuracy_m uses soft radius or reject per backend/13. Not an automatic pass.",
       "GPS sapması config'e göre soft/reject.")
    _e("T-128", "Retry with same Idempotency-Key returns original result (success or error). No double check-in row.",
       "Aynı Idempotency-Key çift check-in yazmaz.")
    _e("T-129", "Before checkin.early_minutes → 422 CHECKIN_WINDOW_CLOSED.",
       "Erken check-in 422 CHECKIN_WINDOW_CLOSED.")
    _e("T-130", "After checkin.late_minutes → 422 CHECKIN_WINDOW_CLOSED. Manual confirm remains (T-134).",
       "Geç check-in 422; manuel yol açık.")
    _e("T-131", "Android mock flag → fail + risk_score event (agent-default gap-mock-gps). Admin w.admin.risk.queue. No capture.",
       "Sahte GPS fail + risk; capture yok.")
    _e("T-132", "Missing permission: client blocks CTA; if API called without coords → 400 VALIDATION_FAILED. Registration still OK (T-009).",
       "İzin yokken check-in 400/CTA engel; kayıt etkilenmez.")
    _e("T-133", "On success, employer/managers shift.worker_checked_in. Inbox + optional FCM.",
       "İşveren check-in bildirimi alır.")
    _e("T-134", "POST /api/v1/shifts/:id/manual-confirm by employer/manager on w.employer.shift.attendance / m.employer.shift.manual-confirm. Capture path. Notify shift.manual_confirmed.",
       "Manuel confirm capture + bildirim.")
    _e("T-135", "POST /api/v1/shifts/:id/disputes from m.worker.shift.dispute after geofence fail. Queued on w.admin.disputes.queue. Notify shift.dispute_update.",
       "İtiraz dispute API + admin kuyruğu.")
    _e("T-136", "Geofence center = branches.lat/lng, not worker home pin.",
       "Geofence merkezi şube koordinatı.")
    _e("T-137", "Wrong stored coords fail honest workers → dispute/manual path; admin/branch form must show coords. Validation on write (T-036).",
       "Yanlış şube koordinatı tespit/düzeltme.")
    _e("T-138", "geofence.radius_m=50: 49m pass, 51m fail (plus accuracy).",
       "50m yarıçap: içerisi geç, dışarısı fail.")
    _e("T-139", "radius_m=100 analog.",
       "100m yarıçap analog.")
    _e("T-140", "Indoor: soft_radius_m may accept with review flag — not unlimited.",
       "Kapalı alan soft radius; sınırsız değil.")
    _e("T-141", "Mall: same softness policy as T-140.",
       "AVM aynı yumuşaklık politikası.")
    _e("T-142", "High-rise: accuracy/soft radius; still mock-GPS fail.",
       "Plaza senaryosu; sahte GPS yine fail.")
    _e("T-143", "Rural: max_accuracy_m may be raised via w.admin.config.remote; still GPS-based.",
       "Kırsal doğruluk eşiği config.")
    _e("T-144", "Agent-default gap-wifi-location: network/Wi-Fi must NOT alone pass geofence. GPS-only hard decision.",
       "Wi-Fi/network tek başına geofence geçirmez; GPS-only.")
    _e("T-145", "Moving sample: require stable fix or short dwell per backend/13. Speed/jump may reject.",
       "Hareket halinde stabilize örnek gerekir.")
    _e("T-146", "v1 foreground-only check-in. Background loc not required. location.require_background=false.",
       "v1 arka plan konumu zorunlu değil.")
    _e("T-147", "Both iOS and Android (ADR-0029). Permission copy and accuracy APIs documented in PLATFORM.md. Same REST contract.",
       "iOS ve Android aynı REST; izin metinleri ayrı.")
    _e("T-148", "Fake-GPS tooling: mock flag / impossible jump → risk event T-131. Admin risk queue.",
       "Sahte GPS aracı risk kuyruğu.")
    _e("T-149", "available >= headcount: publish 201, hold created, job published.",
       "Yeterli jetonla yayın + hold.")
    _e("T-150", "available < headcount: 422 TOKEN_INSUFFICIENT, no publish.",
       "Yetersiz jeton 422; yayın yok.")
    _e("T-151", "token_holds.amount == headcount. Ledger entry type hold.",
       "Hold miktarı = personel sayısı.")
    _e("T-152", "Cancel open job → releaseHold. Balance restored. No capture.",
       "İlan iptali hold iade.")
    _e("T-153", "No applicants at close/expiry → release remaining holds.",
       "Başvurusuz kapanışta iade.")
    _e("T-154", "Applicants but zero accepts at close → release.",
       "Onaysız kapanışta iade.")
    _e("T-155", "Accepted no-show: release hold (no capture) unless a documented penalty ADR supersedes. Do not capture on mock GPS.",
       "No-show'da hold iade (ceza ADR'siz capture yok).")
    _e("T-156", "Successful check-in/manual confirm → captureForShift 1. Ledger capture. Hold reduced.",
       "Check-in capture 1 jeton.")
    _e("T-157", "Multi-headcount: capture attendees only; release unused seats (T-225).",
       "Kısmi gelişte kısmi capture.")
    _e("T-158", "Headcount++ → additional hold or 422 TOKEN_INSUFFICIENT.",
       "Artışta ek hold veya 422.")
    _e("T-159", "Headcount-- → release excess; cannot drop below accepted.",
       "Azalışta iade; kabul altına inilmez.")
    _e("T-160", "Same Idempotency-Key retries return stored response. No double hold/capture. 409 HOLD_EXISTS / CONFLICT on key+body mismatch.",
       "Idempotency çift düşüşü engeller.")
    _e("T-161", "Failed sandbox PSP / cancelled top-up: job remains draft; no hold. m.employer.tokens.top-up. Real ledger only (no fake success).",
       "Başarısız ödemede ilan taslak; sahte success yok.")
    _e("T-162", "GET /api/v1/employers/me/tokens/ledger lists hold/capture/release/top_up. Admin w.admin.tokens.ledger.",
       "Ledger geçmişi hold/capture/release/top_up.")
    _e("T-163", "GET tokens after each mutation matches ledger sum. UI m.employer.tokens.root refreshes; SSE optional.",
       "Anlık bakiye ledger ile tutarlı.")
    _e("T-164", "POST /api/v1/favorites {type:worker, id}. Directional employer→worker. Visible m.employer.favorites.workers.",
       "İşveren→işçi favori yönlüdür.")
    _e("T-165", "Worker→employer favorite. m.worker.favorites.list.",
       "İşçi→işveren favori ayrı kenar.")
    _e("T-166", "A→B does not imply B→A. Feed boost only for the stored direction.",
       "Tek yön diğer yönü yaratmaz.")
    _e("T-167", "Mutual = two rows, not a merged pair entity. Removing one leaves the other.",
       "Karşılıklı iki satırdır; biri silinince diğeri kalır.")
    _e("T-168", "Job favorites_only=true requires employer favorites audience (T-056).",
       "Favorilere özel ilan bayrağı.")
    _e("T-169", "Only favorited workers see it on GET /jobs/feed (T-075).",
       "Yalnızca favori işçiler görür.")
    _e("T-170", "Appears on worker favorites / dedicated section without leaking to others.",
       "Favoriler yüzeyinde görünür.")
    _e("T-171", "DELETE favorite → worker loses exclusive job on next feed (re-index). In-flight applications follow T-088.",
       "Favoriden çıkınca özel ilan erişimi kalkar.")
    _e("T-172", "rating.pending 24h after attendance-confirmed shift. Both sides. Template same as T-106.",
       "+24s değerlendirme bildirimi.")
    _e("T-173", "Worker POST /api/v1/ratings targeting employer/branch for that shift. Window enforced.",
       "İşçi işvereni puanlar; pencere sunucuda.")
    _e("T-174", "Employer/manager rates worker. Scope: own shift only.",
       "İşveren işçiyi puanlar; kapsam kendi vardiyası.")
    _e("T-175", "Comment stored; returned on GET. Subject to T-176 filter.",
       "Yorum kaydolur; filtre T-176.")
    _e("T-176", "Word-list hit → queued for w.admin.ratings.queue (agent-default gap-profanity-filter). May 400 or accept-and-hold.",
       "Hakaret listesi admin kuyruğuna düşer.")
    _e("T-177", "Second POST same (shift, author, target) → 409 CONFLICT.",
       "Aynı vardiya ikinci puan 409.")
    _e("T-178", "No-show: rating window may be skipped or limited per ratings rules — no prompt as if attended (T-179 related).",
       "Gelmeyen için normal değerlendirme penceresi açılmaz.")
    _e("T-179", "Cancelled job/shift does not enqueue rating.pending.",
       "İptal işte rating.pending yok.")
    _e("T-180", "Average = mean of visible ratings; hidden/queued excluded until approved. Shown on profiles.",
       "Ortalama görünür puanların ortası.")
    _e("T-181", "Second overlapping accept → 409 CONFLICT (hard block). First remains. Agent-default gap-overlap-apply.",
       "Çakışan ikinci kabul 409 hard block.")
    _e("T-182", "Repeated can_come + no-show increments worker risk_counters; listed on w.admin.risk.queue (gap-attendance-fraud).",
       "Sürekli gelmeme risk sayacı.")
    _e("T-183", "Repeated last-minute employer cancel increments employer risk; admin list.",
       "İşveren son dakika iptal riski.")
    _e("T-184", "Device id hashed on OTP verify (agent-default gap-device-fingerprint). Multi-account same hash → risk alert, not silent allow.",
       "Aynı cihaz hash'i risk uyarısı.")
    _e("T-185", "Unverified/banned employer cannot publish (T-015). Admin can force-close. Moderation report POST /api/v1/moderation/reports.",
       "Sahte ilan yayın kapısı + moderation.")
    _e("T-186", "Apply/OTP rate limits 429 RATE_LIMITED. CAPTCHA Hold until evidence (gap-bot-protection).",
       "Bot başvuru 429; CAPTCHA Hold.")
    _e("T-187", "Self-rating / sockpuppet patterns queued. Unique shift rating still T-177.",
       "Puan manipülasyonu kuyruk + unique kural.")
    _e("T-188", "Mock GPS check-in must not capture tokens (T-131+T-156). Ledger unchanged.",
       "Sahte konumla jeton düşmez.")
    _e("T-189", "Employer cannot mark checked-in worker as no-show without dispute trail; worker can report. Tokens stay captured.",
       "Check-in olmuş işçiyi gelmedi göstermek audit/dispute ister.")
    _e("T-190", "Check-in without passing geofence does not set attended. T-126/T-131.",
       "Sahada olmadan check-in attended yazmaz.")
    _e("T-191", "Age stored; lying does not bypass job filter if birthdate/verification exists. Abuse report path. gap-profile-demographics.",
       "Yaş beyanı eşleşme filtresini client'dan aşamaz.")
    _e("T-192", "auth_bans on phone (and tax_id) checked at OTP verify (gap-ban-reentry). 403 FORBIDDEN. Device hash when present.",
       "Yasaklı telefon/vergi OTP verify'da 403.")
    _e("T-193", "Journey 1 step 1: worker OTP session + worker role + onboarding started (cases/02-e2e-journeys.md).",
       "Yolculuk 1: işçi OTP + rol.")
    _e("T-194", "Employer OTP + POST /api/v1/employers + verification pending or staging bypass.",
       "Yolculuk 1: işveren org oluşur.")
    _e("T-195", "Branch with valid coordinates.",
       "Yolculuk 1: şube koordinatlı.")
    _e("T-196", "Job published; token hold = headcount.",
       "Yolculuk 1: ilan + hold.")
    _e("T-197", "GET /jobs/feed for the matching worker includes the job; non-matching worker omits it.",
       "Yolculuk 1: uygun işçi feed'de görür.")
    _e("T-198", "POST apply 201 pending.",
       "Yolculuk 1: başvuru pending.")
    _e("T-199", "POST accept; notify worker.",
       "Yolculuk 1: kabul + bildirim.")
    _e("T-200", "availability-confirm can_come.",
       "Yolculuk 1: can_come.")
    _e("T-201", "On-site check-in POST.",
       "Yolculuk 1: check-in isteği.")
    _e("T-202", "Geofence pass.",
       "Yolculuk 1: geo geçti.")
    _e("T-203", "Hold → capture 1.",
       "Yolculuk 1: jeton capture.")
    _e("T-204", "Rating window opens per schedule; both can POST /ratings.",
       "Yolculuk 1: değerlendirme penceresi.")
    _e("T-205", "Journey 2 starts with an accepted worker (after T-199 equivalent).",
       "Yolculuk 2: işçi accepted.")
    _e("T-206", "cannot_come at 3h window.",
       "Yolculuk 2: cannot_come.")
    _e("T-207", "Employer shift.cannot_come inbox+push.",
       "Yolculuk 2: işveren bildirimi.")
    _e("T-209", "Hold released; no capture.",
       "Yolculuk 2: hold iade, capture yok.")
    _e("T-210", "Worker on site (fixture coords inside intended radius, GPS still fail next step).",
       "Yolculuk 3: işçi sahada.")
    _e("T-211", "Check-in 422 OUTSIDE_GEOFENCE or accuracy fail.",
       "Yolculuk 3: GPS fail.")
    _e("T-212", "POST disputes; m.worker.shift.dispute.",
       "Yolculuk 3: itiraz açılır.")
    _e("T-213", "Employer manual-confirm 200.",
       "Yolculuk 3: manuel confirm.")
    _e("T-214", "Capture (or documented release) matches manual confirm policy.",
       "Yolculuk 3: jeton kararı manuel politikaya uyar.")
    _e("T-215", "Employer favorites worker.",
       "Yolculuk 4: favori kenarı.")
    _e("T-216", "favorites_only job published.",
       "Yolculuk 4: yalnızca favoriler ilanı.")
    _e("T-217", "Favorited worker sees it; another eligible worker does not.",
       "Yolculuk 4: yalnızca o işçi görür.")
    _e("T-218", "Apply + accept complete.",
       "Yolculuk 4: başvuru ve onay.")
    _e("T-219", "Job headcount=5 published.",
       "Yolculuk 5: 5 kişilik ilan.")
    _e("T-220", "Hold amount 5.",
       "Yolculuk 5: 5 jeton hold.")
    _e("T-221", ">=5 eligible applies pending.",
       "Yolculuk 5: başvurular.")
    _e("T-222", "Exactly 5 accepts; 6th 409 (T-094).",
       "Yolculuk 5: 5 kabul; 6. 409.")
    _e("T-223", "1 cannot_come or withdraw-after-accept releases 1 seat/hold.",
       "Yolculuk 5: 1 iptal 1 hold iade.")
    _e("T-225", "4 check-ins → capture 4, not 5. Remaining hold released.",
       "Yolculuk 5: capture = gelen sayısı.")
    _e("T-226", "k6 fan-out job.matched; outbox drain; no UX change. Metrics on w.admin.perf.metrics. Inbox still correct.",
       "Binlerce job.matched outbox; metrik admin.")
    _e("T-227", "Concurrent apply: unique constraint + idempotency; no over-capacity.",
       "Eşzamanlı başvuru unique + kapasite.")
    _e("T-228", "Feed p95 within proposed SLO (05-quality-nfr.md). Matching stays server-side.",
       "Eşleşme yük altında sunucuda; p95 SLO.")
    _e("T-229", "Employer jobs list cursor/offset stays responsive for many branches.",
       "Çok şubeli işveren listesi.")
    _e("T-230", "Concurrent check-in geofence decisions correct; no deadlock with T-234.",
       "Yoğun check-in doğru karar.")
    _e("T-231", "Outbox lag visible on w.admin.devops.services / perf metrics; inbox already written (T-112).",
       "Kuyruk gecikmesi görünür; inbox yazılı.")
    _e("T-232", "Parallel hold/capture/release with idempotency keys: serializable ledger, one winner.",
       "Jeton eşzamanlılığı tek kazanan.")
    _e("T-233", "Retries do not duplicate inbox/ledger/applications.",
       "Yük altında duplicate side-effect yok.")
    _e("T-234", "Contended token_accounts row uses transactional updates; no deadlock failures in the test window (or retry succeeds).",
       "Ledger kilitlenmesi test penceresinde yok / retry başarılı.")
    _e("T-235", "m.auth.tutorial + phone OTP first-run against DESIGN.md tokens (cream/forest/orange). No purple-glow.",
       "İlk açılış DESIGN.md; mor glow yok.")
    _e("T-236", "Onboarding wizard Back restores fields (ADR-0020). Duration subjectively acceptable; progressive PATCH /workers/me.",
       "Profil sihirbazı Back korur; kademeli PATCH.")
    _e("T-237", "create-job wizard R3; token hold explained before publish (T-243). Draft survives kill.",
       "İlan sihirbazı anlaşılır; taslak yaşar.")
    _e("T-238", "Feed shows matchReasons[]; empty/loading/error states. Not a raw dump.",
       "Feed nedenleri ve boş/yükleniyor/hata.")
    _e("T-239", "m.shared.job-process.detail timeline readable; statuses from server enum, i18n tr-TR.",
       "Başvuru durumu timeline; i18n.")
    _e("T-240", "Check-in window copy (early/late) matches server config; countdown honest.",
       "Check-in zamanı kopyası config ile aynı.")
    _e("T-241", "Location permission requested at check-in need, not at register (T-009). Copy explains attendance purpose (KVKK).",
       "Konum izni check-in'de; kayıtta zorunlu değil.")
    _e("T-242", "Favorites list empty/error/loading; directional meaning clear (T-166).",
       "Favoriler boş/hata; yönlü anlam net.")
    _e("T-243", "m.employer.tokens.root / w.public.pricing explain hold vs capture vs release. No silent debit.",
       "Jeton hold/capture açıklanır.")
    _e("T-244", "GET another user's /workers/me or documents → 403 FORBIDDEN / 404. Lists scoped in SQL.",
       "Başkasının kaynağı 403/404; SQL scope.")
    _e("T-245", "Employer A cannot GET job of employer B applicants. Manager limited to branchIds.",
       "İşveren yalnızca kendi adaylarını görür.")
    _e("T-246", "No JWT → 401 UNAUTHORIZED. Wrong role → 403. IDOR attempts do not leak bodies.",
       "Yetkisiz API 401/403; body sızmaz.")
    _e("T-247", "Refresh rotation; reuse of old refresh revokes sid family (backend/21). Access in query/deeplink forbidden. m.shared.system.session-expired.",
       "Refresh rotation; reuse aile iptali.")
    _e("T-248", "v1 OTP-only (gap-password). Skip password-reset tests. Do not add /auth/password/reset.",
       "v1 şifre reset yok; @T-248 skip.")
    _e("T-249", "Documents via short-lived signed GET; raw object URL 403. Other users 403. w.admin.documents.queue for ops.",
       "Belgeler imzalı URL; public 403.")
    _e("T-250", "Persist check-in event points only, not tracks. Retention 90 days then anonymize (backend/17). Purpose attendance.",
       "Konum iz değil nokta; 90 gün anonimleştirme.")
    _e("T-251", "OTP, full phone, precise home geo not in push trays or list cards. error.message has no stack/SQL.",
       "Push/listede OTP/telefon/hassas geo yok.")
    _e("T-252", "Logs, BullMQ payloads, devops error samples redact phone/OTP/tokens. Fixture scan in CI. Legal audit is separate table (ADR-0037).",
       "Log/job payload PII içermez; legal audit ayrı.")


load_expected()
assert len(EXP) == 248, len(EXP)
assert set(EXP) == set(TITLE_EN), set(TITLE_EN) ^ set(EXP)


def parse_rest(group_code: str, cid: str) -> list[dict]:
    x = CASE_X.get(cid, {})
    raw = x.get("rest") or GROUP_ARCH[group_code]["rest"]
    out = []
    for item in raw:
        method, path = item.split(" ", 1)
        out.append({"method": method, "path": path})
    return out


def steps_for(cid: str, group: str, title_en: str, title_tr: str, rest: list[dict], screens: list[str], errors: list[str], disp: str) -> tuple[list[str], list[str], str, str]:
    """Architecture-specific steps (EN, TR) + preconditions."""
    r0 = f"{rest[0]['method']} {rest[0]['path']}" if rest else "the group REST resource"
    s0 = screens[0] if screens else "the mapped screen"
    err = errors[0] if errors else None
    skip = disp == "skip"

    pre_en = (
        f"Postgres test DB is migrated. SMS/FCM sandbox env is set (boot fails if missing). "
        f"Nest `/api/v1` is the only client API. Case `{cid}` ({title_en}) in `{group}`. "
        f"Primary UI `{s0}`; primary REST `{r0}`. Envelope ADR-0027. Role/scope AuthZ on."
    )
    pre_tr = (
        f"Postgres test DB migrate edilmiş; SMS/FCM sandbox env zorunlu. "
        f"İstemci yalnızca Nest `/api/v1`. Vaka `{cid}` ({title_tr}), grup `{group}`. "
        f"Birincil ekran `{s0}`; REST `{r0}`. Zarf ADR-0027. AuthZ açık."
    )
    if skip:
        steps_en = [
            f"Confirm agent-default skip for `{cid}` in agents/02-defaults-and-non-asks.md.",
            "Do not add banned email/password (or other Hold) routes to fake a pass.",
            "Tag the automated test `@T-xxx skip` with the gap id until an ADR supersedes.",
        ]
        steps_tr = [
            f"`{cid}` için agents/02 skip/Hold satırını doğrula.",
            "Geçmek için yasaklı e-posta/şifre (veya Hold) rotası ekleme.",
            "Otomatik testi gap id ile skip et; ADR gelene kadar.",
        ]
        return steps_en, steps_tr, pre_en, pre_tr

    steps_en = [
        f"Seed the minimum Postgres rows for `{cid}` (users/memberships/jobs/shifts as the group requires). No Firebase fixtures.",
        f"Open `{s0}` on the channel under test (mobile iOS+Android and/or web/admin as mapped).",
        f"Exercise `{title_en}` through `{r0}` (and follow-up group REST). Send `Authorization: Bearer` and `Idempotency-Key` on critical POSTs.",
        "Assert HTTP + envelope `{data,meta}` or `{error,meta}` with stable English `error.code` and localized `error.message`.",
        "Assert the Postgres invariant (row, unique constraint, ledger, outbox, or scoped list) — not a client-only flag.",
    ]
    if err:
        steps_en.append(f"On the negative path, expect `{err}` (see shared/12-api-contracts.md).")
    steps_en.append("If the case notifies, assert inbox row + outbox `dedupe_key` (FCM sandbox optional when prefs off).")
    steps_tr = [
        f"`{cid}` için minimum Postgres satırlarını hazırla (Firebase fixture yok).",
        f"Eşlenen kanalda `{s0}` ekranını aç (iOS+Android ve/veya web/admin).",
        f"`{title_tr}` davranışını `{r0}` ve grup REST'i ile çalıştır. Kritik POST'ta Idempotency-Key kullan.",
        "HTTP + zarfı doğrula; `error.code` İngilizce, `error.message` tr-TR.",
        "Postgres invariant'ını doğrula (satır, unique, ledger, outbox, scoped liste) — yalnız istemci bayrağı değil.",
    ]
    if err:
        steps_tr.append(f"Negatif yolda `{err}` bekle (shared/12-api-contracts.md).")
    steps_tr.append("Bildirim varsa inbox + outbox `dedupe_key` doğrula (push kapalıysa FCM zorunlu değil).")
    return steps_en, steps_tr, pre_en, pre_tr


def build_catalogs() -> tuple[dict, dict]:
    src = json.loads(SRC.read_text())
    matrix = parse_matrix(MATRIX.read_text())
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    meta_common = {
        "schema_version": "2.0.0-newarch",
        "architecture": "PartonNewArch",
        "source_catalog": "parton_case_tests_tr.json",
        "total_cases": 248,
        "total_groups": 19,
        "absent_ids": ["T-095", "T-120", "T-208", "T-224"],
        "api_base": "/api/v1",
        "stack": "NestJS 12 modular monolith + PostgreSQL + REST + Zod api-contracts + bare React Native iOS/Android + Vite admin",
        "auth": "Phone OTP + JWT (OTP-only v1; no email/password)",
        "envelope": {"success": "{data, meta}", "error": "{error: {code, message, details?}, meta}"},
        "generated_utc": now,
        "grounding_docs": [
            "backend/04-domain-modules.md",
            "shared/12-api-contracts.md",
            "agents/02-defaults-and-non-asks.md",
            "cases/00-coverage-matrix.md",
            "cases/02-e2e-journeys.md",
            "web/08-admin-case-coverage.md",
        ],
    }

    def empty_root(lang: str) -> dict:
        if lang == "en":
            return {
                "metadata": {
                    **meta_common,
                    "file_name": "parton_case_tests_newarch_en.json",
                    "catalog_name": "PartOn NewArch test-case catalog",
                    "language": "en",
                    "document_language": "English",
                    "usage_note": "Architecture-mapped acceptance catalog. Keep case_id and group_code stable. UI copy under test remains tr-TR primary; this file is the English scenario SoR for NewArch.",
                },
                "field_glossary": {
                    "case_id": "Stable catalog id (T-###). Do not rename.",
                    "group_code": "CASE-* group code.",
                    "title": "English scenario title.",
                    "precondition": "Data, roles, and env that must exist first.",
                    "steps": "Architecture-specific actions (REST + screens).",
                    "expected_result": "Pass criteria including HTTP, error.code, Postgres, notify.",
                    "architecture": "Nest modules, REST, screens, error codes, gaps, agent defaults.",
                },
                "priority_values": {
                    "critical": "Breaks core product, money/tokens, security, or a hard business rule.",
                    "high": "Serious impact on a primary flow or UX.",
                    "medium": "Required functional or quality coverage.",
                    "low": "Supporting or secondary verification.",
                },
                "test_type_values": {
                    "functional": "Single feature behavior.",
                    "business_rule": "Domain rule.",
                    "end_to_end": "Cross-module user journey.",
                    "negative": "Abuse or must-block path.",
                    "performance": "Load, latency, concurrency.",
                    "usability": "UI/UX understandability and feedback.",
                    "security": "AuthZ, data protection, session, PII.",
                },
                "groups": [],
            }
        return {
            "metadata": {
                **meta_common,
                "file_name": "parton_case_tests_newarch_tr.json",
                "catalog_name": "PartOn NewArch test vaka kataloğu",
                "language": "tr",
                "document_language": "Türkçe",
                "usage_note": "Yeni mimariye bağlanmış kabul kataloğu. vaka_id ve grup_kodu sabit. UI copy tr-TR birincil kalır; senaryo adımları Nest REST + ekran ID'lerine bağlanmıştır.",
            },
            "field_glossary": {
                "vaka_id": "Stabil katalog kimliği (T-###). Yeniden adlandırma.",
                "grup_kodu": "CASE-* grup kodu.",
                "baslik": "Türkçe senaryo başlığı.",
                "on_kosul": "Önce hazır olması gereken veri, rol ve ortam.",
                "adim_ozeti": "Mimariye özel adımlar (REST + ekranlar).",
                "beklenen_sonuc": "HTTP, error.code, Postgres, bildirim geçiş kriteri.",
                "mimari": "Nest modülleri, REST, ekranlar, hata kodları, gap ve agent-default.",
            },
            "oncelik_degerleri": src["oncelik_degerleri"],
            "test_turu_degerleri": src["test_turu_degerleri"],
            "gruplar": [],
        }

    en_root = empty_root("en")
    tr_root = empty_root("tr")

    for g in src["gruplar"]:
        code = g["grup_kodu"]
        garch = GROUP_ARCH[code]
        gname_en, gdesc_en = GROUP_EN[code]
        en_group = {
            "group_code": code,
            "group_name": gname_en,
            "description": gdesc_en,
            "case_count": g["vaka_sayisi"],
            "nest_modules": garch["nest_modules"],
            "rest_resources": garch["rest"],
            "screens": garch["screens"],
            "admin_screens": garch["admin_screens"],
            "docs": garch["docs"],
            "cases": [],
        }
        tr_group = {
            "grup_kodu": code,
            "grup_adi": g["grup_adi"],
            "aciklama": g["aciklama"] + " NewArch: Nest modülleri " + ", ".join(garch["nest_modules"]) + ".",
            "vaka_sayisi": g["vaka_sayisi"],
            "nest_modulleri": garch["nest_modules"],
            "rest_kaynaklari": garch["rest"],
            "ekranlar": garch["screens"],
            "admin_ekranlari": garch["admin_screens"],
            "dokumanlar": garch["docs"],
            "vakalar": [],
        }

        for v in g["vakalar"]:
            cid = v["vaka_id"]
            x = CASE_X.get(cid, {})
            mx = matrix.get(cid, {})
            disp = x.get("disp", "implement")
            rest = parse_rest(code, cid)
            screens = x.get("screens") or garch["screens"]
            errors = x.get("errors") or []
            notify = x.get("notify")
            gap = x.get("gap") or mx.get("gap_tag")
            default = x.get("default")
            http = x.get("http")
            arch_status = mx.get("arch_status", "partial")
            title_en = TITLE_EN[cid]
            title_tr = v["baslik"]
            steps_en, steps_tr, pre_en, pre_tr = steps_for(
                cid, code, title_en, title_tr, rest, screens, errors, disp
            )
            exp_en, exp_tr = EXP[cid]
            p_en, p_en_l, p_tr_l = PRIO[v["oncelik"]]
            t_en, t_en_l, t_tr_l = TTYPE[v["test_turu"]]
            sub_tr = v.get("alt_bolum")
            sub_en = SUBSECTION_EN.get(sub_tr) if sub_tr else None
            signals = list(v.get("arama_sinyalleri") or [])
            for extra in (
                code.lower(),
                "nestjs",
                "postgres",
                "/api/v1",
                *[s.replace("m.", "screen:") for s in screens[:3]],
            ):
                if extra not in signals:
                    signals.append(extra)

            arch_block = {
                "disposition": disp,
                "arch_status": arch_status,
                "gap_tag": gap,
                "agent_default": default,
                "nest_modules": mx.get("modules") or garch["nest_modules"],
                "rest": rest,
                "screens": screens,
                "admin_screens": garch["admin_screens"],
                "error_codes": errors,
                "success_http": 200 if not http else (200 if http < 400 else None),
                "error_http": http if http and http >= 400 else None,
                "notify_template": notify,
                "postgres_tables": garch["tables"],
                "test_layers": garch["layers"],
                "docs": garch["docs"],
                "channel": "mobile+web+admin" if code != "CASE-PERF" else "admin+backend",
            }

            en_group["cases"].append(
                {
                    "case_id": cid,
                    "original_case_id": v["orijinal_vaka_id"],
                    "group_code": code,
                    "module": gname_en,
                    "section": gname_en,
                    "subsection": sub_en,
                    "title": title_en,
                    "precondition": pre_en,
                    "steps": steps_en,
                    "expected_result": exp_en,
                    "priority": p_en,
                    "priority_label": p_en_l,
                    "test_type": t_en,
                    "test_type_label": t_en_l,
                    "search_signals": signals,
                    "architecture": arch_block,
                    "edit": {
                        "status": "skipped" if disp == "skip" else "active",
                        "notes": f"agent-default: {default}" if default else "",
                        "source_title_tr": title_tr,
                    },
                }
            )
            tr_group["vakalar"].append(
                {
                    "vaka_id": cid,
                    "orijinal_vaka_id": v["orijinal_vaka_id"],
                    "grup_kodu": code,
                    "modul": g["grup_adi"],
                    "bolum": v["bolum"],
                    "alt_bolum": sub_tr,
                    "baslik": title_tr,
                    "on_kosul": pre_tr,
                    "adim_ozeti": steps_tr,
                    "beklenen_sonuc": exp_tr,
                    "oncelik": v["oncelik"],
                    "oncelik_etiketi": p_tr_l,
                    "test_turu": v["test_turu"],
                    "test_turu_etiketi": t_tr_l,
                    "arama_sinyalleri": signals,
                    "mimari": {
                        "uygulama": disp,
                        "arch_durum": arch_status,
                        "gap_etiketi": gap,
                        "agent_default": default,
                        "nest_modulleri": arch_block["nest_modules"],
                        "rest": rest,
                        "ekranlar": screens,
                        "admin_ekranlari": garch["admin_screens"],
                        "hata_kodlari": errors,
                        "error_http": arch_block["error_http"],
                        "bildirim_sablonu": notify,
                        "postgres_tablolari": garch["tables"],
                        "test_katmanlari": garch["layers"],
                        "dokumanlar": garch["docs"],
                    },
                    "duzenleme": {
                        "durum": "atlandi" if disp == "skip" else "aktif",
                        "guncellenecek_mi": False,
                        "notlar": f"agent-default: {default}" if default else "NewArch REST/ekran bağlandı",
                        "ek_adimlar": [],
                        "ek_beklenen_sonuclar": [],
                        "ek_arama_sinyalleri": [],
                    },
                }
            )

        en_root["groups"].append(en_group)
        tr_root["gruplar"].append(tr_group)

    return tr_root, en_root


def main() -> None:
    tr, en = build_catalogs()
    OUT_TR.write_text(json.dumps(tr, ensure_ascii=False, indent=2) + "\n")
    OUT_EN.write_text(json.dumps(en, ensure_ascii=False, indent=2) + "\n")
    n_tr = sum(len(g["vakalar"]) for g in tr["gruplar"])
    n_en = sum(len(g["cases"]) for g in en["groups"])
    skips = [c["case_id"] for g in en["groups"] for c in g["cases"] if c["architecture"]["disposition"] == "skip"]
    print(f"wrote {OUT_TR} ({n_tr} cases)")
    print(f"wrote {OUT_EN} ({n_en} cases)")
    print("skip:", skips)
    assert n_tr == n_en == 248
    assert skips == ["T-002", "T-008", "T-248"]


if __name__ == "__main__":
    main()
