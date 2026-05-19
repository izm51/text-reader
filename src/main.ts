import { registerSW } from 'virtual:pwa-register';
import { renderApp } from './app';
import { initLaunchHandler } from './lib/launch';
import { getTTS } from './lib/tts';
import './styles/main.css';

registerSW({ immediate: true });

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

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
  const savedY =
    history.state && typeof history.state.scrollY === 'number' ? history.state.scrollY : 0;
  void renderApp(root).then(() => {
    window.scrollTo(0, savedY);
  });
});

initLaunchHandler(() => {
  void renderApp(root);
});

if ('storage' in navigator && 'persist' in navigator.storage) {
  void navigator.storage.persist();
}
