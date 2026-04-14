// Cloudflare Pages Function — fetches a URL server-side and returns its
// title tag + meta description. Used by /tools/serp-checker.html so the user
// can paste a URL and auto-fill the snippet analyzer.
//
// GET /api/fetch-meta?url=https://example.com

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

// Decode common HTML entities in title/description values
function decodeEntities(s) {
  if (!s) return s;
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function pickMeta(html, names) {
  // Look for <meta name="X" content="Y"> or <meta property="X" content="Y">
  // in either attribute order.
  for (const name of names) {
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`<meta[^>]+(?:name|property)\\s*=\\s*["']${esc}["'][^>]*content\\s*=\\s*["']([^"']*)["']`, "i"),
      new RegExp(`<meta[^>]+content\\s*=\\s*["']([^"']*)["'][^>]*(?:name|property)\\s*=\\s*["']${esc}["']`, "i")
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m && m[1]) return decodeEntities(m[1].trim());
    }
  }
  return "";
}

export async function onRequest(context) {
  const { request } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  const url = new URL(request.url).searchParams.get("url");
  if (!url) return json({ error: "Missing ?url parameter" }, 400);

  let target;
  try {
    target = new URL(url.startsWith("http") ? url : "https://" + url);
  } catch (_) {
    return json({ error: "Invalid URL" }, 400);
  }
  if (!/^https?:$/.test(target.protocol)) {
    return json({ error: "URL must use http or https" }, 400);
  }
  // Block private address space to avoid SSRF against LAN services.
  const host = target.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "127.0.0.1" ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    host.startsWith("169.254.") ||
    host.endsWith(".internal") ||
    host.endsWith(".local")
  ) {
    return json({ error: "URL host not allowed" }, 400);
  }

  let res;
  try {
    res = await fetch(target.toString(), {
      method: "GET",
      redirect: "follow",
      headers: {
        // A realistic UA helps — some sites return 403 to default fetch
        "User-Agent": "Mozilla/5.0 (compatible; HawkAcademySnippetBot/1.0; +https://hawkacademy.co/tools/serp-checker.html)",
        "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-AU,en;q=0.9"
      },
      cf: { cacheTtl: 900, cacheEverything: true }
    });
  } catch (_) {
    return json({ error: "Could not reach the URL. Double-check it and try again." }, 502);
  }

  if (!res.ok) {
    return json({ error: `The page responded with HTTP ${res.status}.` }, 502);
  }

  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  if (contentType && !contentType.includes("html") && !contentType.includes("xml")) {
    return json({ error: "That URL didn't return an HTML page." }, 415);
  }

  // Read up to the first 500KB — everything we need lives in <head>
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const chunks = [];
  let total = 0;
  const MAX = 512 * 1024;
  while (total < MAX) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(decoder.decode(value, { stream: true }));
    total += value.byteLength;
  }
  try { await reader.cancel(); } catch (_) {}
  let html = chunks.join("");

  // Only need the head for extraction
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const head = headMatch ? headMatch[1] : html;

  let title = "";
  const titleMatch = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) title = decodeEntities(titleMatch[1].trim().replace(/\s+/g, " "));

  // Prefer <meta name="description">, then og:description, then twitter:description
  const description = pickMeta(head, ["description", "og:description", "twitter:description"]);

  // Prefer og:title as a fallback if <title> was empty
  if (!title) {
    const ogTitle = pickMeta(head, ["og:title", "twitter:title"]);
    if (ogTitle) title = ogTitle;
  }

  const canonicalMatch = head.match(/<link[^>]+rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']+)["']/i);
  const canonical = canonicalMatch ? canonicalMatch[1] : "";

  return json({
    url: res.url || target.toString(),
    finalUrl: res.url || target.toString(),
    canonical,
    title,
    description
  });
}
