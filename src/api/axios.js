import axios from 'axios'

// ── 공통 axios 인스턴스 ──
const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL,
  timeout: 5000,
})

// 모든 요청에 토큰 자동으로 붙여줌
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
