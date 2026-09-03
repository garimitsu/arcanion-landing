/* POST /api/waitlist  { email }  ->  { ok: true } | { ok: false, reason }
 *
 * Why this exists at all: the page cannot confirm its own signups. Google sends
 * no CORS headers, so a browser POST straight to the form must use `no-cors`,
 * and an opaque response carries no status and no body — a resolved promise
 * there means "the request left the building", never "Google stored it". This
 * runs server-side, where the real response is readable.
 *
 * How a recorded response is told apart from a rejected one, without depending
 * on Google's wording (it is localised — this endpoint answers in Russian from
 * some IPs and English from others):
 *
 *   recorded  ->  HTTP 200, and the body is the confirmation page, which does
 *                 NOT carry the question id (there is no longer a field to fill)
 *   rejected  ->  HTTP 400, and the body is the form itself, which DOES carry
 *                 the question id in its `data-params`
 *
 * Both signals are checked and must agree. Anything else is reported as not
 * recorded, so the page falls back rather than claiming a signup it did not get.
 */

const FORM_ENDPOINT =
  'https://docs.google.com/forms/d/e/1FAIpQLSc8q9HDUV_7dZMTuxq8ii2Z31yh2VSEhtpeeorKcgnn7ATfaw/formResponse';
const EMAIL_ENTRY = 'entry.442508991';
// The bare question id, as it appears in the form page's markup.
const QUESTION_ID = EMAIL_ENTRY.split('.')[1];

/* Exported for the unit test: it pins the decision to real captured responses
 * rather than to another live submission. */
export function wasRecorded(status, body) {
  return status === 200 && !String(body).includes(QUESTION_ID);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, reason: 'method' });
  }

  const raw = req.body && typeof req.body === 'object' ? req.body.email : null;
  const email = typeof raw === 'string' ? raw.trim() : '';
  // Deliberately loose — the form is the real gate. This only rejects what
  // clearly cannot be an address, so the sheet is not filled with junk.
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, reason: 'invalid' });
  }

  const body = new URLSearchParams();
  body.set(EMAIL_ENTRY, email);

  let upstream, text;
  try {
    upstream = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    text = await upstream.text();
  } catch (err) {
    // Never swallow: a dead upstream must be visible in the function logs.
    console.error('[waitlist] upstream request failed:', err);
    return res.status(502).json({ ok: false, reason: 'upstream' });
  }

  if (!wasRecorded(upstream.status, text)) {
    console.error(
      '[waitlist] NOT recorded — status=%s carriesQuestionId=%s',
      upstream.status,
      String(text).includes(QUESTION_ID)
    );
    return res.status(502).json({ ok: false, reason: 'rejected' });
  }

  return res.status(200).json({ ok: true });
}
