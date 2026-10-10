# 02 — UI component inventory (case-driven)

**Visual SoR:** [`../DESIGN.md`](../DESIGN.md) §4 · ADR-0039  

**Status:** `accepted` (required set)  
**Last updated:** 2026-10-09  
**Mandate:** [`../cases/03-ui-coverage-mandate.md`](../cases/03-ui-coverage-mandate.md)  
**Color tokens:** [`01-color-system.md`](01-color-system.md)  
**Stacks:** Mobile NativeWind · Admin/Web shadcn

> Every case-driven interaction must be built from **named components** below (or explicit composites of them). Do not bury one-off UI in screens without extracting a reusable name when the catalog repeats the pattern.

---

## Cross-cutting (both platforms)

| Component | Role | Cases / groups |
| --- | --- | --- |
| `EmptyState` | No data / filtered out | MATCHING, APPLICATION, UX |
| `SkeletonList` | Loading | UX, PERF perception |
| `FormErrorBanner` / `FieldError` | Validation | AUTH, profiles, jobs |
| `ConfirmDialog` | Destructive / accept | REVIEW, ABUSE, TOKEN |
| `StatusBadge` | Application/job/shift states | APPLICATION, E2E |
| `PermissionExplainer` | OS permission copy | LOCATION, NOTIFICATIONS |
| `ForbiddenState` | 403 / wrong tenant | SECURITY |
| `SessionExpiredModal` | Re-auth | T-247 |
| `TokenExplainer` | What tokens mean | TOKEN, UX T-239–ish |
| `PrimaryButton` / `SecondaryButton` | CTA hierarchy | color system actions |
| `FeedbackToast` | success/warn/error | feedback tokens |

---

## Auth & account

| Component | Mobile | Web/Admin | Cases |
| --- | --- | --- | --- |
| `PhoneField` | ✓ | ✓ | T-001–007 |
| `OtpInput` | ✓ | ✓ | T-005–007 |
| `LockoutTimer` | ✓ | ✓ | T-007 |
| `PolicyAcceptList` | ✓ | ✓ | policies |
| `RoleCard` / `RoleSelect` | ✓ | — | role select |
| `ContextSwitcher` | ✓ | ✓ (if multi) | AS-3 / multi-role |
| `PasswordFields` | ✓* | ✓* | T-008, T-248 |
| `LogoutConfirm` | ✓ | ✓ | T-247 |

---

## Worker profile & availability

| Component | Cases |
| --- | --- |
| `AvailabilityWeekGrid` | T-016–019 |
| `TimeRangeEditor` (+ night/cross-midnight) | T-017–019, T-073 |
| `SectorChipMulti` / `OccupationPicker` | T-020–021 |
| `HomePinMap` | T-025–026 |
| `DemographicsFields` (age/gender) | T-027–028, T-044 |
| `ProfileCompletionMeter` | T-010, T-082 |
| `DocumentTypePicker` / `DocumentUploadSlot` | T-022–024, T-249 |

---

## Employer / branch / job

| Component | Cases |
| --- | --- |
| `BranchForm` + `BranchMapPin` | T-031–036 |
| `ManagerInviteCode` | manager join |
| `IndustryMultiSelect` | employer industries |
| `WizardShell` / `WizardStepHeader` / `WizardFooter` | All R3 wizards — [04-wizard-state](04-wizard-state.md) |
| `JobWizard` (steps; controlled by shell/store) | T-039–055 |
| `DraftSavedHint` | Autosave feedback |
| `CatalogPicker` | catalog CMS + create |
| `HeadcountStepper` | T-094, token hold |
| `GenderFilterToggle` | T-044 |
| `FavoritesOnlyToggle` | T-056–057, T-168–171 |
| `TokenCostPreview` | T-149–151 |
| `PublishGateBanner` (verification) | T-015 |
| `InsufficientTokensSheet` | T-150 |
| `TopUpFlow` | T-161 |

---

## Matching, apply, review

| Component | Cases |
| --- | --- |
| `JobFeedList` / `JobCard` | T-058–079 |
| `MatchReasonChips` | matching explain |
| `DistanceLabel` | location match |
| `ApplyConfirmSheet` | T-080 |
| `OverlapWarnDialog` | T-085, T-181 |
| `ApplicantTable` / `ApplicantFilters` | T-089–090 |
| `AcceptRejectBar` | T-091–092 |
| `HeadcountFullBanner` | T-093–094 |

---

## Shift day-of

| Component | Cases |
| --- | --- |
| `Confirm3hCard` | T-114–122 |
| `CheckInButton` + `GeofenceStatus` | T-123–133, LOCATION |
| `AccuracyMeter` | T-140–143 |
| `MockGpsWarning` | T-131, T-148 |
| `DisputeForm` | T-135, T-212 |
| `ManualConfirmPanel` | T-134, T-213 |

---

## Social, ratings, abuse

| Component | Cases |
| --- | --- |
| `FavoriteToggle` | T-164–167 |
| `StarRating` + `RatingCommentField` | T-172–180 |
| `ProfanityError` | T-176 |
| `ReportAbuseForm` | T-181+ |
| `RestrictionScreen` / `BlockingStatus` | T-192, SECURITY |

---

## Notifications

| Component | Cases |
| --- | --- |
| `NotificationRow` / `InboxEmpty` | T-100–113 · [05-push UX](05-push-notifications-ux.md) |
| `PushPrefToggles` | T-111 · categories shifts/applications/matching/favorites/marketing |
| `DeepLinkRouter` | T-109 · [08-routing](08-routing.md) |
| `PushDeniedBanner` | T-111 soft permission recovery |
| `InAppForegroundBanner` | Foreground when not already on target screen |

---

## Admin / ops (shadcn)

Full screen map: [`../web/08-admin-case-coverage.md`](../web/08-admin-case-coverage.md) · ADR-0034.

| Component | Cases |
| --- | --- |
| `OpsMetricCards` / `QueueDepthChart` / `LatencyHistogram` | CASE-PERF |
| `UserSearchTable` / `SessionRevokeButton` / `UserRestrictPanel` | CASE-SECURITY / AUTH / ABUSE |
| `WorkerProfilePanel` / `DocumentReviewRow` / `DocumentStatusChips` | CASE-WORKER-PROFILE |
| `EmployerOrgCard` / `VerificationQueueTable` / `VerificationStatusBadge` | CASE-EMPLOYER-BRANCH / AUTH T-015 |
| `BranchTable` | CASE-EMPLOYER-BRANCH / LOCATION |
| `JobOversightTable` / `ForceCloseDialog` / `CatalogTreeEditor` | CASE-JOB-POSTING |
| `MatchExplainPanel` | CASE-MATCHING |
| `Application admin filters` / status badges | CASE-APPLICATION / EMPLOYER-REVIEW |
| `ShiftLifecycleTimeline` / `Confirm3hStatus` / `DisputeQueueTable` | CASE-AVAILABILITY-3H / CHECKIN |
| `LedgerList` / `TokenAdjustDialog` / `HoldBreakdown` | CASE-TOKEN |
| `RatingModerationRow` | CASE-RATINGS |
| `OutboxTable` / `DedupeKeyBadge` / `BroadcastAudiencePicker` / `BroadcastConfirmDialog` | CASE-NOTIFICATIONS |
| `AbuseTicketTable` / `BanDetail` / `RiskQueueTable` / `RiskBadge` / `DeviceFingerprintBadge` / `MockGpsWarning` | CASE-ABUSE / LOCATION |
| `PolicyVersionEditor` / `ForceReacceptToggle` | CASE-AUTH policies |
| `RemoteConfigForm` / `GeofenceDefaultEditor` / `MaintenanceToggle` | CASE-UX / LOCATION |
| `AuditLogTable` / `AuditEventDetail` / `AuditReportForm` / `AuditExportHistory` / `DownloadFileButton` / `MaskedField` | CASE-SECURITY · legal audit CSV/PDF — ADR-0037 |
| `DevopsOverviewCards` / `ErrorIssueTable` / `StackFrameList` / `ReleaseChip` / `RequestIdLink` / `ResolveIgnoreBar` | ADR-0035 · CASE-PERF |
| `ReleaseTable` / `GitShaBadge` / `ServiceStatusGrid` / `DependencyProbeRow` / `ClientBuildTable` | ADR-0035 DevOps releases/services/clients |

---

## Implementation notes

| Platform | Where components live |
| --- | --- |
| Mobile | `apps/mobile/src/components/ui` + `features/*/components` (NativeWind) |
| Admin | `apps/admin/src/components` composing shadcn `components/ui` |
| Shared | **Token names only** in `design-tokens` — not RN/DOM widgets |

Colors: always [`01-color-system.md`](01-color-system.md) (`action-primary`, `feedback-error`, surfaces).

---

## Related

- Mandate: [`../cases/03-ui-coverage-mandate.md`](../cases/03-ui-coverage-mandate.md)  
- Screen UX & layout: [`03-screen-ux-layout.md`](03-screen-ux-layout.md) · [ADR-0019](../backend/adr/0019-screen-ux-layout.md)  
- Wizard state: [`04-wizard-state.md`](04-wizard-state.md) · [ADR-0020](../backend/adr/0020-wizard-state.md)  
- Mobile catalog: [`../mobile/02-screen-catalog.md`](../mobile/02-screen-catalog.md)  
- Web catalog: [`../web/02-screen-catalog.md`](../web/02-screen-catalog.md)  
