# Optional: let an open model phrase the chat answers (free)

The chat box already works with no server: it finds the matching passages from `kb.js` in the
visitor's browser and shows them. This worker is an upgrade, not a requirement. With it, the same
passages are sent to Llama 3.1 8B on Cloudflare Workers AI, which writes a short first-person
answer from them and nothing else. Cloudflare's free plan includes 10,000 "neurons" a day, which is
roughly a few hundred chat answers, and no card is needed.

## Set it up in the Cloudflare dashboard (no CLI)

1. Sign in at <https://dash.cloudflare.com> (free account).
2. Left menu: **Compute (Workers)** -> **Create** -> **Start with Hello World** -> name it `portfolio-chat` -> **Deploy**.
3. Open the worker -> **Edit code**. Replace everything with the contents of `worker.js` -> **Deploy**.
4. Worker -> **Settings** -> **Bindings** -> **Add** -> **Workers AI** -> variable name `AI` -> **Deploy**.
5. Copy the worker URL, for example `https://portfolio-chat.<your-subdomain>.workers.dev`.
6. In `index.html`, set the endpoint just before `chat.js` loads:

   ```html
   <script>window.PORTFOLIO_CHAT = { endpoint: "https://portfolio-chat.<your-subdomain>.workers.dev" };</script>
   ```

7. In `worker.js`, add your site's final URL to `ALLOWED_ORIGINS` if it is not a github.io,
   pages.dev, netlify.app or vercel.app address, and deploy the worker again.

If the worker is down, slow (over 12 seconds) or over its free quota, the page falls back to the
local answer automatically, so visitors never see an error.

## Guardrails

- The system prompt tells the model to answer only from the passages and to say so when the answer
  is not there. It never sees anything but `kb.js` text, which is generated from the resume and story.
- Visa, sponsorship, salary, age and address questions are intercepted in the browser before any
  request is made, and the model is told to redirect them to email as well.
