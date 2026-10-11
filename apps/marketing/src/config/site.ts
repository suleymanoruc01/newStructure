function envString(key: string, fallback: string): string {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const viteVal = import.meta.env[key as keyof ImportMetaEnv];
    if (typeof viteVal === "string" && viteVal.length > 0) {
      return viteVal;
    }
  }
  const nodeVal = process.env[key];
  if (typeof nodeVal === "string" && nodeVal.length > 0) {
    return nodeVal;
  }
  return fallback;
}

export function siteUrl(): string {
  return envString("VITE_SITE_URL", "https://www.parton.com.tr").replace(/\/$/, "");
}

export function iosStoreUrl(): string {
  return envString("VITE_IOS_STORE_URL", "https://apps.apple.com/app/parton");
}

export function androidStoreUrl(): string {
  return envString(
    "VITE_ANDROID_STORE_URL",
    "https://play.google.com/store/apps/details?id=com.parton.app",
  );
}

export function employerLoginUrl(): string {
  return envString("VITE_EMPLOYER_LOGIN_URL", "https://console.parton.com.tr/login");
}

export const LEGAL_POLICY_VERSION = "2026-10-01";
