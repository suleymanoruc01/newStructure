/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string;
  readonly VITE_IOS_STORE_URL?: string;
  readonly VITE_ANDROID_STORE_URL?: string;
  readonly VITE_EMPLOYER_LOGIN_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
