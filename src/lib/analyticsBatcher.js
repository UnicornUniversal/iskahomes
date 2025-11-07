const BUFFER = []
let timer = null

// Hybrid flushing: size threshold OR time threshold (whichever comes first)
const FLUSH_MS = 3000 // backstop for low-traffic sessions
const MAX_BATCH = 200  // target batch size for high-traffic sessions
const ENDPOINT = '/api/ingest/posthog'

// Only send JSON header from the client. Our ingest route enforces a
// server-side secret (POSTHOG_WEBHOOK_SECRET) only when configured.
// If you later want to add a header, pass it via flushNow(customHeaders).
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json'
}

export function queueEvent(eventLike) {
  if (!eventLike || typeof eventLike !== 'object') return
  BUFFER.push(eventLike)

  if (BUFFER.length >= MAX_BATCH) {
    flushNow()
    return
  }

  if (!timer) {
    timer = setTimeout(flushNow, FLUSH_MS)
  }
}

export async function flushNow(customHeaders) {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (!BUFFER.length) return

  const batch = BUFFER.splice(0, BUFFER.length)
  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { ...(customHeaders || {}), ...DEFAULT_HEADERS },
      body: JSON.stringify({ events: batch })
    })
  } catch (_) {
    // Optional lightweight retry policy could be added here
  }
}

export function flushOnUnload() {
  if (!BUFFER.length) return
  try {
    const payload = JSON.stringify({ events: BUFFER.splice(0) })
    const blob = new Blob([payload], { type: 'application/json' })
    navigator.sendBeacon(ENDPOINT, blob)
  } catch (_) {
    // ignore
  }
}

export function initBatcher() {
  if (typeof window === 'undefined') return
  const onBeforeUnload = () => flushOnUnload()
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') flushOnUnload()
  }
  window.addEventListener('beforeunload', onBeforeUnload)
  document.addEventListener('visibilitychange', onVisibility)
  return () => {
    window.removeEventListener('beforeunload', onBeforeUnload)
    document.removeEventListener('visibilitychange', onVisibility)
  }
}

