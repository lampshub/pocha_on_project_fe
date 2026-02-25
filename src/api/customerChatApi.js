import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL + '/chat'
});

// 요청 인터셉터로 토큰 자동 삽입
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const chatApi = {
  // 채팅방 생성/조회 (ChatRoomCreateReqDto 전달)
  getOrCreateRoom: (otherTableNum) => api.post('/room', { otherTableNum }),
  
  // 내 채팅방 목록 조회
  getMyActiveRooms: (storeId, tableNum) => api.get('/rooms', { params: { storeId, tableNum } }),
  
  // 읽음 처리
  markAsRead: (chatRoomId, tableNum) => api.post(`/room/${chatRoomId}/read`, null, { params: { tableNum } }),
  
  // 읽지 않은 개수 확인
  getUnreadCount: (chatRoomId, tableNum) => api.get(`/room/${chatRoomId}/unread`, { params: { tableNum } }),
  
  // 이전 메시지 조회
  getMessages: (chatRoomId) => api.get(`/room/${chatRoomId}/messages`),
};