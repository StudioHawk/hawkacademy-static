/**
 * Cloudflare Pages Function — Meta Conversions API endpoint for Workshop leads.
 *
 * Receives Typeform webhook POSTs at /api/capi/lead. Maps the monthly-revenue
 * answer to a value, hashes PII (email, phone, name), and POSTs to Meta's
 * Conversions API using the Typeform response token as event_id so Meta
 * dedupes against the browser pixel that fires on /confirmation.
 *
 * Required env vars (Cloudflare Pages → Settings → Environment variables):
 *   META_CAPI_PIXEL_ID       — 882137468214985
 *   META_CAPI_ACCESS_TOKEN   — Conversions API token from Meta Events Manager
 *
 * Recommended env vars:
 *   TYPEFORM_WEBHOOK_SECRET  — secret you set on the Typeform webhook so we can verify signatures
 *   META_CAPI_TEST_CODE      — set to a test_event_code while validating in Events Manager → Test Events; remove for prod
 *
 * Always returns 200 to Typeform (even on Meta errors) so Typeform doesn't
 * retry-storm us. Errors are logged for inspection in CF dashboard.
 */

const META_GRAPH_VERSION = "v19.0";
const EVENT_SOURCE_URL = "https://hawkacademy.co/workshop";

// Map the field 4 (monthly revenue) answer label → AUD value passed to Meta.
// A & B → low/zero (filter out via Custom Conversion). C–G → 3500 (qualified).
const REVENUE_VALUE_MAP = {
  "Not generating revenue yet": 0,
  "Under $10k/month": 1000,
  "$10k - $25k/month": 3500,
  "$25k - $50k/month": 3500,
  "$50k - $100k/month": 3500,
  "$100k - $500k/month": 3500,
  "Over $500k/month": 3500,
};

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const rawBody = await request.text();

    // 1. Verify Typeform webhook signature (skip if secret not yet configured)
    if (env.TYPEFORM_WEBHOOK_SECRET) {
      const sigHeader = request.headers.get("Typeform-Signature") || "";
      const valid = await verifyTypeformSignature(rawBody, sigHeader, env.TYPEFORM_WEBHOOK_SECRET);
      if (!valid) {
        return jsonResponse({ ok: false, error: "invalid signature" }, 401);
      }
    } else {
      console.warn("CAPI: TYPEFORM_WEBHOOK_SECRET not set — accepting unverified webhook");
    }

    // 2. Parse webhook payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return jsonResponse({ ok: false, error: "invalid json" }, 400);
    }

    const formResponse = payload.form_response;
    if (!formResponse) {
      return jsonResponse({ ok: false, error: "missing form_response" }, 400);
    }

    const eventId = formResponse.token;
    const answers = formResponse.answers || [];

    // 3. Determine value from monthly revenue answer
    const revenueLabel = findChoiceLabelInMap(answers, REVENUE_VALUE_MAP);
    if (revenueLabel === null) {
      console.warn("CAPI: no recognised revenue answer — skipping");
      return jsonResponse({ ok: true, skipped: "no revenue answer" }, 200);
    }
    const value = REVENUE_VALUE_MAP[revenueLabel];

    // 4. Pull PII for matching
    const email = findAnswerByType(answers, "email");
    const phone = findAnswerByType(answers, "phone_number");
    const name = findFullName(answers);

    const userData = {};
    if (email) userData.em = [await sha256Hex(email.toLowerCase().trim())];
    if (phone) userData.ph = [await sha256Hex(normalizePhone(phone))];
    if (name.first) userData.fn = [await sha256Hex(name.first.toLowerCase().trim())];
    if (name.last) userData.ln = [await sha256Hex(name.last.toLowerCase().trim())];

    // 5. If Meta creds aren't set yet, ack and stop here
    if (!env.META_CAPI_PIXEL_ID || !env.META_CAPI_ACCESS_TOKEN) {
      console.warn("CAPI: META_CAPI creds missing — skipping Meta send");
      return jsonResponse({
        ok: true,
        skipped: "capi creds missing",
        debug: { value, eventId, hasEmail: !!email, hasPhone: !!phone },
      }, 200);
    }

    // 6. POST to Meta Conversions API
    const eventPayload = {
      data: [{
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: EVENT_SOURCE_URL,
        user_data: userData,
        custom_data: {
          currency: "AUD",
          value,
          content_name: "Workshop Application",
        },
      }],
    };
    if (env.META_CAPI_TEST_CODE) {
      eventPayload.test_event_code = env.META_CAPI_TEST_CODE;
    }

    const metaUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${env.META_CAPI_PIXEL_ID}/events`;
    const metaRes = await fetch(metaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.META_CAPI_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(eventPayload),
    });

    const metaText = await metaRes.text();
    if (!metaRes.ok) {
      console.error("CAPI: Meta error", metaRes.status, metaText);
      return jsonResponse({ ok: true, meta_status: metaRes.status, meta_error: metaText }, 200);
    }

    return jsonResponse({ ok: true, meta: safeParse(metaText), eventId, value }, 200);
  } catch (err) {
    console.error("CAPI: handler error", err && err.stack || err);
    return jsonResponse({ ok: true, error: String(err) }, 200);
  }
}

/* ---------- helpers ---------- */

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return s; }
}

async function verifyTypeformSignature(rawBody, sigHeader, secret) {
  // Typeform sends: Typeform-Signature: sha256=<base64>
  if (!sigHeader.startsWith("sha256=")) return false;
  const provided = sigHeader.slice(7);

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));

  if (provided.length !== computed.length) return false;
  let mismatch = 0;
  for (let i = 0; i < provided.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ computed.charCodeAt(i);
  }
  return mismatch === 0;
}

async function sha256Hex(input) {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizePhone(raw) {
  // Typeform's phone_number field stores in E.164 ("+61412345678").
  // Meta wants digits only, country code included. Strip everything non-digit.
  return String(raw).replace(/\D/g, "");
}

function findChoiceLabelInMap(answers, map) {
  for (const a of answers) {
    if (a.type === "choice" && a.choice && a.choice.label && a.choice.label in map) {
      return a.choice.label;
    }
  }
  return null;
}

function findAnswerByType(answers, type) {
  const a = answers.find((x) => x.type === type);
  if (!a) return null;
  return a[type] || null;
}

function findFullName(answers) {
  for (const a of answers) {
    const title = ((a.field && a.field.title) || "").toLowerCase();
    if (a.type === "text" && title.includes("name") && a.text) {
      const parts = String(a.text).trim().split(/\s+/);
      if (parts.length >= 2) return { first: parts[0], last: parts.slice(1).join(" ") };
      return { first: parts[0] || "", last: "" };
    }
  }
  return { first: "", last: "" };
}
