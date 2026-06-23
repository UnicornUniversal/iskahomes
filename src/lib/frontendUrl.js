export function getFrontendUrl() {
  const base =
    process.env.FRONTEND_LINK ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_FRONTEND_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://iskahomes.com'

  return base.replace(/\/+$/, '')
}

export function buildFrontendUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getFrontendUrl()}${normalizedPath}`
}
