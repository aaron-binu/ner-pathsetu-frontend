import translations from '../data/translations.json';
import { LanguageCode } from '../types';

// Map full language names or aliases to valid LanguageCode
const normalizeLangCode = (lang: string): LanguageCode => {
  if (!lang) return 'en';
  const l = lang.toLowerCase().trim();
  if (l === 'as' || l === 'assamese' || l.includes('অসমীয়া')) return 'as';
  if (l === 'hi' || l === 'hindi' || l.includes('हिन्दी')) return 'hi';
  if (l === 'mni' || l === 'manipuri' || l.includes('মৈতৈলোন্') || l === 'meetei') return 'mni';
  if (l === 'lus' || l === 'mizo' || l.includes('mizo')) return 'lus';
  if (l === 'kha' || l === 'khasi' || l.includes('khasi')) return 'kha';
  if (l === 'brx' || l === 'bodo' || l.includes('बर')) return 'brx';
  if (l === 'bn' || l === 'bengali' || l.includes('বাংলা')) return 'bn';
  return 'en';
};

// Play a crisp, emergency two-tone chime via Web Audio API
export const playEmergencyChime = (): Promise<void> => {
  return new Promise((resolve) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        resolve();
        return;
      }
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      
      // Dual-tone emergency beacon (High alert tone -> Second confirming tone)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // Frequency sequence: 880 Hz (A5) -> 587.33 Hz (D5)
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.setValueAtTime(587.33, now + 0.15);

      osc2.frequency.setValueAtTime(1174.66, now);
      osc2.frequency.setValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
      gain.gain.setValueAtTime(0.18, now + 0.14);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.46);
      osc2.stop(now + 0.46);

      setTimeout(() => {
        resolve();
      }, 350);
    } catch {
      resolve();
    }
  });
};

// Asynchronously retrieve available voices
const getAvailableVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    let voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      resolve(voices);
      return;
    }

    const handler = () => {
      voices = window.speechSynthesis.getVoices();
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(voices);
    };

    window.speechSynthesis.addEventListener('voiceschanged', handler);

    // Timeout fallback if voiceschanged doesn't fire
    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices() || []);
    }, 250);
  });
};

export const playMultilingualAlert = async (languageInput: string | LanguageCode) => {
  const code = normalizeLangCode(languageInput);
  const trans = (translations as Record<string, any>)[code] || (translations as any).en;

  // 1. Always play the emergency acoustic chime first for immediate audio feedback
  await playEmergencyChime();

  // 2. Perform speech synthesis
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const voices = await getAvailableVoices();

      // Find the best matching voice
      const targetPrefix = (trans.langCode || 'en').split('-')[0].toLowerCase();
      
      // Look for exact match (e.g. as-IN, bn-IN, hi-IN, en-IN)
      let matchedVoice = voices.find((v) => v.lang.toLowerCase() === trans.langCode.toLowerCase());
      
      // Look for prefix match (e.g. bn, hi, as, en)
      if (!matchedVoice) {
        matchedVoice = voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix));
      }

      // Look for any Indian voice if target is an Indian language
      if (!matchedVoice && code !== 'en') {
        matchedVoice = voices.find((v) => v.lang.includes('IN') || v.name.toLowerCase().includes('india'));
      }

      // Fallback to default / standard English voice
      if (!matchedVoice) {
        matchedVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
      }

      // Check if matched voice can pronounce Indic script natively
      const voiceLangPrefix = matchedVoice ? matchedVoice.lang.split('-')[0].toLowerCase() : 'en';
      const isIndicVoice = ['hi', 'bn', 'as', 'gu', 'mr', 'ta', 'te', 'kn', 'ml', 'pa', 'or'].includes(voiceLangPrefix);

      // Determine the spoken text:
      // If voice is native Indic and target matches, speak native script.
      // If voice is Latin/English-only, speak clear phonetic transliteration so it is audibly pronounced instead of skipped/silent!
      let textToSpeak = trans.speechText;
      if (!isIndicVoice && trans.phoneticText) {
        textToSpeak = trans.phoneticText;
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang;
      } else {
        utterance.lang = trans.langCode || 'en-IN';
      }

      utterance.rate = 0.92;
      utterance.pitch = 1.05;
      utterance.volume = 1.0;

      // Resilience fallback: if utterance errors (e.g. unsupported script), retry in English
      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error on primary utterance, falling back to English phonetic:', e);
        try {
          const fallbackUtterance = new SpeechSynthesisUtterance(
            trans.phoneticText || `Alert. Road blocked on National Highway Corridor for ${trans.name}.`
          );
          fallbackUtterance.lang = 'en-US';
          fallbackUtterance.rate = 0.95;
          window.speechSynthesis.speak(fallbackUtterance);
        } catch {}
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis execution failed, emergency chime was played:', e);
    }
  }
};
