import axios from 'axios'

// Determine backend API URL dynamically at runtime
const getApiUrl = () => {
  // If explicitly configured at build time (e.g. in .env or Vercel settings), use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  // Otherwise, inspect the current runtime window location
  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location
    // If not running on localhost, default to the current domain + /api
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${origin}/api`
    }
  }

  // Fallback for local development
  return 'http://localhost:4000/api'
}

const API_URL = getApiUrl()

if (import.meta.env.MODE === 'production') {
  console.log(`[API] Initialized with Base URL: ${API_URL}`);
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000
})

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('proact_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Global 401 handler – clear session but let React handle redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('proact_token')
      localStorage.removeItem('proact_user')
    }
    return Promise.reject(error)
  }
)

export const resolvePdfUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('blob:')) return url
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
  const backendBaseUrl = API_URL.replace(/\/api$/, '')
  const parts = url.split('/')
  const filename = parts[parts.length - 1]
  return `${backendBaseUrl}/api/uploads/${filename}`
}

export default api
