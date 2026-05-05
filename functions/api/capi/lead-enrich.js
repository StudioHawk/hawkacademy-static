/**
 * Cloudflare Pages Function — browser-side Meta CAPI enrichment for Workshop leads.
 *
 * Triggered by the workshop page when Typeform fires a form-submit postMessage.
 * Sends a server-side Lead event to Meta with high-quality match keys that the
 * browser pixel and the Typeform-webhook handler can't supply on their own:
 *   - client_ip_address  (from Cloudflare's cf-connecting-ip header)
 *   - client_user_agent  (from the User-Agent header)
 *   - fbc                (Facebook Click ID, captured client-side from cookie/URL)
 *   - fbp                (Facebook Browser ID, from _fbp cookie)
 *
 * Uses the same event_id as the existing Typeform-webhook handler in
 * functions/api/capi/lead.js so Meta dedupes the two events and merges
 * their match keys into a single richer Lead.
 *
 * Required env vars:
 *   META_CAPI_ACCESS_TOKEN — Conversions API token from Meta Events Manager
 * Optional env vars:
 *   META_CAPI_PIXEL_ID    — defaults to the workshop pixel if not set
 *   META_CAPI_TEST_CODE   — set while validating in Events Manager → Test Events
 *
 * Always returns 200 so a failed CAPI call never blocks the conversion UI.
 */

const META_GRAPH_VERSION = "v22.0";
const DEFAULT_PIXEL_ID = "882137468214985";
const EVENT_SOURCE_URL = "https://hawkacademy.co/workshop";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.event_id) {
      return jsonResponse({ ok: false, error: "missing event_id" }, 400);
    }

    const pixelId = env.META_CAPI_PIXEL_ID || DEFAULT_PIXEL_ID;
    if (!env.META_CAPI_ACCESS_TOKEN) {
      console.warn("lead-enrich: META_CAPI_ACCESS_TOKEN missing");
      return jsonResponse({ ok: true, skipped: "capi token missing" }, 200);
    }

    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      null;
    const ua = request.headers.get("user-agent") || null;

    const userData = {};
    if (ip) userData.client_ip_address = ip;
    if (ua) userData.client_user_agent = ua;
    if (body.fbc) userData.fbc = body.fbc;
    if (body.fbp) userData.fbp = body.fbp;
    if (body.email) userData.em = [await sha256Hex(String(body.email).toLowerCase().trim())];
    if (body.phone) userData.ph = [await sha256Hex(String(body.phone).replace(/\D/g, ""))];
    if (body.first_name) userData.fn = [await sha256Hex(String(body.first_name).toLowerCase().trim())];
    if (body.last_name) userData.ln = [await sha256Hex(String(body.last_name).toLowerCase().trim())];

    const eventPayload = {
      data: [{
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: String(body.event_id),
        action_source: "website",
        event_source_url: body.source_url || EVENT_SOURCE_URL,
        user_data: userData,
        custom_data: {
          content_name: "Workshop Application",
          ...(body.variant ? { variant: String(body.variant) } : {}),
        },
      }],
    };
    if (env.META_CAPI_TEST_CODE) {
      eventPayload.test_event_code = env.META_CAPI_TEST_CODE;
    }

    const metaUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${pixelId}/events`;
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
      console.error("lead-enrich: Meta error", metaRes.status, metaText);
      return jsonResponse({ ok: true, meta_status: metaRes.status, meta_error: metaText }, 200);
    }

    return jsonResponse({ ok: true, meta: safeParse(metaText), event_id: body.event_id }, 200);
  } catch (err) {
    console.error("lead-enrich: handler error", err && err.stack || err);
    return jsonResponse({ ok: true, error: String(err) }, 200);
  }
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return s; }
}

async function sha256Hex(input) {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
