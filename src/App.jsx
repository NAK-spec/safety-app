import { useEffect, useRef, useState } from 'react';
import ListenerOrb from './components/ListenerOrb.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import { startListening } from './lib/speechListener.js';
import { getLocation, sendAlert } from './lib/alert.js';

const CANCEL_WINDOW_SECONDS = 5;

export default function App() {
  const [status, setStatus] = useState('idle'); // idle | listening | triggered | sending | sent | error
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(CANCEL_WINDOW_SECONDS);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [userName, setUserName] = useState('');
  const [contacts, setContacts] = useState([]);

  const stopListeningRef = useRef(null);
  const countdownTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      stopListeningRef.current?.();
      clearInterval(countdownTimerRef.current);
    };
  }, []);

  async function handleStart() {
    setErrorMessage('');
    const stop = await startListening({
      onDetected: handleCodewordDetected,
      onError: (err) => {
        setErrorMessage(err.message);
        setStatus('error');
      }
    });
    stopListeningRef.current = stop;
    if (status !== 'error') setStatus('listening');
  }

  function handleStop() {
    stopListeningRef.current?.();
    stopListeningRef.current = null;
    setStatus('idle');
  }

  function handleCodewordDetected() {
    setStatus('triggered');
    let remaining = CANCEL_WINDOW_SECONDS;
    setCountdown(remaining);
    countdownTimerRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(countdownTimerRef.current);
        fireAlert();
      }
    }, 1000);
  }

  function handleCancel() {
    clearInterval(countdownTimerRef.current);
    setStatus('listening');
  }

  async function fireAlert() {
    setStatus('sending');
    try {
      let location = null;
      try {
        location = await getLocation();
      } catch {
        // proceed without location rather than blocking the alert
      }
      const { sent, failed } = await sendAlert({ userName, contacts, location });
      if (sent > 0) {
        setStatus('sent');
      } else {
        setErrorMessage('No alerts went through. Check Settings and your EmailJS setup.');
        setStatus('error');
      }
      if (failed > 0 && sent > 0) {
        setErrorMessage(`${failed} contact(s) could not be reached.`);
      }
    } catch (err) {
      setErrorMessage(err.message);
      setStatus('error');
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <span className="wordmark">Codeword</span>
        <button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="Open settings">
          ⚙
        </button>
      </header>

      <main className="stage">
        <ListenerOrb status={status} countdown={countdown} />

        {status === 'error' && <p className="error-text">{errorMessage}</p>}

        <div className="controls">
          {status === 'idle' && (
            <button className="primary-btn" onClick={handleStart}>
              Start listening
            </button>
          )}
          {status === 'listening' && (
            <button className="ghost-btn" onClick={handleStop}>
              Stop
            </button>
          )}
          {status === 'triggered' && (
            <button className="cancel-btn" onClick={handleCancel}>
              Cancel — I'm okay
            </button>
          )}
          {(status === 'sent' || status === 'error') && (
            <button className="ghost-btn" onClick={() => setStatus('listening')}>
              Back to listening
            </button>
          )}
        </div>

        <p className="hint">
          {contacts.length === 0
            ? 'Add an emergency contact in Settings before you start.'
            : `Alerts go to ${contacts.length} contact${contacts.length > 1 ? 's' : ''}.`}
        </p>
      </main>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        userName={userName}
        setUserName={setUserName}
        contacts={contacts}
        setContacts={setContacts}
      />
      {settingsOpen && <div className="scrim" onClick={() => setSettingsOpen(false)} />}
    </div>
  );
}
