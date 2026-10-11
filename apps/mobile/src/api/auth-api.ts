import {
  assignRoleBodySchema,
  identityLinkBodySchema,
  identityLinkResponseSchema,
  identityListResponseSchema,
  identityLoginBodySchema,
  identityProvidersResponseSchema,
  otpRequestBodySchema,
  otpRequestResponseSchema,
  otpVerifyBodySchema,
  otpVerifyResponseSchema,
  phonePasswordLoginBodySchema,
  setPasswordBodySchema,
  setPasswordResponseSchema,
  policiesListResponseSchema,
  policyAcceptanceBodySchema,
  policyAcceptanceResponseSchema,
  tokenRefreshBodySchema,
  tokenRefreshResponseSchema,
  assignRoleResponseSchema,
  contextSwitchBodySchema,
  contextSwitchResponseSchema,
  contextsListResponseSchema,
  meResponseSchema,
  type AuthContext,
  type AssignRoleBody,
  type IdentityLinkBody,
  type IdentityLoginBody,
  type OtpRequestBody,
  type OtpVerifyBody,
  type PhonePasswordLoginBody,
  type SetPasswordBody,
  type PolicyAcceptanceBody,
  type TokenRefreshBody,
} from '@parton/api-contracts';

import { apiRequest } from './client';

export async function requestOtp(body: OtpRequestBody) {
  otpRequestBodySchema.parse(body);
  return apiRequest('/auth/otp/request', otpRequestResponseSchema, {
    method: 'POST',
    body,
  });
}

export async function setAccountPassword(
  body: SetPasswordBody,
  accessToken: string,
) {
  setPasswordBodySchema.parse(body);
  return apiRequest('/auth/password', setPasswordResponseSchema, {
    method: 'POST',
    body,
    accessToken,
  });
}

export async function loginWithPhonePassword(body: PhonePasswordLoginBody) {
  phonePasswordLoginBodySchema.parse(body);
  return apiRequest('/auth/login', otpVerifyResponseSchema, {
    method: 'POST',
    body,
  });
}

export async function verifyOtp(body: OtpVerifyBody, accessToken?: string | null) {
  otpVerifyBodySchema.parse(body);
  return apiRequest('/auth/otp/verify', otpVerifyResponseSchema, {
    method: 'POST',
    body,
    accessToken,
  });
}

export async function refreshTokens(body: TokenRefreshBody) {
  tokenRefreshBodySchema.parse(body);
  return apiRequest('/auth/token/refresh', tokenRefreshResponseSchema, {
    method: 'POST',
    body,
  });
}

export async function assignRole(
  body: AssignRoleBody,
  accessToken: string,
) {
  assignRoleBodySchema.parse(body);
  return apiRequest('/users/me/roles', assignRoleResponseSchema, {
    method: 'POST',
    body,
    accessToken,
  });
}

export async function fetchMe(accessToken: string) {
  return apiRequest('/me', meResponseSchema, {
    method: 'GET',
    accessToken,
  });
}

export async function fetchContexts(accessToken: string) {
  return apiRequest('/auth/contexts', contextsListResponseSchema, {
    method: 'GET',
    accessToken,
  });
}

export async function switchAuthContext(
  body: AuthContext,
  accessToken: string,
) {
  contextSwitchBodySchema.parse(body);
  return apiRequest('/auth/context', contextSwitchResponseSchema, {
    method: 'POST',
    body,
    accessToken,
  });
}

export async function listPolicies(accessToken: string) {
  return apiRequest('/policies', policiesListResponseSchema, {
    method: 'GET',
    accessToken,
  });
}

export async function fetchIdentityProviders() {
  return apiRequest(
    '/auth/identity-providers',
    identityProvidersResponseSchema,
  );
}

export async function listLinkedIdentities(accessToken: string) {
  return apiRequest('/auth/identities', identityListResponseSchema, {
    accessToken,
  });
}

export async function linkIdentity(
  body: IdentityLinkBody,
  accessToken: string,
) {
  identityLinkBodySchema.parse(body);
  return apiRequest('/auth/identities/link', identityLinkResponseSchema, {
    method: 'POST',
    body,
    accessToken,
  });
}

export async function loginWithIdentity(body: IdentityLoginBody) {
  identityLoginBodySchema.parse(body);
  return apiRequest('/auth/identities/login', otpVerifyResponseSchema, {
    method: 'POST',
    body,
  });
}

export async function acceptPolicies(
  body: PolicyAcceptanceBody,
  accessToken: string,
) {
  policyAcceptanceBodySchema.parse(body);
  return apiRequest('/policies/acceptances', policyAcceptanceResponseSchema, {
    method: 'POST',
    body,
    accessToken,
  });
}
