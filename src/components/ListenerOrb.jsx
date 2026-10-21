export default function ListenerOrb({ status, countdown }) {
  // status: 'idle' | 'listening' | 'triggered' | 'sending' | 'sent' | 'error'
  const label = {
    idle: 'Tap to start listening',
    listening: 'Listening for your codeword',
    triggered: `Sending alert in ${countdown}s`,
    sending: 'Sending alert…',
    sent: 'Contacts alerted',
    error: 'Something needs attention'
  }[status];

  return (
    <div className={`orb-wrap orb-${status}`}>
      <div className="orb">
        <div className="orb-ring orb-ring-1" />
        <div className="orb-ring orb-ring-2" />
        <div className="orb-core" />
      </div>
      <p className="orb-label">{label}</p>
    </div>
  );
}
