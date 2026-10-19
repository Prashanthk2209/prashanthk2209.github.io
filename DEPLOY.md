# Deploying the portfolio

This folder is a complete static site. There is no build step: `index.html`, `styles.css`, `app.js`,
`data.js`, `og.png` and `Prashanth_kumar_sirusala.pdf` are served as they are. Tailwind, Lucide and
the Inter / JetBrains Mono fonts load from CDNs at runtime.

## Preview locally

```
cd "/Users/prashanthsirusala/Documents/Job search/jobsearch/portfolio"
python3 -m http.server 8099
```

Open <http://127.0.0.1:8099/>. Stop the server with Ctrl+C.

## Before the first deploy

1. Edit the content in `data.js` if anything changed. Markup never needs touching.
2. After you know the final URL, replace `https://your-domain.example/` in `index.html` (canonical,
   `og:url`, `og:image`, `twitter:image`) and in `data.js` (`meta.canonical`). Search for
   `your-domain.example` to find every spot.
3. Replace `Prashanth_kumar_sirusala.pdf` whenever the master resume changes. Keep the file name.

## Vercel (drag and drop, no CLI needed)

1. Sign in at <https://vercel.com> (GitHub, GitLab or email).
2. Dashboard -> **Add New...** -> **Project**.
3. Pick **Deploy without Git**: drag this `portfolio` folder onto the upload area. (If the option is not
   visible, zip the folder first and drop the zip.)
4. Framework preset: **Other**. Build command: leave empty. Output directory: leave empty (root).
5. Press **Deploy**. Vercel gives you `https://<project>.vercel.app` in about a minute.
6. To update: open the project -> **Deployments** -> **Create deployment** and drop the folder again, or
   push to the connected Git repository if you connect one later.

Vercel CLI alternative (needs Node.js, which this Mac does not have yet):
`npx vercel --prod` from inside the folder.

## Netlify (drag and drop)

1. Sign in at <https://app.netlify.com>.
2. **Sites** -> **Add new site** -> **Deploy manually**.
3. Drag the `portfolio` folder onto the drop zone. Netlify publishes it at
   `https://<random-name>.netlify.app`.
4. **Site configuration** -> **Change site name** to pick a readable subdomain, for example
   `prashanth-sirusala.netlify.app`.
5. To update: open the site -> **Deploys** -> drag the folder again.

Optional `netlify.toml` (not required; the defaults already serve the folder root):

```
[build]
  publish = "."
```

## Custom domain

Both hosts handle HTTPS automatically once DNS points at them.

- Buy the domain (Namecheap, Cloudflare Registrar, Google Domains successor Squarespace, etc.).
- Vercel: project -> **Settings** -> **Domains** -> add `yourdomain.com`. Vercel shows the records to
  create: an `A` record to `76.76.21.21` for the apex and a `CNAME` for `www` to
  `cname.vercel-dns.com`. Follow the exact values on that page; they are authoritative.
- Netlify: site -> **Domain management** -> **Add a domain**. Either move DNS to Netlify DNS (simplest)
  or create the `A` / `CNAME` records it lists (`apex-loadbalancer.netlify.com` for the apex and
  `<site>.netlify.app` for `www`).
- DNS changes take minutes to a few hours. When the dashboard shows the certificate as issued, update
  the canonical and Open Graph URLs (see "Before the first deploy") and redeploy.

## Checking a deploy

- Open the URL on a phone and a laptop; toggle the theme button.
- Press **Download Resume**; the PDF must download, not 404.
- Paste the URL into LinkedIn's post composer; the preview should show `og.png` with the name and headline.
- Run Lighthouse in Chrome DevTools (Performance, Accessibility, SEO). The site has no images other than
  `og.png`, which is not loaded by the page, so scores should be high.

## Converting to Next.js later (once Node.js is installed)

The site was built so that this is a mechanical port: content already lives in one object (`data.js`)
and all rendering is in `app.js`.

1. Install Node.js 20+ (<https://nodejs.org> installer, no Homebrew needed) and check `node -v`.
2. Create the app next to this folder:
   `npx create-next-app@latest portfolio-next --typescript --tailwind --app --eslint --src-dir`.
3. Move content: copy `data.js` to `src/data/portfolio.ts`, change `window.PORTFOLIO = {` to
   `export const PORTFOLIO = {` and add `as const` at the end if you want literal types.
4. Move styles: paste `styles.css` into `src/app/globals.css` below the Tailwind directives. The
   `brand` palette and fonts from the inline `tailwind.config` in `index.html` go into
   `tailwind.config.ts` (`theme.extend.colors.brand`, `theme.extend.fontFamily`). Load fonts with
   `next/font/google` (Inter, JetBrains Mono) instead of the `<link>` tags.
5. Split `app.js` into components under `src/components/`: `Header`, `Hero`, `About`, `Skills`,
   `Projects` (with a `CaseStudy` using the same `<details>` element), `Experience`, `Education`,
   `Achievements`, `ResumeCta`, `Contact`, `Footer`. Each component takes the matching slice of
   `PORTFOLIO` as props. The HTML strings become JSX one to one; the `esc()` helper is no longer needed
   because React escapes by default.
6. Icons: `npm i lucide-react` and replace `<i data-lucide="x">` with `<X />` imports. Keep the two
   inline SVGs for LinkedIn and GitHub (Lucide has no brand icons).
7. Theme toggle: `npm i next-themes`, wrap `layout.tsx` in `<ThemeProvider attribute="class">` and
   replace the toggle code; it also persists to localStorage.
8. Metadata: move the `<title>`, description and Open Graph tags into the `metadata` export in
   `src/app/layout.tsx`; put `og.png` and the PDF in `public/`.
9. Reveal animation and the active nav link stay as a small `useEffect` with `IntersectionObserver`
   inside a client component (`'use client'`).
10. `npm run build` then deploy to Vercel (`npx vercel --prod`) or Netlify (it detects Next.js).

## Chat box ("Ask me") and voice

- `kb.js` is the chat's only knowledge. Regenerate it after any resume or story change:
  `python3 build_kb.py` from this folder. `chat.js` does retrieval in the browser, so the site stays
  static and free. Voice input is Whisper (open source) running in the browser through transformers.js,
  loaded on the first mic press (about 40 MB, cached by the browser). If that cannot load, the browser's
  own speech recognizer is used, and typing always works.
- Optional free upgrade so an open model phrases the answers: `chat-worker/README.md`.

## GitHub Pages (free, HTTPS, custom domain supported)

The `gh` CLI on this Mac is signed in as `Prashanthk2209`, so this can be run from the terminal:

```
cd "/Users/prashanthsirusala/Documents/Job search/jobsearch/portfolio"
git init -b main && git add . && git commit -m "Portfolio"
~/.local/bin/gh repo create prashanthk2209.github.io --public --source=. --push
```

GitHub serves a repository named `<user>.github.io` at `https://prashanthk2209.github.io/` within a
minute or two (Settings -> Pages shows the status). Later updates: `git add -A && git commit -m "update" && git push`.

## Domain names

- `prashanthkumar.com` is registered to someone else (GoDaddy, since 2020), so it is not available.
- `prashanthsirusala.com` is unregistered. Domains are never free: about $10-12 a year at Cloudflare
  Registrar or Porkbun. After buying it: GitHub repo -> Settings -> Pages -> Custom domain ->
  `prashanthsirusala.com`; at the registrar add four A records to 185.199.108.153, 185.199.109.153,
  185.199.110.153, 185.199.111.153 and a CNAME `www` -> `prashanthk2209.github.io`. Tick "Enforce HTTPS"
  once the check passes. Also add the domain to `ALLOWED_ORIGINS` in `chat-worker/worker.js` if the
  worker is used.
- Free for ever, no purchase: `https://prashanthk2209.github.io/`. That is the address to put on the
  resume until a domain is bought.
