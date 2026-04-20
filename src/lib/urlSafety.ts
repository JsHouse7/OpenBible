/**
 * Basic SSRF protections for server-side fetch of user-supplied URLs (literature import).
 */
export function assertPublicHttpUrl(input: string): URL {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    throw new Error('Invalid URL')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http and https URLs are allowed')
  }

  const host = url.hostname.toLowerCase()

  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '[::1]'
  ) {
    throw new Error('Local and loopback URLs are not allowed')
  }

  if (host.endsWith('.local') || host.endsWith('.internal')) {
    throw new Error('This hostname is not allowed')
  }

  if (host === '169.254.169.254' || host === 'metadata.google.internal') {
    throw new Error('This host is not allowed')
  }

  // Private / link-local IPv4 literals in hostname
  if (
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|127\.|169\.254\.)/.test(host)
  ) {
    throw new Error('Private and link-local addresses are not allowed')
  }

  return url
}
