/* tts-worker.js - runs Kokoro-82M off the main thread so the page, the wake-word listener and audio playback never
   stall while a sentence is being synthesized. One job at a time (the ONNX session is not re-entrant), taken from a
   priority queue: 0 = an answer being spoken now, 1 = speculative (the question is still being spoken, fillers),
   2 = background precache. Messages in:  warm | gen {id,text,voice,prio} | prio {id,prio} | drop {ids}.
   Messages out: progress {pct} | ready | failed {error} | audio {id,data,rate,ms} | error {id,error}. */
import { KokoroTTS } from 'https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm';

const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
let tts = null, loading = null, busy = false, seq = 0;
const queue = [];

function load() {
  if (!loading) {
    loading = KokoroTTS.from_pretrained(MODEL, {
      dtype: 'q8', device: 'wasm',
      progress_callback: (p) => {
        if (p && p.status === 'progress' && p.file && /onnx/.test(p.file)) { postMessage({ type: 'progress', pct: Math.round(p.progress || 0) }); }
      }
    }).then((t) => { tts = t; postMessage({ type: 'ready' }); pump(); return t; })
      .catch((err) => { postMessage({ type: 'failed', error: String((err && err.message) || err) }); throw err; });
  }
  return loading;
}

async function pump() {
  if (busy || !tts || !queue.length) { return; }
  queue.sort((a, b) => a.prio - b.prio || a.seq - b.seq);
  const job = queue.shift();
  busy = true;
  try {
    const t0 = performance.now();
    const audio = await tts.generate(job.text, { voice: job.voice, speed: job.speed || 1 });
    const data = new Float32Array(audio.audio);     // own buffer, so it can be transferred without a copy on the way out
    postMessage({ type: 'audio', id: job.id, data, rate: audio.sampling_rate || 24000, ms: Math.round(performance.now() - t0) }, [data.buffer]);
  } catch (err) {
    postMessage({ type: 'error', id: job.id, error: String((err && err.message) || err) });
  }
  busy = false;
  // Yield to the event loop before the next job: generate() barely yields, so calling pump() directly would drain the
  // whole queue before any new message (a live answer, a priority bump) is even read.
  setTimeout(pump, 0);
}

onmessage = (e) => {
  const m = e.data || {};
  if (m.type === 'warm') {
    load().catch(() => {});
  } else if (m.type === 'gen') {
    queue.push({ id: m.id, text: m.text, voice: m.voice, speed: m.speed, prio: m.prio || 0, seq: seq++ });
    load().then(pump, () => {});
  } else if (m.type === 'prio') {
    const job = queue.find((j) => j.id === m.id);
    if (job && m.prio < job.prio) { job.prio = m.prio; }
  } else if (m.type === 'drop') {
    for (let i = queue.length - 1; i >= 0; i--) {
      if (m.ids.indexOf(queue[i].id) >= 0) { postMessage({ type: 'error', id: queue[i].id, error: 'dropped' }); queue.splice(i, 1); }
    }
  }
};
