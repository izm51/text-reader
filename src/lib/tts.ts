export interface TTSState {
  status: 'idle' | 'playing' | 'paused';
  rate: number;
  pitch: number;
  voiceURI: string | null;
}

export type TTSListener = (state: TTSState) => void;

const CHUNK_LIMIT = 200;

function splitText(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  const sentences = cleaned.match(/[^。！？!?.\n]+[。！？!?.\n]?/g) ?? [cleaned];
  const chunks: string[] = [];
  let buf = '';
  for (const s of sentences) {
    if ((buf + s).length > CHUNK_LIMIT) {
      if (buf) chunks.push(buf);
      buf = s;
    } else {
      buf += s;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

export class TTSController {
  private state: TTSState = {
    status: 'idle',
    rate: 1.0,
    pitch: 1.0,
    voiceURI: null,
  };

  private chunks: string[] = [];
  private cursor = 0;
  private listeners = new Set<TTSListener>();

  constructor() {
    this.loadPrefs();
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.addEventListener?.('voiceschanged', () => this.notify());
    }
  }

  get currentState(): TTSState {
    return { ...this.state };
  }

  subscribe(fn: TTSListener): () => void {
    this.listeners.add(fn);
    fn(this.currentState);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    for (const fn of this.listeners) fn(this.currentState);
  }

  isSupported(): boolean {
    return typeof speechSynthesis !== 'undefined';
  }

  getVoices(): SpeechSynthesisVoice[] {
    if (!this.isSupported()) return [];
    return speechSynthesis.getVoices();
  }

  setRate(rate: number) {
    this.state.rate = Math.max(0.5, Math.min(2.5, rate));
    this.savePrefs();
    this.notify();
  }

  setPitch(pitch: number) {
    this.state.pitch = Math.max(0, Math.min(2, pitch));
    this.savePrefs();
    this.notify();
  }

  setVoice(voiceURI: string | null) {
    this.state.voiceURI = voiceURI;
    this.savePrefs();
    this.notify();
  }

  speak(text: string) {
    if (!this.isSupported()) return;
    this.stop();
    this.chunks = splitText(text);
    this.cursor = 0;
    if (this.chunks.length === 0) return;
    this.state.status = 'playing';
    this.notify();
    this.speakNext();
  }

  private speakNext() {
    if (this.cursor >= this.chunks.length) {
      this.state.status = 'idle';
      this.notify();
      return;
    }
    const u = new SpeechSynthesisUtterance(this.chunks[this.cursor]);
    u.rate = this.state.rate;
    u.pitch = this.state.pitch;
    u.lang = 'ja-JP';
    const voices = this.getVoices();
    const selected =
      voices.find((v) => v.voiceURI === this.state.voiceURI) ??
      voices.find((v) => v.lang.startsWith('ja')) ??
      voices[0];
    if (selected) u.voice = selected;
    u.onend = () => {
      this.cursor += 1;
      if (this.state.status === 'playing') this.speakNext();
    };
    u.onerror = () => {
      this.cursor += 1;
      if (this.state.status === 'playing') this.speakNext();
    };
    speechSynthesis.speak(u);
  }

  pause() {
    if (!this.isSupported()) return;
    if (this.state.status === 'playing') {
      speechSynthesis.pause();
      this.state.status = 'paused';
      this.notify();
    }
  }

  resume() {
    if (!this.isSupported()) return;
    if (this.state.status === 'paused') {
      speechSynthesis.resume();
      this.state.status = 'playing';
      this.notify();
    }
  }

  stop() {
    if (!this.isSupported()) return;
    speechSynthesis.cancel();
    this.state.status = 'idle';
    this.cursor = 0;
    this.chunks = [];
    this.notify();
  }

  private loadPrefs() {
    try {
      const raw = localStorage.getItem('tts-prefs');
      if (!raw) return;
      const p = JSON.parse(raw) as Partial<TTSState>;
      if (typeof p.rate === 'number') this.state.rate = p.rate;
      if (typeof p.pitch === 'number') this.state.pitch = p.pitch;
      if (typeof p.voiceURI === 'string' || p.voiceURI === null)
        this.state.voiceURI = p.voiceURI ?? null;
    } catch {
      /* ignore */
    }
  }

  private savePrefs() {
    try {
      localStorage.setItem(
        'tts-prefs',
        JSON.stringify({
          rate: this.state.rate,
          pitch: this.state.pitch,
          voiceURI: this.state.voiceURI,
        }),
      );
    } catch {
      /* ignore */
    }
  }
}
