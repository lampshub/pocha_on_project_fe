/**
 * useOwnerProfile
 * - 점주 마이페이지 정보 로딩
 * - 비밀번호 변경
 * - 로그아웃
 * - 사업자등록번호 포맷팅
 */
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios.js'

export function useOwnerProfile() {
  const router = useRouter()

  /** 점주 정보 (이름, 이메일, 전화번호, 사업자등록번호) */
  const ownerInfo = reactive({ name: '', email: '', phone: '', businessNumber: '' })

  /** 비밀번호 수정 모드 여부 */
  const editingPassword = ref(false)
  /** 기존 비밀번호 입력값 */
  const oldPassword = ref('')
  /** 새 비밀번호 입력값 */
  const newPassword = ref('')
  /** 기존 비밀번호 보기 토글 */
  const showOldPassword = ref(false)
  /** 새 비밀번호 보기 토글 */
  const showNewPassword = ref(false)

  /**
   * 사업자등록번호 포맷팅 (000-00-00000 형식)
   * @param {string} value - 원본 번호
   * @returns {string} 포맷팅된 번호
   */
  const formatBusinessNumber = (value) => {
    const digits = (value || '').replace(/\D/g, '').slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
  }

  /** 서버에서 점주 마이페이지 정보 가져오기 */
  const loadMyPage = async () => {
    try {
      const res = await api.get('/owner/mypage')
      ownerInfo.name = res.data.ownerName
      ownerInfo.email = res.data.ownerEmail
      ownerInfo.phone = res.data.phoneNumber
      ownerInfo.businessNumber = formatBusinessNumber(res.data.businessRegistrationNumber || '')
    } catch (e) {
      console.error('마이페이지 로딩 실패:', e)
    }
  }

  /** 비밀번호 변경 요청 */
  const savePassword = async () => {
    if (!oldPassword.value || !newPassword.value) return alert('모든 항목을 입력하세요.')
    try {
      await api.put('/owner/mypage/updatepassword', {
        oldPassword: oldPassword.value,
        newPassword: newPassword.value,
      })
      alert('비밀번호가 변경되었습니다.')
      cancelPasswordEdit()
    } catch (e) {
      alert(e.response?.data?.errorMessage || '비밀번호 변경 실패')
    }
  }

  /** 비밀번호 수정 모드 취소 및 초기화 */
  const cancelPasswordEdit = () => {
    editingPassword.value = false
    oldPassword.value = ''
    newPassword.value = ''
    showOldPassword.value = false
    showNewPassword.value = false
  }

  /** 로그아웃 (확인 후 localStorage 초기화 및 메인으로 이동) */
  const logout = () => {
    if (!confirm('로그아웃 하시겠습니까?')) return
    localStorage.clear()
    router.push('/')
  }

  return {
    ownerInfo,
    editingPassword,
    oldPassword,
    newPassword,
    showOldPassword,
    showNewPassword,
    loadMyPage,
    savePassword,
    cancelPasswordEdit,
    logout,
    formatBusinessNumber,
  }
}
