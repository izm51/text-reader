import { registerSW } from 'virtual:pwa-register';
import { renderApp } from './app';
import './styles/main.css';

registerSW({ immediate: true });

void renderApp(document.getElementById('app')!);

window.addEventListener('popstate', () => {
  void renderApp(document.getElementById('app')!);
});

if ('storage' in navigator && 'persist' in navigator.storage) {
  void navigator.storage.persist();
}
