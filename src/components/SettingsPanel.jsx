import { useState } from 'react';

export default function SettingsPanel({ open, onClose, userName, setUserName, contacts, setContacts }) {
  const [draftName, setDraftName] = useState('');
  const [draftEmail, setDraftEmail] = useState('');

  function addContact(e) {
    e.preventDefault();
    if (!draftName.trim() || !draftEmail.trim()) return;
    setContacts([...contacts, { name: draftName.trim(), email: draftEmail.trim() }]);
    setDraftName('');
    setDraftEmail('');
  }

  function removeContact(idx) {
    setContacts(contacts.filter((_, i) => i !== idx));
  }

  return (
    <aside className={`settings ${open ? 'settings-open' : ''}`} aria-hidden={!open}>
      <div className="settings-head">
        <h2>Settings</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Close settings">
          ✕
        </button>
      </div>

      <label className="field">
        <span>Your name</span>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Shown in the alert email"
        />
      </label>

      <div className="field-group">
        <span>Emergency contacts</span>
        <ul className="contact-list">
          {contacts.map((c, idx) => (
            <li key={idx}>
              <div>
                <strong>{c.name}</strong>
                <span className="muted">{c.email}</span>
              </div>
              <button className="text-btn" onClick={() => removeContact(idx)}>
                Remove
              </button>
            </li>
          ))}
          {contacts.length === 0 && <li className="muted empty">No contacts added yet</li>}
        </ul>

        <form className="add-contact" onSubmit={addContact}>
          <input
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="Name"
          />
          <input
            type="email"
            value={draftEmail}
            onChange={(e) => setDraftEmail(e.target.value)}
            placeholder="Email"
          />
          <button type="submit">Add</button>
        </form>
      </div>

      <p className="settings-note">
        The codeword itself is set in <code>src/lib/porcupine.js</code> — it's trained once in the
        Picovoice Console, not typed here.
      </p>
    </aside>
  );
}
