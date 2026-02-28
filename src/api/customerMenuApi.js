import axios from 'axios'

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL,
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
    if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log(JSON.parse(atob(token.split('.')[1])))  
  }
  return config
})

export const customerMenuApi = {
  getCategories: () => api.get('/view/category'),
  getMenus:       ()             => api.get('/view/all'),
  getMenuDetail:  (menuId)       => api.get(`/view/${menuId}`),
  getCart:        ()             => api.get('/cart/list'),
  createCartLine: (payload)      => api.post('/cart/create', payload),
  updateCartQty:  (payload)      => api.patch('/cart/quantity', payload),
  deleteCartLine: (payload)      => api.delete('/cart/line', { data: payload }),
  createOrder:    (payload)      => api.post('/orders/create', payload),
  addOrder:       (gid, payload) => api.post(`/orders/add?groupId=${gid}`, payload),
  getOrderList:   (gid)          => api.get(`/orders/list?groupId=${gid}`),
  sendPresent: (payload) => api.post('/present/send', payload),
}