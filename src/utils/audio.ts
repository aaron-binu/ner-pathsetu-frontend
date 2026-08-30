import translations from '../data/translations.json';
import { LanguageCode } from '../types';

export const playMultilingualAlert = (langCode: LanguageCode) => {
  const trans = (translations as Record<string, any>)[langCode] || translations.en;

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Stop any previous speech

    const utterance = new SpeechSynthesisUtterance(trans.speechText);
    utterance.lang = trans.langCode;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang.startsWith(trans.langCode.split('-')[0])) ||
                  voices.find((v) => v.lang.includes('IN')) ||
                  voices[0];
    
    if (voice) {
      utterance.voice = voice;
    }

    window.speechSynthesis.speak(utterance);
  } else {
    try {
      const AudioCtxClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        const audioCtx = new AudioCtxClass();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      }
    } catch (e) {
      console.warn('Audio synthesis not supported on this browser context', e);
    }
  }
};
