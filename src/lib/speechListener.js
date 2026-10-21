// Uses the browser's built-in Web Speech API instead of Picovoice/Porcupine.
// Trade-off vs. Porcupine: this sends audio to the browser vendor's speech
// service for transcription (not fully on-device), but needs zero signup,
// zero API key, and works immediately in Chrome/Edge.

export const CODEWORD_LABEL = 'yellow'; // change this to whatever codeword you want

const SpeechRecognitionImpl =
  typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

let recognizer = null;
let shouldKeepListening = false;

/**
 * Starts listening for the codeword. Calls onDetected() the moment it's heard.
 * Returns a stop() function.
 */
export async function startListening({ onDetected, onError }) {
  if (!SpeechRecognitionImpl) {
    onError?.(
      new Error(
        'Speech recognition is not supported in this browser. Try Chrome or Edge.'
      )
    );
    return () => {};
  }

  try {
    // Ask for mic permission up front so the error surfaces clearly if denied.
    await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    onError?.(new Error('Microphone permission was denied.'));
    return () => {};
  }

  shouldKeepListening = true;
  recognizer = new SpeechRecognitionImpl();
  recognizer.continuous = true;
  recognizer.interimResults = true;
  recognizer.lang = 'en-US';

  recognizer.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript.toLowerCase();
      const codeword = CODEWORD_LABEL.toLowerCase();
      const pattern = new RegExp(`\\b${codeword}\\b`);
      if (pattern.test(transcript)) {
        onDetected?.();
        return;
      }
    }
  };

  recognizer.onerror = (event) => {
    // 'no-speech' fires often during normal silence — not a real error, ignore it.
    if (event.error !== 'no-speech') {
      onError?.(new Error(`Speech recognition error: ${event.error}`));
    }
  };

  // Chrome stops recognition after a pause; restart it automatically as long
  // as we're supposed to still be listening.
  recognizer.onend = () => {
    if (shouldKeepListening) {
      try {
        recognizer.start();
      } catch {
        // already starting/started — ignore
      }
    }
  };

  recognizer.start();

  return async () => {
    shouldKeepListening = false;
    recognizer?.stop();
    recognizer = null;
  };
}