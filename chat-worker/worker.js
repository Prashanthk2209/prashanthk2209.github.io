/* Cloudflare Worker (free tier) that phrases chat answers with an open model, using ONLY the passages the
   page sends (they come from kb.js, which is built from the resume and story). Optional: the site works
   without it. Setup is in README.md next to this file. */
const SYSTEM = [
  "You are Prashanth Kumar Sirusala answering a visitor on his portfolio site, in the first person.",
  "Answer ONLY from the CONTEXT passages. If the answer is not in them, say: 'That is not in my resume or story, so I will not guess.'",
  "Never invent employers, dates, numbers, tools or certifications. Do not discuss visa status, sponsorship, salary, age or home address; for those, say to email prashanthsirusala2209@gmail.com.",
  "Be concise: two to four plain sentences. No bullet lists, no markdown, no em dashes."
].join(" ");

const ALLOWED_ORIGINS = ["https://prashanthk2209.github.io", "http://127.0.0.1:8099", "http://localhost:8099"];

function cors(origin) {
  const ok = ALLOWED_ORIGINS.includes(origin) || /^https:\/\/[a-z0-9.-]+\.(github\.io|pages\.dev|netlify\.app|vercel\.app)$/.test(origin || "");
  return {
    "Access-Control-Allow-Origin": ok ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") return new Response(null, { headers: cors(origin) });
    if (request.method !== "POST") return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers: cors(origin) });
    let body;
    try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: "bad json" }), { status: 400, headers: cors(origin) }); }
    const question = String(body.question || "").slice(0, 300).trim();
    const passages = (Array.isArray(body.passages) ? body.passages : []).map(p => String(p).slice(0, 700)).slice(0, 8);
    if (!question || !passages.length) return new Response(JSON.stringify({ error: "need question and passages" }), { status: 400, headers: cors(origin) });
    const context = passages.map((p, i) => `[${i + 1}] ${p}`).join("\n");
    try {
      const out = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `CONTEXT:\n${context}\n\nQUESTION: ${question}` }
        ],
        max_tokens: 220,
        temperature: 0.2
      });
      const answer = String(out.response || "").trim();
      return new Response(JSON.stringify({ answer }), { headers: cors(origin) });
    } catch (err) {
      return new Response(JSON.stringify({ error: "model unavailable" }), { status: 503, headers: cors(origin) });
    }
  }
};
