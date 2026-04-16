export class VoiceCoach {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
  private lastSpoken = new Map<string, number>();
  private onSpeakStart?: () => void;
  private onSpeakEnd?: () => void;

  constructor(onSpeakStart?: () => void, onSpeakEnd?: () => void) {
    this.synth = window.speechSynthesis;
    this.onSpeakStart = onSpeakStart;
    this.onSpeakEnd = onSpeakEnd;
    this.selectVoice();

    if (this.synth.getVoices().length === 0) {
      this.synth.addEventListener("voiceschanged", () => this.selectVoice(), {
        once: true,
      });
    }
  }

  private selectVoice() {
    const voices = this.synth.getVoices();
    this.voice =
      voices.find(
        (v) => v.name.includes("Google") && v.lang.startsWith("en")
      ) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0] ||
      null;
  }

  speak(text: string, debounceMs = 5000) {
    const now = Date.now();
    const lastTime = this.lastSpoken.get(text) || 0;
    if (now - lastTime < debounceMs) return;

    this.lastSpoken.set(text, now);

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) utterance.voice = this.voice;
    utterance.rate = 1.1;
    utterance.pitch = 1.0;

    utterance.onstart = () => this.onSpeakStart?.();
    utterance.onend = () => this.onSpeakEnd?.();

    this.synth.speak(utterance);
  }

  speakImmediate(text: string) {
    this.synth.cancel();
    this.lastSpoken.set(text, Date.now());

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) utterance.voice = this.voice;
    utterance.rate = 1.1;
    utterance.pitch = 1.0;

    utterance.onstart = () => this.onSpeakStart?.();
    utterance.onend = () => this.onSpeakEnd?.();

    this.synth.speak(utterance);
  }

  stop() {
    this.synth.cancel();
  }

  get isSpeaking(): boolean {
    return this.synth.speaking;
  }
}
