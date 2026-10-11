const SENSITIVE_PATTERNS = [
  /otp/i,
  /bearer\s+/i,
  /refresh/i,
  /password/i,
  /\+90\d{10}/,
  /\b\d{6}\b/,
];

export function redactDevopsMessage(message: string): string {
  let out = message.slice(0, 2000);
  for (const pattern of SENSITIVE_PATTERNS) {
    out = out.replace(pattern, '[redacted]');
  }
  return out;
}

export function redactDevopsStack(stack: string | undefined): string | undefined {
  if (!stack) {
    return undefined;
  }
  return redactDevopsMessage(stack.slice(0, 16_000));
}

export function fingerprintFor(app: string, message: string): string {
  const normalized = redactDevopsMessage(message).toLowerCase().trim();
  return `${app}:${normalized.slice(0, 200)}`;
}
