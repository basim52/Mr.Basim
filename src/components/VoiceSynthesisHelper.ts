/**
 * Utility to handle browser-native Speech Synthesis (Text to Speech)
 * and Speech Recognition (Speech to Text)
 */

export class VoiceTutor {
  static getEnglishVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    // Look for US/UK English voices
    return (
      voices.find((v) => v.lang.startsWith('en-US')) ||
      voices.find((v) => v.lang.startsWith('en-GB')) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      null
    );
  }

  static getArabicVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((v) => v.lang.startsWith('ar')) ||
      null
    );
  }

  static speak(text: string, lang: 'en' | 'ar' = 'en', onEnd?: () => void) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }

    // Cancel any current speaking
    window.speechSynthesis.cancel();

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose correct voice & rates
    if (lang === 'en') {
      utterance.voice = this.getEnglishVoice();
      utterance.lang = 'en-US';
      utterance.rate = 0.9; // slightly slower for better learning comprehension
    } else {
      utterance.voice = this.getArabicVoice();
      utterance.lang = 'ar-SA';
      utterance.rate = 1.0;
    }

    if (onEnd) {
      utterance.onend = onEnd;
    }

    window.speechSynthesis.speak(utterance);
  }

  static stop() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Initialize speech recognition
   */
  static startListening(
    onResult: (text: string) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ): any {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError('Speech recognition is not supported in this browser. Please use Chrome or Safari.');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US'; // tutoring is in English
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      onResult(resultText);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event);
      onError(event.error || 'Speech recognition failed');
    };

    recognition.onend = () => {
      onEnd();
    };

    recognition.start();
    return recognition;
  }
}
