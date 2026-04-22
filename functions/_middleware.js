// ============================================================
// hawkacademy.co — /workshop A/B/C/D testing middleware
// Runs on Cloudflare Pages Functions at the edge.
//
// Splits /workshop traffic between multiple variants via weighted
// sampling. Assignment is sticky via cookie.
//
// To adjust traffic: change WEIGHTS (any non-negative numbers,
//   they're normalised). Set a variant's weight to 0 to exclude it.
// To force a variant for testing: append ?ab=a (or b/c/d).
// ============================================================

const CONFIG = {
  COOKIE_NAME: 'hawk-workshop-ab',
  VARIANTS: {
    a: '/workshop.html',
    b: '/workshop-b.html',
    c: '/workshop-c.html',
    d: '/workshop-d.html',
  },
  // Relative traffic weights. All traffic currently goes to A.
  // To split evenly across 4: { a: 1, b: 1, c: 1, d: 1 }
  // To split 50/50 A vs C:    { a: 1, b: 0, c: 1, d: 0 }
  WEIGHTS: { a: 1, b: 0, c: 0, d: 0 },
  COOKIE_DAYS: 30,
};

// Paths that trigger A/B routing
const AB_PATHS = new Set(['/workshop', '/workshop/', '/workshop.html']);

function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  const match = header.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return match ? match[1] : null;
}

function buildSetCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  return `${name}=${value}; Path=/; Expires=${expires}; SameSite=Lax`;
}

/**
 * Pick a variant key based on the weights map. Returns null if all
 * weights are zero (caller should fall back to 'a').
 */
function pickWeightedVariant(weights) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (const [key, w] of entries) {
    r -= w;
    if (r <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

/**
 * Count how many variants have non-zero weight. If only one, we can
 * safely ignore stale cookies (treat this as a "force single variant"
 * mode, same as the old SPLIT=0 behaviour).
 */
function activeVariantCount(weights) {
  return Object.values(weights).filter((w) => w > 0).length;
}

async function workshopAbMiddleware(context) {
  const url = new URL(context.request.url);

  if (!AB_PATHS.has(url.pathname)) {
    return context.next();
  }

  // Allow ?ab=a|b|c|d override for manual testing
  const forced = url.searchParams.get('ab');
  const cookieVariant = getCookie(context.request, CONFIG.COOKIE_NAME);
  const activeCount = activeVariantCount(CONFIG.WEIGHTS);

  let variant;
  let isNewAssignment = false;

  if (forced && CONFIG.VARIANTS[forced]) {
    variant = forced;
  } else if (activeCount <= 1) {
    // Only one variant is live — force everyone to it, ignore stale cookies
    variant = pickWeightedVariant(CONFIG.WEIGHTS) || 'a';
  } else if (cookieVariant && CONFIG.VARIANTS[cookieVariant] && CONFIG.WEIGHTS[cookieVariant] > 0) {
    // Honour existing assignment if it's still in the active pool
    variant = cookieVariant;
  } else {
    variant = pickWeightedVariant(CONFIG.WEIGHTS) || 'a';
    isNewAssignment = true;
  }

  const variantPath = CONFIG.VARIANTS[variant];
  const assetUrl = new URL(variantPath, context.request.url);
  const response = await context.env.ASSETS.fetch(assetUrl);

  const newResponse = new Response(response.body, response);
  newResponse.headers.set('X-AB-Variant', variant);

  if (isNewAssignment || forced) {
    newResponse.headers.set(
      'Set-Cookie',
      buildSetCookie(CONFIG.COOKIE_NAME, variant, CONFIG.COOKIE_DAYS)
    );
  }

  return newResponse;
}

export const onRequest = [workshopAbMiddleware];
