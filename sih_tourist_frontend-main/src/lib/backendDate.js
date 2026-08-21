/**
 * The original Spring backend parses Ticket.validFrom/validUntil with
 * LocalDateTime.parse(), so it expects a timezone-free value such as:
 * 2026-08-28T06:23:00
 *
 * Do not use Date#toISOString() for ticket payloads; it adds milliseconds and
 * a trailing Z (UTC), which LocalDateTime cannot parse.
 */
export function toBackendLocalDateTime(value) {
  if (value instanceof Date) return formatLocalDate(value)

  const raw = String(value ?? '').trim()
  if (!raw) return raw

  // datetime-local inputs are already local and normally look like YYYY-MM-DDTHH:mm.
  const normalized = raw.replace(/Z$/, '').replace(/\.\d+$/, '')
  const match = normalized.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::(\d{2}))?$/)
  if (match) return `${match[1]}:${match[2] || '00'}`

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) return formatLocalDate(parsed)
  return normalized
}

function formatLocalDate(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
