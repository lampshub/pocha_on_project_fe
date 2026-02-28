/**
 * useCustomerAuth
 * - 고객 메뉴 페이지의 인증/테이블 정보 관련 로직
 * - JWT 토큰 파싱, 테이블/매장 정보 관리
 * - 관리자(점주) 인증 처리
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import axios from 'axios'

export function useCustomerAuth() {
  const toast = useToast()
  const router = useRouter()

  const GROUP_ID_KEY = 'currentGroupId'
  const TABLE_SESSION_KEY = 'customer_table_session'

  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      return JSON.parse(
        decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )
      )
    } catch (e) {
      return {}
    }
  }

  const tokenPayload = parseJwt(localStorage.getItem('accessToken') || '')
  const tableNum = ref(tokenPayload.tableNum || 0)
  const storeId = ref(tokenPayload.storeId || 1)
  const selectedTable = ref(tableNum.value ? { tableNum: tableNum.value } : null)
  const accessToken = ref(localStorage.getItem('accessToken'))

  // 관리자 인증
  const adminPassword = ref('')
  const showSettingsModal = ref(false)
  const clickCount = ref(0)
  const lastClickTime = ref(0)

  const openSettingsModal = () => {
    showSettingsModal.value = true
  }

  const closeSettingsModal = () => {
    showSettingsModal.value = false
    adminPassword.value = ''
  }

  const verifyAdminPassword = async () => {
    const customerTableId = tokenPayload.customerTableId
    if (!adminPassword.value) {
      toast.warning('비밀번호를 입력해주세요.')
      return
    }

    try {
      await axios.post(
        `${process.env.VUE_APP_API_BASE_URL}/owner/verify-password`,
        {
          password: adminPassword.value,
          customerTableId: customerTableId,
        }
      )

      const baseToken = localStorage.getItem('baseAccessToken')
      if (!baseToken) {
        toast.error('점주 세션 정보가 없습니다. 다시 로그인해주세요.')
        router.push('/')
        return
      }

      await releaseTable(false)
      localStorage.setItem('accessToken', baseToken)
      localStorage.removeItem('baseAccessToken')

      toast.success('관리자 인증 성공. 매장 선택 화면으로 이동합니다.')
      router.push('/another/dashboard')
    } catch (e) {
      console.error(e)
      toast.error('인증에 실패했습니다. 비밀번호를 확인해주세요.')
    }
  }

  const handleHiddenAdminTrigger = () => {
    const now = Date.now()
    if (now - lastClickTime.value > 1000) {
      clickCount.value = 0
    }
    lastClickTime.value = now
    clickCount.value++
    if (clickCount.value === 5) {
      clickCount.value = 0
      openSettingsModal()
    }
  }

  const releaseTable = (isExitingApp = false) => {
    const payload = parseJwt(localStorage.getItem('accessToken') || '')
    const customerTableId = payload.customerTableId
    if (!customerTableId) return

    const url = `${process.env.VUE_APP_API_BASE_URL}/customertable/tablerollback`

    if (isExitingApp === true || typeof isExitingApp === 'object') {
      const blob = new Blob([JSON.stringify({ customerTableId })], {
        type: 'application/json',
      })
      navigator.sendBeacon(url, blob)
    } else {
      axios
        .post(url, { customerTableId })
        .catch((e) => console.error('테이블 해제 실패:', e))
    }

    localStorage.removeItem(GROUP_ID_KEY)
  }

  return {
    GROUP_ID_KEY,
    TABLE_SESSION_KEY,
    parseJwt,
    tokenPayload,
    tableNum,
    storeId,
    selectedTable,
    accessToken,
    adminPassword,
    showSettingsModal,
    openSettingsModal,
    closeSettingsModal,
    verifyAdminPassword,
    handleHiddenAdminTrigger,
    releaseTable,
  }
}
