/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SOCKET_URL: string;
  readonly VITE_DEV_INIT_DATA?: string;
  readonly VITE_DEFAULT_LOCALE?: 'ru' | 'en';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
