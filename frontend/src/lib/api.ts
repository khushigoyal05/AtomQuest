import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('atomquest_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // Try refresh
      const refreshToken = localStorage.getItem('atomquest_refresh')
      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
          localStorage.setItem('atomquest_token', res.data.token)
          error.config.headers.Authorization = `Bearer ${res.data.token}`
          return api.request(error.config)
        } catch {
          localStorage.removeItem('atomquest_token')
          localStorage.removeItem('atomquest_refresh')
          localStorage.removeItem('atomquest_user')
          window.location.href = '/login'
        }
      } else {
        localStorage.removeItem('atomquest_token')
        localStorage.removeItem('atomquest_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
