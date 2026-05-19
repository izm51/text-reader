import { registerSW } from 'virtual:pwa-register';
import { renderApp } from './app';
import { initLaunchHandler } from './lib/launch';
import { getTTS } from './lib/tts';
import './styles/main.css';

registerSW({ immediate: true });

const root = document.getElementById('app')!;
void renderApp(root);

let prevOnReader = !!new URLSearchParams(location.search).get('doc');

window.addEventListener('popstate', () => {
  const params = new URLSearchParams(location.search);
  const onReader = !!params.get('doc');
  const onTop = !onReader && !params.get('view');
  if (prevOnReader && onTop) {
    getTTS().stop();
  }
  prevOnReader = onReader;
  void renderApp(root);
});

initLaunchHandler(() => {
  void renderApp(root);
});

if ('storage' in navigator && 'persist' in navigator.storage) {
  void navigator.storage.persist();
}
