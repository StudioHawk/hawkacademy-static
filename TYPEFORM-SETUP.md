# Typeform → Meta Pixel + Conversions API setup

End-to-end setup for the Workshop application form. Browser pixel + server-side CAPI deduplicate via the Typeform `response_id` so each lead counts once.

**Pixel ID:** `882137468214985`
**Worker endpoint:** `https://hawkacademy.co/api/capi/lead`
**Redirect target:** `https://hawkacademy.co/confirmation`

---

## What gets fired

| Tier | Field 4 answer | Value (AUD) | Treatment |
|---|---|---|---|
| A | Not generating revenue yet | `0` | Filtered out (Custom Conversion `value > 0`) |
| B | Under $10k/month | `1000` | Qualified — low |
| C–G | $10k+ tiers | `3500` | Qualified |

In **Meta Events Manager → Custom Conversions**, create:
- **Workshop Lead — Qualified**: `Lead` event where `value > 0` (catches B + C–G)
- *(optional)* **Workshop Lead — High Value**: `Lead` event where `value >= 3500` (C–G only)

Run **Sales / Leads** campaigns optimised for "Workshop Lead — Qualified".

---

## 1. Cloudflare environment variables

Cloudflare Pages dashboard → `hawkacademy-static` project → Settings → Environment variables → **Production**.

Add:

| Variable | Value | Encryption |
|---|---|---|
| `META_CAPI_PIXEL_ID` | `882137468214985` | Plaintext |
| `META_CAPI_ACCESS_TOKEN` | (from Meta — see step 2) | **Encrypted** |
| `TYPEFORM_WEBHOOK_SECRET` | any random string you choose (e.g. `openssl rand -hex 32`) | **Encrypted** |
| `META_CAPI_TEST_CODE` | leave unset for prod, set to e.g. `TEST12345` while validating | Plaintext |

Save and redeploy (env var changes only take effect on the next deploy).

---

## 2. Generate the Meta CAPI access token

1. Go to **Meta Events Manager** → select the pixel (882137468214985).
2. Click **Settings** tab → scroll to **Conversions API**.
3. Click **Generate access token**.
4. Copy the token (you only see it once). Paste into Cloudflare as `META_CAPI_ACCESS_TOKEN`.

> If you also want `fbp` / `fbc` cookies sent server-side later (boosts match rate), you'll need a small bit of JS on /workshop that reads the cookies and pushes them into Typeform Hidden Fields. Skipped for v1 — email + phone + name match is plenty.

---

## 3. Typeform: Calculated Field for value

Open the form → **Logic** → **Variables** → **Add variable**.

- Name: `value`
- Type: Number
- Default: `0`

Then **Logic** → **Add logic** to field 4 ("Roughly, what does your business turn over per month?"):

| If field 4 is | Then `value` = |
|---|---|
| Not generating revenue yet | `0` |
| Under $10k/month | `1000` |
| $10k - $25k/month | `3500` |
| $25k - $50k/month | `3500` |
| $50k - $100k/month | `3500` |
| $100k - $500k/month | `3500` |
| Over $500k/month | `3500` |

> The CAPI worker has the same mapping baked in server-side (`REVENUE_VALUE_MAP` in `functions/api/capi/lead.js`) — that's the source of truth for Meta. The Typeform variable is only for passing the value to the redirect URL so the browser pixel matches.

---

## 4. Typeform: Redirect on completion

**Endings** → edit the existing thank-you screen → **Redirect to URL**:

```
https://hawkacademy.co/confirmation?first_name={{field:NNNN}}&city={{field:NNNN}}&value={{var:value}}&event_id={{form:response_id}}
```

Replace `{{field:NNNN}}` with the actual field references for first name and city (the Typeform editor inserts these from the **Recall information** menu — open it, pick the field, it inserts the right ref).

`{{form:response_id}}` and `{{var:value}}` are built-in — they autocomplete in the Recall menu under "Variables" and "Form".

---

## 5. Typeform: Webhook → CAPI Worker

**Connect** panel (in form editor) → **Webhooks** → **Add a webhook**.

- Endpoint URL: `https://hawkacademy.co/api/capi/lead`
- Secret: paste the same value you put into Cloudflare as `TYPEFORM_WEBHOOK_SECRET`
- Toggle **On**

Click **View deliveries** to inspect payloads after testing.

---

## 6. Test it

### A. Test the redirect + browser pixel

1. Open the workshop page in an incognito window with the [Meta Pixel Helper](https://chromewebstore.google.com/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc) extension.
2. Submit the form with **a real email** (you can re-use yours).
3. After redirect, the URL should look like `…/confirmation?first_name=Harry&city=Melbourne&value=3500&event_id=abc123…`
4. In Pixel Helper, you should see:
   - `PageView` (from the base pixel)
   - `Lead` with `value: 3500`, `currency: AUD`, **and an `eventID`**

### B. Test the CAPI hit

1. In **Events Manager → Test Events**, copy the test code (e.g. `TEST12345`).
2. Set `META_CAPI_TEST_CODE = TEST12345` in Cloudflare → redeploy.
3. Submit the form again.
4. Within 30 seconds, you should see a **Lead** event in the Test Events tab tagged "Server" — same `event_id` as the browser hit.
5. **Browser + Server should dedupe**: Test Events shows them as one event with both sources.

If Test Events shows two separate Lead events, the `event_id` mismatch is the problem — check that the redirect URL uses `{{form:response_id}}` and the worker is using `formResponse.token`.

Once verified: **remove `META_CAPI_TEST_CODE`** from Cloudflare and redeploy. Production traffic stops being routed to the test sandbox.

---

## 7. Find Typeform field references (for first_name / city)

You don't need refs for email/phone/name — the worker matches by question type. You DO need refs for any field you put into the redirect URL (first_name, city).

**Easiest method (in Typeform editor):**

1. In the redirect URL field, type `{{` — Typeform shows a **Recall information** menu.
2. Pick the question (e.g. "What's your first name?") → it inserts the proper `{{field:LONG_REF_HERE}}` token.

**Alternative (find ref manually):**

1. Open the form editor and click the question.
2. Click the gear icon → **Question type**.
3. Scroll to **Reference** (sometimes called "Question reference"). The string there is the ref.
4. Use it as `{{field:that-ref}}` in the redirect URL.

---

## Match-rate quick wins (do these later)

These improve CAPI match rate from ~50% → ~85%+:

- **Pass `fbc` / `fbp` cookies** — add a small JS on /workshop that reads `document.cookie` and pushes `fbc`/`fbp` into Typeform Hidden Fields, then read them in the worker and include in `user_data`.
- **Pass `client_user_agent` and `client_ip_address`** — same Hidden Field trick, set from `navigator.userAgent` and a server endpoint that returns the client's IP.
- **Hash city + country** — already collected. Add to `user_data` in the worker (`ct`, `country` keys).

Skip until you've validated the pipeline end-to-end.
