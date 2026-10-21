# Codeword — voice-activated safety alert

Say a codeword, and Codeword emails your emergency contacts with your live location.
It runs as an installable PWA and does the wake-word detection on-device (nothing you
say is streamed anywhere unless the codeword actually fires).

This is a **working scaffold** — the app logic, UI, and states are all built and
functional. Two things need a few minutes of setup on your end before it can
actually detect a word or send an email, because both require free accounts you
need to create yourself.

## 1. Install dependencies

```bash
cd safety-alert-app
npm install
```

## 2. Set up wake-word detection (Picovoice / Porcupine)

1. Create a free account at https://console.picovoice.ai
2. Copy your **AccessKey** from the console dashboard.
3. In the console, go to **Porcupine → Wake Word**, train a custom word
   (e.g. "yellow" — pick something you wouldn't say by accident, but that's fast
   to say under stress). Set the target platform to **Web (WASM)**.
4. Download the resulting `.ppn` file and place it in `public/models/`.
5. Open `src/lib/porcupine.js` and fill in:
   - `PICOVOICE_ACCESS_KEY` — your AccessKey from step 2
   - `CODEWORD_MODEL_PATH` — path to the file you added (e.g. `/models/codeword_wasm.ppn`)
   - `CODEWORD_LABEL` — the word you trained, exactly as named in the console

## 3. Set up alert emails (EmailJS)

1. Create a free account at https://www.emailjs.com
2. **Email Services** → connect an email account (e.g. Gmail) → copy the **Service ID**.
3. **Email Templates** → create a template using these variables:
   `{{to_email}}`, `{{contact_name}}`, `{{user_name}}`, `{{maps_link}}`, `{{sent_at}}`
   → copy the **Template ID**.
4. **Account → General** → copy your **Public Key**.
5. Open `src/lib/alert.js` and fill in `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`,
   `EMAILJS_PUBLIC_KEY`.

## 4. Run it

```bash
npm run dev
```

Open the printed local URL in Chrome or Safari on your laptop first — mic and
location permission prompts will appear. `localhost` counts as a secure context,
so this works without HTTPS.

**To test on your phone** (recommended before a demo, since that's the real use
case): the app requests microphone + geolocation, both of which browsers only
allow over HTTPS on other devices. Easiest options:
- Deploy to Vercel/Netlify (both give you free HTTPS instantly — see below), or
- Use a tunnel like `npx localtunnel --port 5173` or `ngrok http 5173` while
  running `npm run dev`, then open the HTTPS URL it gives you on your phone.

## 5. Deploy for the demo

Any static host works since this is a Vite build:

```bash
npm run build
```

Drag the resulting `dist/` folder into Netlify, or connect the repo to Vercel.
Both auto-provision HTTPS, which you need for mic/location access on a real phone.

## How it behaves

- **Idle → Listening**: tap "Start listening"; Porcupine runs entirely on-device.
- **Codeword detected → Triggered**: a 5-second "Cancel — I'm okay" window appears,
  so an accidental trigger (TV, conversation) doesn't fire a false alarm.
- **Countdown ends → Sending**: grabs a GPS fix (falls back to "location
  unavailable" if denied, rather than blocking the alert) and emails every
  contact in Settings with a Google Maps link.
- **Sent**: confirms how many contacts were reached.

## What's intentionally out of scope for the MVP

- Real emergency-service (911-style) dialing — that needs telephony
  integration and varies a lot by country/carrier; the pitch can mention it as
  a roadmap item.
- True background listening with the app closed — mobile OSes restrict
  background mic access heavily; for the demo, keep the app open and the
  screen on. Worth naming explicitly as a known limitation and future direction
  (native app with a foreground service, on Android, is the real fix).
- SMS — swapped for email (EmailJS) to avoid Twilio's per-recipient number
  verification step, which is awkward mid-demo.
