/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

export interface TelegramLaunchContext {
  initData: string;
  platform: string;
  colorScheme: 'light' | 'dark';
}

export function getTelegramLaunchContext(): TelegramLaunchContext {
  const webApp = window.Telegram?.WebApp;

  if (webApp) {
    webApp.ready();
    webApp.expand();

    return {
      initData: webApp.initData || '',
      platform: webApp.platform || 'unknown',
      colorScheme: webApp.colorScheme || 'dark',
    };
  }

  return {
    initData: import.meta.env.VITE_DEV_INIT_DATA || '',
    platform: 'web',
    colorScheme: 'dark',
  };
}
