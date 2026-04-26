# NeuroSentinel — PWA + Serverless Proxy

Static PWA (`index.html` + service worker) with a serverless function at `/api/chat`
that proxies to the Anthropic Messages API. The browser never sees `ANTHROPIC_API_KEY`.

## Layout

```
.
├── api/chat.js              # Vercel serverless function — proxy to Anthropic
├── icons/                   # PWA icons (192, 512)
├── index.html               # App shell (calls /api/chat)
├── manifest.webmanifest     # PWA manifest
├── sw.js                    # Service worker (offline shell, never caches /api/*)
├── vercel.json              # Headers for SW + manifest + API
├── package.json
└── .env.example
```

## Local development

```bash
npm i -g vercel
vercel link               # link to a Vercel project
vercel env add ANTHROPIC_API_KEY  # paste your key (Development scope)
vercel dev                # serves index.html + runs /api/chat locally
```

## Deploy via GitHub + Vercel (recommended)

1. **Create the GitHub repo** (GitHub CLI):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: NeuroSentinel PWA"
   gh repo create neurosentinel-pwa --public --source=. --remote=origin --push
   ```
   Or use the GitHub web UI, then:
   ```bash
   git remote add origin https://github.com/<you>/neurosentinel-pwa.git
   git branch -M main
   git push -u origin main
   ```

2. **Import the repo into Vercel** at <https://vercel.com/new>
   - Framework preset: **Other**
   - Build/output: leave empty (static site + `api/` functions auto-detected)

3. **Add the environment variable** in Vercel → Project → Settings → Environment Variables:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your real Anthropic key
   - Scope: Production, Preview, Development

4. **Deploy**. Vercel will auto-deploy on each `git push` to `main`. To force-deploy from
   the CLI:
   ```bash
   vercel --prod
   ```

## Security notes

- The API key lives only in Vercel's encrypted env store; the browser sees `/api/chat`.
- The service worker explicitly skips caching for `/api/*` so responses are never persisted.
- `vercel.json` sets `Cache-Control: no-store` on the proxy.
