export interface TTSState {
  status: 'idle' | 'playing' | 'paused';
  cursor: number;
  total: number;
  rate: number;
  pitch: number;
  voiceURI: string | null;
}

export type TTSListener = (state: TTSState) => void;

export class TTSController {
  private state: TTSState = {
    status: 'idle',
    cursor: 0,
    total: 0,
    rate: 1.0,
    pitch: 1.0,
    voiceURI: null,
  };

  private chunks: string[] = [];
  private listeners = new Set<TTSListener>();
  private generation = 0;

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

  speak(chunks: string[], startAt = 0) {
    if (!this.isSupported()) return;
    this.generation += 1;
    speechSynthesis.cancel();
    this.chunks = chunks.filter((c) => c.trim().length > 0);
    this.state.total = this.chunks.length;
    if (this.chunks.length === 0) {
      this.state.status = 'idle';
      this.state.cursor = 0;
      this.notify();
      return;
    }
    this.state.status = 'playing';
    this.speakAt(Math.max(0, Math.min(startAt, this.chunks.length - 1)), this.generation);
  }

  private speakAt(idx: number, gen: number) {
    if (gen !== this.generation) return;
    if (idx >= this.chunks.length) {
      this.state.status = 'idle';
      this.state.cursor = 0;
      this.notify();
      return;
    }
    this.state.cursor = idx;
    this.notify();

    const u = new SpeechSynthesisUtterance(this.chunks[idx]);
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
      if (gen !== this.generation) return;
      if (this.state.status !== 'playing') return;
      this.speakAt(idx + 1, gen);
    };
    u.onerror = (e) => {
      if (gen !== this.generation) return;
      if (e.error === 'canceled' || e.error === 'interrupted') return;
      if (this.state.status !== 'playing') return;
      this.speakAt(idx + 1, gen);
    };
    speechSynthesis.speak(u);
  }

  pause() {
    if (!this.isSupported()) return;
    if (this.state.status !== 'playing') return;
    this.generation += 1;
    this.state.status = 'paused';
    speechSynthesis.cancel();
    this.notify();
  }

  resume() {
    if (!this.isSupported()) return;
    if (this.state.status !== 'paused') return;
    if (this.chunks.length === 0) return;
    this.generation += 1;
    this.state.status = 'playing';
    this.speakAt(this.state.cursor, this.generation);
  }

  seekTo(idx: number) {
    if (!this.isSupported()) return;
    if (this.chunks.length === 0) return;
    const clamped = Math.max(0, Math.min(idx, this.chunks.length - 1));
    const wasPlaying = this.state.status !== 'idle';
    this.generation += 1;
    speechSynthesis.cancel();
    if (wasPlaying) {
      this.state.status = 'playing';
      this.speakAt(clamped, this.generation);
    } else {
      this.state.cursor = clamped;
      this.notify();
    }
  }

  stop() {
    if (!this.isSupported()) return;
    this.generation += 1;
    this.state.status = 'idle';
    this.state.cursor = 0;
    speechSynthesis.cancel();
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

let sharedTTS: TTSController | null = null;

export function getTTS(): TTSController {
  if (!sharedTTS) sharedTTS = new TTSController();
  return sharedTTS;
}
