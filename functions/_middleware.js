// ============================================================
// hawkacademy.co — Workshop page A/B testing middleware
// Runs on Cloudflare Pages Functions at the edge.
//
// Splits /workshop traffic between workshop.html (A) and
// workshop-b.html (B). Assignment is sticky via cookie.
//
// To adjust traffic: change CONFIG.SPLIT (0 = all A, 1 = all B)
// To force a variant for testing: append ?ab=a or ?ab=b
// ============================================================

const CONFIG = {
  COOKIE_NAME: 'hawk-workshop-ab',
  VARIANTS: {
    a: '/workshop.html',
    b: '/workshop-b.html',
  },
  SPLIT: 0.5,        // probability of being assigned variant B
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

async function workshopAbMiddleware(context) {
  const url = new URL(context.request.url);

  if (!AB_PATHS.has(url.pathname)) {
    return context.next();
  }

  // Allow ?ab=a or ?ab=b override for manual testing
  const forced = url.searchParams.get('ab');
  let variant = forced && CONFIG.VARIANTS[forced] ? forced : getCookie(context.request, CONFIG.COOKIE_NAME);
  let isNewAssignment = false;

  if (!variant || !CONFIG.VARIANTS[variant]) {
    variant = Math.random() < CONFIG.SPLIT ? 'b' : 'a';
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
