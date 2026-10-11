const CSRF_COOKIE_NAME = "csrf";

export function readCsrfTokenFromDocument(): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${CSRF_COOKIE_NAME}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function csrfHeaders(): Record<string, string> {
  const token = readCsrfTokenFromDocument();
  if (!token) {
    return {};
  }
  return { "X-CSRF-Token": token };
}
