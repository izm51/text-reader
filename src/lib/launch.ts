import { importFiles } from './import';
import { navigate } from '../router';

interface LaunchParams {
  files: ReadonlyArray<FileSystemFileHandle>;
}

interface LaunchQueue {
  setConsumer(consumer: (params: LaunchParams) => void | Promise<void>): void;
}

declare global {
  interface Window {
    launchQueue?: LaunchQueue;
  }
}

export function initLaunchHandler(onImported: () => void): void {
  if (!('launchQueue' in window) || !window.launchQueue) return;

  window.launchQueue.setConsumer(async (params) => {
    if (!params.files || params.files.length === 0) return;
    const files: File[] = [];
    for (const handle of params.files) {
      try {
        files.push(await handle.getFile());
      } catch (err) {
        console.error('launchQueue: failed to read file', err);
      }
    }
    if (files.length === 0) return;
    const ids = await importFiles(files);
    if (ids.length === 1) {
      navigate(`?doc=${ids[0]}`);
    } else if (ids.length > 1) {
      navigate('');
    }
    onImported();
  });
}
