const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

async function request(path, options) {
  const response = await fetch(`${API_BASE}${path}`, options)
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`)
  }
  return payload
}

export function analyzeESG(file, company) {
  const form = new FormData()
  form.append('file', file)
  form.append('company', company)
  return request('/analyze', { method: 'POST', body: form })
}

export function healthCheck() {
  return request('/health')
}
