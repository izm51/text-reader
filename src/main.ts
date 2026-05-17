import { registerSW } from 'virtual:pwa-register';
import { renderApp } from './app';
import { initLaunchHandler } from './lib/launch';
import { getTTS } from './lib/tts';
import './styles/main.css';

registerSW({ immediate: true });

const root = document.getElementById('app')!;
void renderApp(root);

window.addEventListener('popstate', () => {
  const params = new URLSearchParams(location.search);
  if (!params.get('doc') && !params.get('view')) {
    getTTS().stop();
  }
  void renderApp(root);
});

initLaunchHandler(() => {
  void renderApp(root);
});

if ('storage' in navigator && 'persist' in navigator.storage) {
  void navigator.storage.persist();
}
