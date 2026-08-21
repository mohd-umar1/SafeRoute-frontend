import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 12000,
})

export function getApiError(error, fallback = 'Something went wrong.') {
  return error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback
}
