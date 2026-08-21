const STORAGE_KEY = 'saferoute.restrictedZones'
const EVENT_KEY = 'saferoute.restrictedZoneEvents'


export function readRestrictedZones() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveRestrictedZones(zones) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(zones))
  return zones
}

export function ensureSeedRestrictedZones() {
  const zones = readRestrictedZones()
  if (localStorage.getItem(STORAGE_KEY) === null) saveRestrictedZones([])
  return zones
}

export function addRestrictedZone(zone) {
  const zones = readRestrictedZones()
  const entry = {
    id: `zone-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: zone.name.trim(),
    description: zone.description?.trim() || '',
    latitude: Number(zone.latitude),
    longitude: Number(zone.longitude),
    radiusMeters: Number(zone.radiusMeters),
    createdAt: new Date().toISOString(),
  }
  saveRestrictedZones([entry, ...zones])
  return entry
}

export function updateRestrictedZone(id, patch) {
  const next = readRestrictedZones().map((zone) => zone.id === id ? {
    ...zone,
    ...patch,
    latitude: Number(patch.latitude ?? zone.latitude),
    longitude: Number(patch.longitude ?? zone.longitude),
    radiusMeters: Number(patch.radiusMeters ?? zone.radiusMeters),
  } : zone)
  saveRestrictedZones(next)
  return next.find((zone) => zone.id === id) || null
}

export function deleteRestrictedZone(id) {
  const next = readRestrictedZones().filter((zone) => zone.id !== id)
  saveRestrictedZones(next)
  return next
}

export function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const p1 = Number(lat1) * Math.PI / 180
  const p2 = Number(lat2) * Math.PI / 180
  const dLat = (Number(lat2) - Number(lat1)) * Math.PI / 180
  const dLng = (Number(lng2) - Number(lng1)) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function findRestrictedZone(lat, lng, zones = readRestrictedZones()) {
  if (lat == null || lng == null) return null
  return zones.find((zone) => distanceMeters(lat, lng, zone.latitude, zone.longitude) <= zone.radiusMeters) || null
}

function readEventMap() {
  try {
    const parsed = JSON.parse(localStorage.getItem(EVENT_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeEventMap(map) {
  localStorage.setItem(EVENT_KEY, JSON.stringify(map))
}

export function hasGeneratedZoneEvent(touristId, zoneId) {
  const map = readEventMap()
  return Boolean(map[`${touristId}:${zoneId}`])
}

export function markGeneratedZoneEvent(touristId, zoneId, details = {}) {
  const map = readEventMap()
  map[`${touristId}:${zoneId}`] = { ...details, createdAt: new Date().toISOString() }
  writeEventMap(map)
}

export function clearGeneratedZoneEvents(touristId) {
  const map = readEventMap()
  Object.keys(map).filter((key) => key.startsWith(`${touristId}:`)).forEach((key) => delete map[key])
  writeEventMap(map)
}
