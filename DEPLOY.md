# Deploying hawkacademy.co

## TL;DR

```bash
cd /Users/lawrence/hawkacademy-static
git add -A && git commit -m "Your commit message" && git push origin master
CLOUDFLARE_ACCOUNT_ID=d80bec43479ae1112565a3d926c83d93 wrangler pages deploy . --project-name=hawkacademy-static --branch=main --commit-dirty=true --commit-message="Your commit message"
```

Then purge Cloudflare cache (via browser — see step 3 below).

---

## Context

- **Domain:** hawkacademy.co
- **Cloudflare account:** StudioHawk Developer (ID: `d80bec43479ae1112565a3d926c83d93`)
- **Cloudflare Pages project:** `hawkacademy-static`
- **Production branch:** `main` (NOT `master` — wrangler needs `--branch=main` even though git is on `master`)
- **GitHub repo:** `StudioHawk/hawkacademy-static` on branch `master`
- **Local path:** `/Users/lawrence/hawkacademy-static`
- **Custom domain:** `hawkacademy.co` (already DNS-configured, SSL active)

## Critical gotchas

1. **Wrangler OAuth token does NOT have `Zone:Cache Purge` permission.** Cache must be purged via browser dashboard (see below) or via an API token with explicit cache purge scope.
2. **`--branch=main`** flag is required even though you're on git `master` — Cloudflare Pages has `main` set as production, and deploying to any other branch name creates a preview deployment, not production.
3. **ASCII-only commit messages** — wrangler will reject commit messages containing em dashes or other non-UTF-8-safe characters. Use plain hyphens.
4. **No CF_API_TOKEN env var is set** — wrangler uses OAuth from `~/Library/Preferences/.wrangler/config/default.toml`. If `wrangler whoami` fails, re-run `wrangler login`.

## Full deploy sequence

### 1. Commit changes to git

```bash
cd /Users/lawrence/hawkacademy-static
git add -A
git commit -m "Short descriptive message using plain ASCII only"
git push origin master
```

### 2. Deploy to Cloudflare Pages

```bash
CLOUDFLARE_ACCOUNT_ID=d80bec43479ae1112565a3d926c83d93 \
  wrangler pages deploy . \
    --project-name=hawkacademy-static \
    --branch=main \
    --commit-dirty=true \
    --commit-message="Short ASCII-only message"
```

Expected output:
```
✨ Compiled Worker successfully
Uploading... (X/Y)
✨ Success! Uploaded X files (Y already uploaded)
✨ Uploading _redirects
✨ Uploading Functions bundle
🌎 Deploying...
✨ Deployment complete! Take a peek over at https://[hash].hawkacademy-static.pages.dev
```

### 3. Purge Cloudflare cache (via browser)

Needed so users pulling cached HTML/CSS get the fresh version. Go to:

```
https://dash.cloudflare.com/d80bec43479ae1112565a3d926c83d93/hawkacademy.co/caching/configuration
```

Click **Purge Everything** → confirm in the dialog.

Green banner: *"Purge request successfully received. Changes should take effect in less than 5 seconds."*

**Note:** The HTML pages use `?v=YYYYMMDD` cache-busting on CSS links, so stylesheet changes propagate automatically. Cache purge is still needed for HTML pages themselves and for JS.

### 4. Verify deployment

Quick sanity check:
```bash
curl -sL "https://hawkacademy.co/seo-tools/ai-visibility" | grep -o "<title>[^<]*</title>"
```

Should return the fresh page title. If it returns stale content, wait 5 seconds and retry (Cloudflare's edge can take a moment to clear).

Spot check the key routes:
```bash
for url in seo-tools/ai-visibility claude-seo-skills/ai-visibility seo-guides/eeat-explained; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://hawkacademy.co/$url")
  echo "$url: $code"
done
```

All should return 200.

## Cache-busting CSS changes

The repo uses `?v=YYYYMMDD` query strings on `<link rel="stylesheet">` tags to force browsers to re-fetch CSS after a deploy. If you're making a meaningful CSS change that users need to see immediately (e.g., a layout bug fix), bump the version:

```bash
# Run this after editing css/styles.css or css/animations.css
python3 -c "
import glob, re, time
from pathlib import Path

new_v = time.strftime('v=%Y%m%d')
files = glob.glob('**/*.html', recursive=True)
files = [f for f in files if '.git' not in f and '.wrangler' not in f]

count = 0
for fp in files:
    content = Path(fp).read_text()
    new = re.sub(r'(styles\.css|animations\.css)\?v=\d+', r'\1?' + new_v.split('=')[1], content)
    new = re.sub(r'(styles\.css|animations\.css)\?v=[a-zA-Z0-9]+', r'\1?' + new_v.split('=')[1], new)
    if new != content:
        Path(fp).write_text(new)
        count += 1
print(f'Updated {count} files to {new_v}')
"
```

Then commit + deploy as usual.

## Rollback

If a deploy breaks production:

1. In the Cloudflare dashboard → Workers & Pages → `hawkacademy-static` → **Deployments** tab
2. Find the last known-good deployment
3. Click the three-dot menu → **Rollback to this deployment**
4. Confirm

Or redeploy a specific git commit:
```bash
git checkout [commit-sha]
CLOUDFLARE_ACCOUNT_ID=d80bec43479ae1112565a3d926c83d93 \
  wrangler pages deploy . --project-name=hawkacademy-static --branch=main --commit-dirty=true
git checkout master
```

## Permanent fix for the cache-purge-via-browser step

Create a Cloudflare API token with `Zone:Cache Purge` scoped to `hawkacademy.co` at:
https://dash.cloudflare.com/profile/api-tokens

Then add to your shell profile:
```bash
export CLOUDFLARE_API_TOKEN="your-token-here"
```

After that, cache purge can be scripted:
```bash
ZONE_ID="2481853bb5ad1a91b0b88ddaef2ab8b5"  # hawkacademy.co zone
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```
