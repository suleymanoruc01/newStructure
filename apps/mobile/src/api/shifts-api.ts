import {
  availabilityConfirmBodySchema,
  checkInBodySchema,
  checkInResponseSchema,
  disputeCreateBodySchema,
  disputeResponseSchema,
  employerOpenDisputesResponseSchema,
  shiftIncidentCreateBodySchema,
  shiftIncidentResponseSchema,
  shiftListResponseSchema,
  shiftResponseSchema,
  type AvailabilityConfirmBody,
  checkOutBodySchema,
  type CheckInBody,
  type CheckOutBody,
  type DisputeCreateBody,
  type Shift,
  type ShiftIncidentCreateBody,
} from '@parton/api-contracts';

import { apiRequest } from './client';

export async function fetchShift(shiftId: string, accessToken: string): Promise<Shift> {
  return apiRequest(`/shifts/${shiftId}`, shiftResponseSchema, { accessToken });
}

export async function listMyShifts(accessToken: string) {
  return apiRequest('/shifts?mine=1', shiftListResponseSchema, { accessToken });
}

export async function listEmployerOpenDisputes(accessToken: string) {
  return apiRequest(
    '/shifts/employer/open-disputes',
    employerOpenDisputesResponseSchema,
    { accessToken },
  );
}

export async function confirmAvailability(
  shiftId: string,
  accessToken: string,
  body: AvailabilityConfirmBody,
) {
  availabilityConfirmBodySchema.parse(body);
  return apiRequest(`/shifts/${shiftId}/availability-confirm`, shiftResponseSchema, {
    method: 'POST',
    body,
    accessToken,
  });
}

export async function manualConfirmShift(
  shiftId: string,
  accessToken: string,
  idempotencyKey?: string,
) {
  return apiRequest(`/shifts/${shiftId}/manual-confirm`, shiftResponseSchema, {
    method: 'POST',
    accessToken,
    idempotencyKey,
  });
}

export async function createShiftIncident(
  shiftId: string,
  accessToken: string,
  body: ShiftIncidentCreateBody,
) {
  shiftIncidentCreateBodySchema.parse(body);
  return apiRequest(`/shifts/${shiftId}/incidents`, shiftIncidentResponseSchema, {
    method: 'POST',
    body,
    accessToken,
  });
}

export async function createShiftDispute(
  shiftId: string,
  accessToken: string,
  body: DisputeCreateBody,
) {
  disputeCreateBodySchema.parse(body);
  return apiRequest(`/shifts/${shiftId}/disputes`, disputeResponseSchema, {
    method: 'POST',
    body,
    accessToken,
  });
}

export async function checkOutFromShift(
  shiftId: string,
  accessToken: string,
  body: CheckOutBody = {},
  idempotencyKey?: string,
) {
  checkOutBodySchema.parse(body);
  return apiRequest(`/shifts/${shiftId}/check-out`, shiftResponseSchema, {
    method: 'POST',
    body,
    accessToken,
    idempotencyKey,
  });
}

export async function checkInToShift(
  shiftId: string,
  accessToken: string,
  body: CheckInBody,
  idempotencyKey?: string,
) {
  checkInBodySchema.parse(body);
  return apiRequest(`/shifts/${shiftId}/check-in`, checkInResponseSchema, {
    method: 'POST',
    body,
    accessToken,
    idempotencyKey,
  });
}
