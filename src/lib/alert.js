import emailjs from '@emailjs/browser';

// --- Fill these in once you've set up a free account at https://emailjs.com ---
// 1. Add an "Email Service" (e.g. connect your Gmail) -> copy the Service ID.
// 2. Create an Email Template with variables: {{to_email}}, {{contact_name}},
//    {{user_name}}, {{maps_link}}, {{sent_at}} -> copy the Template ID.
// 3. Under Account -> General, copy your Public Key.
export const EMAILJS_SERVICE_ID = 'PASTE_YOUR_SERVICE_ID_HERE';
export const EMAILJS_TEMPLATE_ID = 'PASTE_YOUR_TEMPLATE_ID_HERE';
export const EMAILJS_PUBLIC_KEY = 'PASTE_YOUR_PUBLIC_KEY_HERE';

export function isAlertConfigured() {
  return (
    !EMAILJS_SERVICE_ID.startsWith('PASTE_') &&
    !EMAILJS_TEMPLATE_ID.startsWith('PASTE_') &&
    !EMAILJS_PUBLIC_KEY.startsWith('PASTE_')
  );
}

/**
 * Fetches a one-shot GPS fix. Rejects if permission is denied or it times out.
 */
export function getLocation() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not available on this device.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  });
}

/**
 * Sends one alert email per emergency contact. Returns { sent, failed } counts.
 */
export async function sendAlert({ userName, contacts, location }) {
  if (!isAlertConfigured()) {
    throw new Error('EmailJS is not configured yet. See README.md.');
  }
  if (!contacts?.length) {
    throw new Error('Add at least one emergency contact in Settings first.');
  }

  const mapsLink = location
    ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
    : 'Location unavailable';

  let sent = 0;
  let failed = 0;

  await Promise.all(
    contacts.map(async (contact) => {
      try {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            to_email: contact.email,
            contact_name: contact.name,
            user_name: userName || 'Someone using Codeword',
            maps_link: mapsLink,
            sent_at: new Date().toLocaleString()
          },
          { publicKey: EMAILJS_PUBLIC_KEY }
        );
        sent += 1;
      } catch {
        failed += 1;
      }
    })
  );

  return { sent, failed };
}
