/**
 * useOwnerPanel
 * - 점주 패널(OwnerPanel)의 전체 스크립트 로직을 관리하는 컴포저블
 * - 실시간 주문, 테이블 현황, 웹소켓/SSE 연결, 직원 호출 상태,
 *   대시보드 이동, 라이프사이클 훅 등 모든 비즈니스 로직을 포함합니다.
 */
import { ref, computed, onMounted, onUnmounted, onActivated, onDeactivated, watch } from 'vue'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useStoreInfo } from '@/store/storeInfo'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { useOrderSocketStore } from '@/store/orderSocket'
import { useToast } from 'vue-toastification'

export function useOwnerPanel() {
  const toast = useToast()
  const router = useRouter()
  const realtimeOrders = ref([])
  const storeInfo = useStoreInfo()
  const tables = ref([])
  const showTableDetail = ref(false)
  const selectedTable = ref(null)
  const showTableView = ref(false)
  const orderSocket = useOrderSocketStore()
  const CALL_STORAGE_KEY = 'staffCallTables' // 호출 상태저장(화면이동후에도 남아있게)

  // 호출 중인 테이블 목록 (실시간 주문 위 호출 바에 표시)
  const calledTables = computed(() => tables.value.filter(t => t.hasCall))

  // 대시보드로 돌아가기
  const goBackToDashboard = () => {
    const baseToken = localStorage.getItem('baseAccessToken')
    if (baseToken) {
      localStorage.setItem('accessToken', baseToken)
      localStorage.removeItem('baseAccessToken')
    }
    localStorage.removeItem('currentStoreId')
    localStorage.removeItem('currentStoreName')
    localStorage.removeItem('currentStoreAddress')
    router.push('/another/dashboard')
  }

  // 호출 상태저장 - 로컬스토리지 저장
  const saveCallState = () => {
    const calledNums = tables.value.filter(t => t.hasCall).map(t => t.number)
    localStorage.setItem(CALL_STORAGE_KEY, JSON.stringify(calledNums))
  }
  const loadCallState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(CALL_STORAGE_KEY) || '[]')
      saved.forEach(num => {
        const table = tables.value.find(t => t.number === num)
        if (table) table.hasCall = true
      })
    } catch { /* 무시 */ }
  }

  // 호출알람끄기
  const dismissCall = (table) => {
    table.hasCall = false
    saveCallState()
  }

  // 토큰/storeId
  const accessToken = ref(localStorage.getItem('accessToken'))
  const storeId = ref(localStorage.getItem('ownerStoreId'))

  // 손님->점주 호출 SSE 연결
  let stompClient = null
  let eventSource = null

  // JWT에서 storeId 파싱
  const parseStoreIdFromToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.storeId
    } catch { return null }
  }

  // 웹소켓 연결
  const connectWebSocket = () => {
    if (!accessToken.value || !storeId.value) return
    stompClient = new Client({
      webSocketFactory: () => new SockJS(`${process.env.VUE_APP_API_BASE_URL}/connect`),
      connectHeaders: { Authorization: `Bearer ${accessToken.value}` },
      onConnect: () => {
        console.log('웹소켓 연결됨')
      },
      onStompError: (frame) => console.error('STOMP 에러:', frame),
    })
    stompClient.activate()
  }

  // SSE연결(직원호출 수신용)
  const connectSSE = () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    const baseUrl = process.env.VUE_APP_API_BASE_URL
    eventSource = new EventSourcePolyfill(`${baseUrl}/sse/connect`, {
      headers: { Authorization: `Bearer ${token}` },
      heartbeatTimeout: 180000, // 3분 (SSE 타임아웃 - 백엔드 heartbeat 주기보다 넉넉하게)
    })
    eventSource.addEventListener('connect', (e) => {
      console.log('SSE 연결 완료:', e.data)
    })
    // 직원호출 이벤트 수신
    eventSource.addEventListener('staffcall', (e) => {
      const data = JSON.parse(e.data)
      console.log('직원호출 수신:', data)

      // 실시간 주문 탭의 직원호출 박스에 호출 표시
      const table = tables.value.find(t => t.number === Number(data.tableNum))
      if (table) {
        table.hasCall = true
        saveCallState()
      }
      // 토스트 알림
      toast.warning(`🔔 ${data.message}`)
    })
    eventSource.onerror = (e) => { console.error('SSE 에러:', e) }
  }

  // ① 신규 주문 + 선물
  watch(
    () => orderSocket.lastOrderMessage,
    (msg) => {
      if (msg?.data) handleNewOrder(msg.data)
    }
  )

  // ② ORDER_DONE
  watch(
    () => orderSocket.lastQueueMessage,
    (msg) => {
      if (msg?.data?.type === 'ORDER_DONE') {
        realtimeOrders.value = realtimeOrders.value.filter(
          (o) => o.orderingId !== msg.data.orderingId
        )
      }
    }
  )

  // 새 주문 처리 (OrderCreateDto — /topic/order/ 구독)
  const handleNewOrder = (orderDto) => {
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    if (orderDto.type === 'PRESENT') {
      orderDto.menuDtoList?.forEach((menu) => {
        // 실시간 주문 카드
        realtimeOrders.value.push({
          id: `${orderDto.groupId}-${menu.menuName}-${Date.now()}`,
          tableNum: orderDto.senderTableNum,
          time,
          menu: `🎁 ${menu.menuName} → ${orderDto.receiverTableNum}번`,
          option: '선물',
          quantity: menu.menuQuantity,
          price: 0,
          status: '선물',
          orderingId: orderDto.orderingId,
        })

        let table = tables.value.find(t => t.number === orderDto.senderTableNum)
        if (table) {
          table.detailOrders.push({
            id: `${orderDto.groupId}-${menu.menuName}`,
            menu: `🎁 ${menu.menuName} → ${orderDto.receiverTableNum}번`,
            option: '선물',
            quantity: menu.menuQuantity,
            price: 0,
          })
        }
      })
      return
    }

    // ★ 실시간 주문 카드 (메뉴별 개별 카드)
    orderDto.webMenuList?.forEach((menu) => {
      const optionStr = menu.optionList
        ?.map(opt => `${opt.optionGroupName}: ${opt.optionDetailList?.map(d => d.optionDetailName).join(', ')}`)
        .join(' / ') || null

      realtimeOrders.value.push({
        id: `${orderDto.orderingId}-${menu.menuName}-${Date.now()}-${Math.random()}`,
        tableNum: orderDto.tableNum,
        time,
        menu: menu.menuName,
        option: optionStr,
        quantity: menu.quantity,
        price: menu.menuPrice ?? 0,
        status: '주문접수',
        orderingId: orderDto.orderingId,
      })
    })

    // ★ 테이블 카드 업데이트
    let table = tables.value.find((t) => t.number === orderDto.tableNum)
    if (!table) {
      table = { number: orderDto.tableNum, total: 0, hasCall: false, orders: [], detailOrders: [] }
      tables.value.push(table)
      tables.value.sort((a, b) => a.number - b.number)
    }
    // 메뉴별로 테이블에 누적
    orderDto.webMenuList?.forEach((menu) => {
      const optionStr = menu.optionList
        ?.map((opt) => `${opt.optionGroupName}: ${opt.optionDetailList?.map((d) => d.optionDetailName).join(', ')}`)
        .join(' / ') || null
      // 옵션 추가금액 합산
      const optionPrice = menu.optionList
        ?.flatMap((opt) => opt.optionDetailList ?? [])
        .reduce((sum, d) => sum + (d.optionDetailPrice ?? 0), 0) ?? 0
      const unitPrice = (menu.menuPrice ?? 0) + optionPrice

      // ★ 같은 메뉴+옵션이면 수량만 합산
      const existing = table.detailOrders.find(
        (d) => d.menu === menu.menuName && d.option === optionStr
      )
      if (existing) {
        existing.quantity += menu.quantity
      } else {
        table.detailOrders.push({
          id: `${orderDto.orderingId}-${menu.menuName}-${Date.now()}`,
          menu: menu.menuName,
          option: optionStr,
          quantity: menu.quantity,
          price: unitPrice,
        })
      }
      table.total += unitPrice * menu.quantity
    })
  }

  onMounted(async () => {
    // [FIX] storeInfo 로드 — 중복 호출 제거
    storeInfo.loadFromStorage()

    // storeId 토큰에서 파싱
    const token = localStorage.getItem('accessToken')
    if (token && !storeId.value) {
      const parsed = parseStoreIdFromToken(token)
      if (parsed) {
        storeId.value = String(parsed)
        localStorage.setItem('ownerStoreId', storeId.value)
      }
    }
    // 테이블 데이터가 없을 때만 API에서 로드 (keep-alive 복귀 시 보존)
    if (tables.value.length === 0) {
      try {
        const res = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/customertable/list`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        tables.value = res.data.map(t => ({
          number: t.tableNum,
          tableId: t.customerTableId,
          status: t.tableStatus,
          total: 0,
          hasCall: false,
          orders: [],
          detailOrders: []
        }))
        loadCallState()
      } catch (e) {
        toast.error(e.response?.data?.errorMessage || '테이블 불러오기 실패')
      }
    }

    // 새로고침 방지
    window.addEventListener('keydown', preventRefresh)

    // 웹소켓 연결
    connectWebSocket()

    // SSE연결(직원호출 수신용)
    connectSSE()

    // Pinia 주문 웹소켓 연결 확인
    if (!orderSocket.isConnected && storeId.value && token) {
      orderSocket.connect(storeId.value, token)
    }

    // standby 주문 복원 (페이지 진입마다)
    try {
      const res = await axios.get(
        `${process.env.VUE_APP_API_BASE_URL}/ordering/queue`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      res.data.forEach((order) => {
        order.orderingDetailInfos.forEach((detail) => {
          const exists = realtimeOrders.value.some(
            (o) => o.orderingId === order.orderingId && o.menu === detail.menuName
          )
          if (!exists) {
            realtimeOrders.value.push({
              id: `${order.orderingId}-${detail.menuName}-${Date.now()}`,
              orderingId: order.orderingId,
              tableNum: order.tableId,
              time: new Date(order.createAt).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              menu: detail.menuName,
              option: detail.option?.join(', ') || null,
              quantity: detail.quantity,
              price: 0,
              status: '주문접수',
            })
          }
        })
      })
    } catch (e) {
      console.log('standby 주문 조회 실패:', e)
    }
  })

  // ★ keep-alive에서 복귀할 때 (대시보드 갔다가 돌아올 때)
  onActivated(() => {
    console.log('OwnerPanel 활성화 (keep-alive 복귀)')

    // 토큰/storeId 갱신 (대시보드에서 토큰이 교체되었을 수 있음)
    const token = localStorage.getItem('accessToken')
    accessToken.value = token

    if (token) {
      const parsed = parseStoreIdFromToken(token)
      if (parsed) {
        storeId.value = String(parsed)
        localStorage.setItem('ownerStoreId', storeId.value)
      }
    }

    storeInfo.loadFromStorage()

    // Pinia 웹소켓 재연결 (토큰이 바뀌었으면 재연결 필요)
    if (storeId.value && token) {
      orderSocket.disconnect()
      orderSocket.connect(storeId.value, token)
    }

    // SSE 재연결 (직원호출용)
    eventSource?.close()
    connectSSE()
  })

  // ★ keep-alive에서 비활성화될 때 (다른 페이지로 이동)
  onDeactivated(() => {
    console.log('OwnerPanel 비활성화')
    // SSE만 정리 (WebSocket은 Pinia store가 관리)
    eventSource?.close()
  })

  onUnmounted(() => {
    stompClient?.deactivate()
    eventSource?.close()
    window.removeEventListener('keydown', preventRefresh)
  })

  // 새로고침 방지
  const preventRefresh = (e) => {
    if (
      e.key === 'F5' ||
      (e.ctrlKey && (e.key === 'r' || e.key === 'R')) ||
      (e.ctrlKey && e.shiftKey && (e.key === 'r' || e.key === 'R'))
    ) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  // 원화 표시
  const formatPrice = (price) => (price ?? 0).toLocaleString('ko-KR')

  // 테이블 클릭 시 상세 모달 오픈
  const openTableDetail = (table) => {
    selectedTable.value = table
    showTableDetail.value = true
  }

  // 조리 완료 처리
  const completeOrder = async (order) => {
    // 1. UI에서 이 카드만 제거
    realtimeOrders.value = realtimeOrders.value.filter(o => o.id !== order.id)

    // 2. 같은 orderingId의 남은 카드가 있는지 확인
    const remaining = realtimeOrders.value.filter(o => o.orderingId === order.orderingId)

    // 3. 마지막 카드였으면 백엔드 API 호출하여 주문 완료 처리
    if (remaining.length === 0) {
      try {
        await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/ordering/done/${order.orderingId}`,
          {},
          { headers: { Authorization: `Bearer ${accessToken.value}` } }
        )
      } catch (e) {
        toast.error(e.response?.data?.errorMessage || '주문완료 처리 실패')
      }
    }
  }

  return {
    // 상태
    realtimeOrders,
    storeInfo,
    tables,
    showTableDetail,
    selectedTable,
    showTableView,
    calledTables,
    accessToken,
    storeId,

    // 함수
    goBackToDashboard,
    dismissCall,
    formatPrice,
    openTableDetail,
    completeOrder,
  }
}
