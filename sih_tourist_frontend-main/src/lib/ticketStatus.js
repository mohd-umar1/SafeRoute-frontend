export function parseBackendLocalDateTime(value) {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  const raw = String(value).trim()
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/)
  if (!match) {
    const parsed = new Date(raw)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6] || 0))
}

export function getTicketTiming(ticket, now = new Date()) {
  const from = parseBackendLocalDateTime(ticket?.validFrom)
  const until = parseBackendLocalDateTime(ticket?.validUntil)
  if (!from || !until) return { state: 'UNKNOWN', from, until }
  if (now < from) return { state: 'SCHEDULED', from, until }
  if (now > until) return { state: 'EXPIRED', from, until }
  return { state: 'ACTIVE', from, until }
}
