import { Capacitor, registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Clipboard } from '@capacitor/clipboard';
import { Share } from '@capacitor/share';
import { installAppUI } from './app-ui.mjs';

document.addEventListener('DOMContentLoaded', installAppUI);

if (Capacitor.isNativePlatform()) {
  const GameFiles = registerPlugin('GameFiles');
  window.tomorrowNative = {
    async saveFile(blob, filename) {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      const result = await GameFiles.save({ data, filename, mimeType: blob.type });
      return !result.cancelled;
    },
    async copy(text) { await Clipboard.write({ string: text }); },
    async share(options) { await Share.share({ ...options, dialogTitle: '친구에게 알려주기' }); }
  };
  App.addListener('appStateChange', ({ isActive }) => {
    window.dispatchEvent(new CustomEvent('tomorrow-app-state', { detail: { isActive } }));
  });
  App.addListener('backButton', async ({ canGoBack }) => {
    const back = new Event('tomorrow-back', { cancelable: true });
    if (!window.dispatchEvent(back)) return;
    if (canGoBack) history.back();
    else {
      window.dispatchEvent(new CustomEvent('tomorrow-app-state', { detail: { isActive: false } }));
      await App.minimizeApp();
    }
  });
}
